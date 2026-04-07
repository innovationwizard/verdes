"use client";

import { useShipmentStore } from "@/stores/shipment-store";
import type { ContainerData } from "@/stores/shipment-store";
import { Input } from "@/components/ui/input";
import { LABELS } from "@/lib/constants/labels";
import { formatNumber, formatPct } from "@/lib/utils/currency";

const TIER_BG: Record<string, string> = {
  top: "bg-emerald-50/50",
  medium: "bg-blue-50/50",
  low: "",
};

interface AllocationTableProps {
  container: ContainerData;
}

export function AllocationTable({ container }: AllocationTableProps) {
  const qualityGrades = useShipmentStore((s) => s.qualityGrades);
  const setAllocation = useShipmentStore((s) => s.setAllocation);
  const setAllocationPercentage = useShipmentStore(
    (s) => s.setAllocationPercentage
  );
  const setContainerInputMode = useShipmentStore(
    (s) => s.setContainerInputMode
  );
  const isPercentageMode = container.input_mode === "percentage";

  const totalKilos = container.allocations.reduce((s, a) => s + a.kilos, 0);
  const totalRevenue = container.allocations.reduce(
    (s, a) => s + a.kilos * a.sale_price_usd_kg,
    0
  );

  return (
    <div>
      {/* Input mode toggle */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Entrada:</span>
        <button
          className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
            !isPercentageMode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          onClick={() => setContainerInputMode(container.id, "kilos")}
        >
          kg
        </button>
        <button
          className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
            isPercentageMode
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          onClick={() => setContainerInputMode(container.id, "percentage")}
        >
          %
        </button>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-2 py-1.5 text-left text-[11px] font-medium text-muted-foreground">
              {LABELS.calidad}
            </th>
            <th className="px-2 py-1.5 text-right text-[11px] font-medium text-muted-foreground">
              {isPercentageMode ? "%" : LABELS.kilos}
            </th>
            <th className="px-2 py-1.5 text-right text-[11px] font-medium text-muted-foreground">
              {LABELS.precio_venta}
            </th>
            <th className="px-2 py-1.5 text-right text-[11px] font-medium text-muted-foreground">
              {LABELS.ingreso}
            </th>
            <th className="px-2 py-1.5 text-right text-[11px] font-medium text-muted-foreground">
              {LABELS.porcentaje}
            </th>
          </tr>
        </thead>
        <tbody>
          {container.allocations.map((alloc) => {
            const grade = qualityGrades.find(
              (g) => g.code === alloc.quality_grade_code
            );
            const revenue = alloc.kilos * alloc.sale_price_usd_kg;
            const pctOfTotal =
              totalRevenue > 0 ? revenue / totalRevenue : 0;

            return (
              <tr
                key={alloc.quality_grade_code}
                className={`border-b ${TIER_BG[grade?.tier ?? ""]}`}
              >
                <td className="px-2 py-1.5 font-medium">
                  {grade?.display_name ?? alloc.quality_grade_code}
                </td>
                <td className="px-2 py-1.5 text-right">
                  {isPercentageMode ? (
                    <Input
                      type="number"
                      value={
                        alloc.percentage !== null
                          ? (alloc.percentage * 100).toFixed(1)
                          : ""
                      }
                      onChange={(e) =>
                        setAllocationPercentage(
                          container.id,
                          alloc.quality_grade_code,
                          (parseFloat(e.target.value) || 0) / 100
                        )
                      }
                      step="0.1"
                      className="ml-auto h-6 w-20 text-right text-xs"
                    />
                  ) : (
                    <Input
                      type="number"
                      value={alloc.kilos || ""}
                      onChange={(e) =>
                        setAllocation(
                          container.id,
                          alloc.quality_grade_code,
                          "kilos",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      step="100"
                      className="ml-auto h-6 w-20 text-right text-xs"
                    />
                  )}
                </td>
                <td className="px-2 py-1.5 text-right">
                  <Input
                    type="number"
                    value={alloc.sale_price_usd_kg || ""}
                    onChange={(e) =>
                      setAllocation(
                        container.id,
                        alloc.quality_grade_code,
                        "sale_price_usd_kg",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    step="0.25"
                    className="ml-auto h-6 w-20 text-right text-xs"
                  />
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {revenue > 0 ? formatNumber(revenue) : "—"}
                </td>
                <td className="px-2 py-1.5 text-right text-muted-foreground tabular-nums">
                  {pctOfTotal > 0 ? formatPct(pctOfTotal) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 font-medium">
            <td className="px-2 py-1.5">Total</td>
            <td className="px-2 py-1.5 text-right tabular-nums">
              {formatNumber(totalKilos)}
            </td>
            <td className="px-2 py-1.5" />
            <td className="px-2 py-1.5 text-right tabular-nums">
              {formatNumber(totalRevenue)}
            </td>
            <td className="px-2 py-1.5" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
