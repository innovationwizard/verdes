import type {
  PnlInput,
  PnlResult,
  GradeRevenue,
  CategoryCostResult,
  CostItemResult,
  ContainerSummary,
  CostLineInput,
} from "./types";
import type { CostCategoryCode } from "@/types/database";
import { toUsd, toGtq } from "./helpers";

const CONTAINER_CAPACITY: Record<string, number> = {
  "20ft": 10000,
  "40ft": 23000,
};

/**
 * Pure P&L calculation engine.
 * Zero side effects. Inputs in, complete P&L out.
 */
export function calculatePnl(input: PnlInput): PnlResult {
  const { purchase, containers, costs, params } = input;
  const tc = purchase.exchange_rate;

  // ── Purchase ──────────────────────────────────────────────
  const total_kilos_purchased = purchase.quantity_qq * purchase.bag_weight_kg;
  const total_purchase_gtq = purchase.quantity_qq * purchase.price_per_qq_gtq;
  const total_purchase_usd = toUsd(total_purchase_gtq, tc);

  // ── Containers & Allocations ──────────────────────────────
  const containerSummaries: ContainerSummary[] = containers.map((c) => {
    const totalKilos = c.allocations.reduce((sum, a) => sum + a.kilos, 0);
    return {
      size: c.size,
      total_kilos: totalKilos,
      capacity_kg: CONTAINER_CAPACITY[c.size] ?? 10000,
      allocation_count: c.allocations.length,
    };
  });

  const total_kilos_sold = containerSummaries.reduce(
    (sum, c) => sum + c.total_kilos,
    0
  );
  const merma_kg = total_kilos_purchased * params.merma_pct;
  const diferencia_merma_kg = total_kilos_purchased - total_kilos_sold - merma_kg;

  // ── Revenue by grade ──────────────────────────────────────
  const gradeMap = new Map<
    string,
    { kilos: number; revenue: number; price: number }
  >();

  for (const container of containers) {
    for (const alloc of container.allocations) {
      const existing = gradeMap.get(alloc.quality_grade_code);
      const rev = alloc.kilos * alloc.sale_price_usd_kg;
      if (existing) {
        existing.kilos += alloc.kilos;
        existing.revenue += rev;
      } else {
        gradeMap.set(alloc.quality_grade_code, {
          kilos: alloc.kilos,
          revenue: rev,
          price: alloc.sale_price_usd_kg,
        });
      }
    }
  }

  const total_revenue_usd = Array.from(gradeMap.values()).reduce(
    (sum, g) => sum + g.revenue,
    0
  );
  const total_revenue_gtq = toGtq(total_revenue_usd, tc);

  const revenue_by_grade: GradeRevenue[] = Array.from(gradeMap.entries()).map(
    ([code, data]) => ({
      quality_grade_code: code,
      kilos: data.kilos,
      sale_price_usd_kg: data.price,
      revenue_usd: data.revenue,
      pct_of_revenue:
        total_revenue_usd > 0 ? data.revenue / total_revenue_usd : 0,
    })
  );

  // ── Gross margin ──────────────────────────────────────────
  const gross_margin_usd = total_revenue_usd - total_purchase_usd;
  const gross_margin_gtq = toGtq(gross_margin_usd, tc);
  const gross_margin_pct =
    total_revenue_usd > 0 ? gross_margin_usd / total_revenue_usd : 0;

  // ── Operating costs ───────────────────────────────────────
  const count_20ft = containers.filter((c) => c.size === "20ft").length;
  const count_40ft = containers.filter((c) => c.size === "40ft").length;
  const kilos_20ft = containers
    .filter((c) => c.size === "20ft")
    .reduce(
      (sum, c) => sum + c.allocations.reduce((s, a) => s + a.kilos, 0),
      0
    );
  const kilos_40ft = containers
    .filter((c) => c.size === "40ft")
    .reduce(
      (sum, c) => sum + c.allocations.reduce((s, a) => s + a.kilos, 0),
      0
    );

  const categoryGroups = new Map<CostCategoryCode, CostLineInput[]>();
  for (const cost of costs) {
    const existing = categoryGroups.get(cost.category) ?? [];
    existing.push(cost);
    categoryGroups.set(cost.category, existing);
  }

  const costs_by_category: CategoryCostResult[] = [];
  let total_operating_costs_usd = 0;

  for (const [category, items] of categoryGroups) {
    if (category === "admin_fixed") continue; // Admin fixed handled separately

    const costItems: CostItemResult[] = [];
    let categoryTotalUsd = 0;

    for (const item of items) {
      const computedAmountNative = computeCostAmount(
        item,
        purchase.quantity_qq,
        count_20ft,
        count_40ft,
        kilos_20ft,
        kilos_40ft,
        total_revenue_usd
      );

      let amountUsd: number;
      let amountGtq: number;

      if (item.currency === "GTQ") {
        amountGtq = computedAmountNative;
        amountUsd = toUsd(amountGtq, tc);
      } else {
        amountUsd = computedAmountNative;
        amountGtq = toGtq(amountUsd, tc);
      }

      costItems.push({
        name: item.name,
        amount_usd: amountUsd,
        amount_gtq: amountGtq,
      });

      categoryTotalUsd += amountUsd;
    }

    costs_by_category.push({
      category,
      label: category,
      total_usd: categoryTotalUsd,
      total_gtq: toGtq(categoryTotalUsd, tc),
      pct_of_revenue:
        total_revenue_usd > 0 ? categoryTotalUsd / total_revenue_usd : 0,
      items: costItems,
    });

    total_operating_costs_usd += categoryTotalUsd;
  }

  const total_operating_costs_gtq = toGtq(total_operating_costs_usd, tc);

  // ── EBIT ──────────────────────────────────────────────────
  const ebit_usd = gross_margin_usd - total_operating_costs_usd;
  const ebit_gtq = toGtq(ebit_usd, tc);
  const ebit_pct = total_revenue_usd > 0 ? ebit_usd / total_revenue_usd : 0;

  // ── Financial cost ────────────────────────────────────────
  // Base includes purchase + operating + admin_fixed (all in GTQ)
  const admin_fixed_usd = params.admin_fixed_usd;
  const admin_fixed_gtq = toGtq(admin_fixed_usd, tc);

  const financial_base_gtq =
    total_purchase_gtq + total_operating_costs_gtq + admin_fixed_gtq;
  const financial_cost_gtq =
    financial_base_gtq *
    ((params.interest_rate_annual * params.financing_months) / 12);
  const financial_cost_usd = toUsd(financial_cost_gtq, tc);

  // ── EBT (Utilidad antes de ISR) ───────────────────────────
  const ebt_usd = ebit_usd - financial_cost_usd - admin_fixed_usd;
  const ebt_gtq = toGtq(ebt_usd, tc);
  const ebt_pct = total_revenue_usd > 0 ? ebt_usd / total_revenue_usd : 0;

  // ── ISR ───────────────────────────────────────────────────
  const isr_usd = ebt_usd > 0 ? ebt_usd * params.isr_pct : 0;
  const isr_gtq = toGtq(isr_usd, tc);

  // ── Net income ────────────────────────────────────────────
  const net_income_usd = ebt_usd - isr_usd;
  const net_income_gtq = toGtq(net_income_usd, tc);
  const net_margin_pct =
    total_revenue_usd > 0 ? net_income_usd / total_revenue_usd : 0;

  // ── Per-unit metrics ──────────────────────────────────────
  const net_income_per_kg_usd =
    total_kilos_sold > 0 ? net_income_usd / total_kilos_sold : 0;
  const cost_per_kg_usd =
    total_kilos_sold > 0
      ? (total_purchase_usd +
          total_operating_costs_usd +
          financial_cost_usd +
          admin_fixed_usd) /
        total_kilos_sold
      : 0;

  return {
    total_kilos_purchased,
    total_purchase_gtq,
    total_purchase_usd,
    total_kilos_sold,
    merma_kg,
    diferencia_merma_kg,
    revenue_by_grade,
    total_revenue_usd,
    total_revenue_gtq,
    gross_margin_usd,
    gross_margin_gtq,
    gross_margin_pct,
    costs_by_category,
    total_operating_costs_usd,
    total_operating_costs_gtq,
    ebit_usd,
    ebit_gtq,
    ebit_pct,
    financial_cost_usd,
    financial_cost_gtq,
    admin_fixed_usd,
    admin_fixed_gtq,
    ebt_usd,
    ebt_gtq,
    ebt_pct,
    isr_usd,
    isr_gtq,
    net_income_usd,
    net_income_gtq,
    net_margin_pct,
    cost_per_kg_usd,
    net_income_per_kg_usd,
    containers: containerSummaries,
  };
}

function computeCostAmount(
  cost: CostLineInput,
  quantity_qq: number,
  count_20ft: number,
  count_40ft: number,
  kilos_20ft: number,
  kilos_40ft: number,
  total_revenue_usd: number
): number {
  switch (cost.category) {
    case "purchasing":
    case "maquila":
      // per_qq costs: amount is price per qq
      return cost.amount * quantity_qq;

    case "export_fixed_20":
      // flat per 20ft container
      return cost.amount * count_20ft;

    case "export_var_20":
      // per_kg for 20ft containers — amount is per-kg rate
      // but the Excel uses container capacity (10000) not actual allocated kilos
      return cost.amount * (count_20ft > 0 ? 10000 * count_20ft : 0);

    case "export_fixed_40":
      // flat per 40ft container
      return cost.amount * count_40ft;

    case "export_var_40":
      // per_kg for 40ft containers
      return cost.amount * (count_40ft > 0 ? 23000 * count_40ft : 0);

    case "invoice_variable":
      // percentage of total revenue (already in USD)
      return cost.amount * total_revenue_usd;

    case "admin_fixed":
      // Handled separately in the main function
      return cost.amount;

    default:
      return 0;
  }
}
