"use client";

import { formatNumber } from "@/lib/utils/currency";
import { LABELS } from "@/lib/constants/labels";

interface CapacityBarProps {
  allocatedKg: number;
  capacityKg: number;
  totalPurchasedKg: number;
  mermaPct: number;
}

export function CapacityBar({
  allocatedKg,
  capacityKg,
  totalPurchasedKg,
  mermaPct,
}: CapacityBarProps) {
  const pct = capacityKg > 0 ? (allocatedKg / capacityKg) * 100 : 0;
  const mermaKg = totalPurchasedKg * mermaPct;
  const unallocated = totalPurchasedKg - allocatedKg;

  let barColor = "bg-primary";
  if (pct > 100) barColor = "bg-red-500";
  else if (pct > 90) barColor = "bg-yellow-500";

  return (
    <div className="mt-3">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>
          {formatNumber(allocatedKg)} / {formatNumber(capacityKg)} kg{" "}
          {LABELS.asignado}
        </span>
        <span className={unallocated > mermaKg ? "text-yellow-600" : ""}>
          {formatNumber(unallocated)} kg {LABELS.sin_asignar} (merma:{" "}
          {formatNumber(mermaKg)})
        </span>
      </div>
    </div>
  );
}
