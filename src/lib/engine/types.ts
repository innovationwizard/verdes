import type { CostCategoryCode } from "@/types/database";

export interface PnlInput {
  purchase: {
    quantity_qq: number;
    price_per_qq_gtq: number;
    bag_weight_kg: number;
    exchange_rate: number;
  };
  containers: ContainerInput[];
  costs: CostLineInput[];
  params: {
    merma_pct: number;
    interest_rate_annual: number;
    financing_months: number;
    isr_pct: number;
    admin_fixed_usd: number;
  };
}

export interface ContainerInput {
  size: "20ft" | "40ft";
  allocations: AllocationInput[];
}

export interface AllocationInput {
  quality_grade_code: string;
  kilos: number;
  sale_price_usd_kg: number;
}

export interface CostLineInput {
  category: CostCategoryCode;
  name: string;
  amount: number;
  currency: "GTQ" | "USD";
  unit: "flat" | "per_qq" | "per_kg" | "pct_invoice";
}

export interface GradeRevenue {
  quality_grade_code: string;
  kilos: number;
  sale_price_usd_kg: number;
  revenue_usd: number;
  pct_of_revenue: number;
}

export interface CategoryCostResult {
  category: CostCategoryCode;
  label: string;
  total_usd: number;
  total_gtq: number;
  pct_of_revenue: number;
  items: CostItemResult[];
}

export interface CostItemResult {
  name: string;
  amount_usd: number;
  amount_gtq: number;
}

export interface ContainerSummary {
  size: "20ft" | "40ft";
  total_kilos: number;
  capacity_kg: number;
  allocation_count: number;
}

export interface PnlResult {
  // Purchase
  total_kilos_purchased: number;
  total_purchase_gtq: number;
  total_purchase_usd: number;

  // Allocations
  total_kilos_sold: number;
  merma_kg: number;
  diferencia_merma_kg: number;

  // Revenue
  revenue_by_grade: GradeRevenue[];
  total_revenue_usd: number;
  total_revenue_gtq: number;

  // Margins
  gross_margin_usd: number;
  gross_margin_gtq: number;
  gross_margin_pct: number;

  // Operating costs
  costs_by_category: CategoryCostResult[];
  total_operating_costs_usd: number;
  total_operating_costs_gtq: number;

  // EBIT
  ebit_usd: number;
  ebit_gtq: number;
  ebit_pct: number;

  // Financial
  financial_cost_usd: number;
  financial_cost_gtq: number;

  // Admin
  admin_fixed_usd: number;
  admin_fixed_gtq: number;

  // EBT
  ebt_usd: number;
  ebt_gtq: number;
  ebt_pct: number;

  // Tax
  isr_usd: number;
  isr_gtq: number;

  // Net
  net_income_usd: number;
  net_income_gtq: number;
  net_margin_pct: number;

  // Per-unit
  cost_per_kg_usd: number;
  net_income_per_kg_usd: number;

  // Container summaries
  containers: ContainerSummary[];
}
