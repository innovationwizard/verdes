"use client";

import { useState } from "react";
import { useShipmentStore } from "@/stores/shipment-store";
import { LABELS, CATEGORY_LABELS } from "@/lib/constants/labels";
import { formatUSD, formatGTQ, formatPct, formatNumber } from "@/lib/utils/currency";
import { ChevronDown, ChevronRight } from "lucide-react";

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-medium ${color ?? ""}`}>{value}</p>
    </div>
  );
}

export function PnlSummary() {
  const pnl = useShipmentStore((s) => s.pnl);
  const [expandedCosts, setExpandedCosts] = useState(false);

  const netColor =
    pnl.net_income_usd >= 0 ? "text-primary" : "text-destructive";

  return (
    <div className="border-t p-4">
      <p className="mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        {LABELS.estado_resultados}
      </p>

      {/* KPI Cards */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        <KpiCard
          label={LABELS.ingresos}
          value={formatUSD(pnl.total_revenue_usd)}
        />
        <KpiCard
          label={LABELS.margen_bruto}
          value={formatPct(pnl.gross_margin_pct)}
        />
        <KpiCard
          label={LABELS.utilidad_neta}
          value={formatUSD(pnl.net_income_usd)}
          color={netColor}
        />
        <KpiCard
          label={LABELS.margen_neto}
          value={formatPct(pnl.net_margin_pct)}
          color={netColor}
        />
      </div>

      {/* Detailed P&L Table */}
      <table className="w-full text-sm">
        <tbody>
          {/* Revenue */}
          <PnlRow
            label={LABELS.ingresos}
            usd={pnl.total_revenue_usd}
            gtq={pnl.total_revenue_gtq}
          />

          {/* Purchase cost */}
          <PnlRow
            label={LABELS.costo_compra}
            usd={-pnl.total_purchase_usd}
            gtq={-pnl.total_purchase_gtq}
            pct={
              pnl.total_revenue_usd > 0
                ? pnl.total_purchase_usd / pnl.total_revenue_usd
                : 0
            }
            dimmed
          />

          {/* Gross margin */}
          <PnlRow
            label={LABELS.margen_bruto}
            usd={pnl.gross_margin_usd}
            gtq={pnl.gross_margin_gtq}
            pct={pnl.gross_margin_pct}
            bold
            separator
          />

          {/* Operating costs (expandable) */}
          <tr
            className="cursor-pointer border-b hover:bg-muted/30"
            onClick={() => setExpandedCosts(!expandedCosts)}
          >
            <td className="py-1.5 pl-3 text-muted-foreground">
              <span className="flex items-center gap-1">
                {expandedCosts ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {LABELS.costos_operativos}
              </span>
            </td>
            <td className="py-1.5 text-right tabular-nums">
              ({formatNumber(pnl.total_operating_costs_usd)})
            </td>
            <td className="py-1.5 text-right text-muted-foreground tabular-nums">
              ({formatGTQ(pnl.total_operating_costs_gtq)})
            </td>
            <td className="py-1.5 text-right text-muted-foreground tabular-nums">
              {pnl.total_revenue_usd > 0
                ? formatPct(
                    pnl.total_operating_costs_usd / pnl.total_revenue_usd
                  )
                : "—"}
            </td>
          </tr>

          {/* Expanded cost categories */}
          {expandedCosts &&
            pnl.costs_by_category.map((cat) => (
              <tr key={cat.category} className="border-b bg-muted/20">
                <td className="py-1 pl-8 text-xs text-muted-foreground">
                  {CATEGORY_LABELS[cat.category] ?? cat.category}
                </td>
                <td className="py-1 text-right text-xs tabular-nums">
                  ({formatNumber(cat.total_usd)})
                </td>
                <td className="py-1 text-right text-xs text-muted-foreground tabular-nums">
                  ({formatGTQ(cat.total_gtq)})
                </td>
                <td className="py-1 text-right text-xs text-muted-foreground tabular-nums">
                  {formatPct(cat.pct_of_revenue)}
                </td>
              </tr>
            ))}

          {/* EBIT */}
          <PnlRow
            label={LABELS.ebit}
            usd={pnl.ebit_usd}
            gtq={pnl.ebit_gtq}
            pct={pnl.ebit_pct}
            bold
            separator
          />

          {/* Financial cost */}
          <PnlRow
            label={LABELS.costo_financiero}
            usd={-pnl.financial_cost_usd}
            gtq={-pnl.financial_cost_gtq}
            pct={
              pnl.total_revenue_usd > 0
                ? pnl.financial_cost_usd / pnl.total_revenue_usd
                : 0
            }
            dimmed
            indent
          />

          {/* Admin fixed */}
          <PnlRow
            label={LABELS.admin_fijo}
            usd={-pnl.admin_fixed_usd}
            gtq={-pnl.admin_fixed_gtq}
            pct={
              pnl.total_revenue_usd > 0
                ? pnl.admin_fixed_usd / pnl.total_revenue_usd
                : 0
            }
            dimmed
            indent
          />

          {/* EBT */}
          <PnlRow
            label={LABELS.utilidad_antes_isr}
            usd={pnl.ebt_usd}
            gtq={pnl.ebt_gtq}
            pct={pnl.ebt_pct}
            bold
            separator
          />

          {/* ISR */}
          <PnlRow
            label={`${LABELS.isr} (${formatPct(
              useShipmentStore.getState().params.isr_pct
            )})`}
            usd={-pnl.isr_usd}
            gtq={-pnl.isr_gtq}
            pct={
              pnl.total_revenue_usd > 0
                ? pnl.isr_usd / pnl.total_revenue_usd
                : 0
            }
            dimmed
            indent
          />

          {/* Net income */}
          <tr className="text-sm font-medium">
            <td className="py-2">{LABELS.utilidad_neta}</td>
            <td className={`py-2 text-right tabular-nums ${netColor}`}>
              {formatUSD(pnl.net_income_usd)}
            </td>
            <td className={`py-2 text-right tabular-nums ${netColor}`}>
              {formatGTQ(pnl.net_income_gtq)}
            </td>
            <td className={`py-2 text-right tabular-nums ${netColor}`}>
              {formatPct(pnl.net_margin_pct)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer metrics */}
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span>
          {LABELS.total_kilos}: {formatNumber(pnl.total_kilos_sold)}
        </span>
        <span>$/kg: {pnl.net_income_per_kg_usd.toFixed(4)}</span>
        <span>
          {LABELS.merma}: {formatNumber(pnl.merma_kg)} kg
        </span>
        <span>
          {LABELS.diferencia_merma}: {formatNumber(pnl.diferencia_merma_kg)} kg
        </span>
      </div>
    </div>
  );
}

function PnlRow({
  label,
  usd,
  gtq,
  pct,
  bold,
  dimmed,
  indent,
  separator,
}: {
  label: string;
  usd: number;
  gtq: number;
  pct?: number;
  bold?: boolean;
  dimmed?: boolean;
  indent?: boolean;
  separator?: boolean;
}) {
  const isNegative = usd < 0;
  const displayUsd = isNegative ? `(${formatNumber(Math.abs(usd))})` : formatUSD(usd);
  const displayGtq = isNegative
    ? `(${formatGTQ(Math.abs(gtq))})`
    : formatGTQ(gtq);

  return (
    <tr
      className={`border-b ${bold ? "font-medium" : ""} ${
        separator ? "border-b-2" : ""
      }`}
    >
      <td
        className={`py-1.5 ${indent ? "pl-6" : ""} ${
          dimmed ? "text-muted-foreground" : ""
        }`}
      >
        {label}
      </td>
      <td className="py-1.5 text-right tabular-nums">{displayUsd}</td>
      <td className="py-1.5 text-right text-muted-foreground tabular-nums">
        {displayGtq}
      </td>
      <td className="py-1.5 text-right text-muted-foreground tabular-nums">
        {pct !== undefined ? formatPct(pct) : ""}
      </td>
    </tr>
  );
}
