"use client";

import { useState } from "react";
import { useShipmentStore } from "@/stores/shipment-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LABELS } from "@/lib/constants/labels";
import { formatNumber } from "@/lib/utils/currency";

function NumberInput({
  label,
  value,
  onChange,
  step,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
  suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState("");

  const display = editing ? local : value ? String(value) : "";

  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          value={display}
          onFocus={() => {
            setLocal(value ? String(value) : "");
            setEditing(true);
          }}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => {
            setEditing(false);
            onChange(parseFloat(local) || 0);
          }}
          step={step ?? "1"}
          className="h-8 text-sm"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}


export function PurchasePanel() {
  const purchase = useShipmentStore((s) => s.purchase);
  const pnl = useShipmentStore((s) => s.pnl);
  const setPurchase = useShipmentStore((s) => s.setPurchase);

  return (
    <div className="flex flex-col gap-4 border-r p-4" style={{ width: 260 }}>
      {/* Section: Purchase */}
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {LABELS.compra}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label={LABELS.quintales}
          value={purchase.quantity_qq}
          onChange={(v) => setPurchase("quantity_qq", v)}
        />
        <NumberInput
          label={LABELS.peso_saco}
          value={purchase.bag_weight_kg}
          onChange={(v) => setPurchase("bag_weight_kg", v)}
          suffix="kg"
        />
      </div>

      <NumberInput
        label={LABELS.precio_qq}
        value={purchase.price_per_qq_gtq}
        onChange={(v) => setPurchase("price_per_qq_gtq", v)}
        step="100"
      />

      <NumberInput
        label={LABELS.tipo_cambio}
        value={purchase.exchange_rate}
        onChange={(v) => setPurchase("exchange_rate", v)}
        step="0.01"
      />

      <Separator />

      {/* Computed totals */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{LABELS.total_kg}</span>
          <span className="font-medium">
            {formatNumber(pnl.total_kilos_purchased)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{LABELS.total_q}</span>
          <span className="font-medium">
            {formatNumber(pnl.total_purchase_gtq)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{LABELS.total_usd}</span>
          <span className="font-medium">
            {formatNumber(pnl.total_purchase_usd)}
          </span>
        </div>
      </div>

    </div>
  );
}
