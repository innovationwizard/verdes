"use client";

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
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
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
  const params = useShipmentStore((s) => s.params);
  const pnl = useShipmentStore((s) => s.pnl);
  const setPurchase = useShipmentStore((s) => s.setPurchase);
  const setParam = useShipmentStore((s) => s.setParam);

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

      <Separator />

      {/* Section: Parameters */}
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {LABELS.parametros}
      </p>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{LABELS.merma}</span>
          <Input
            type="number"
            value={(params.merma_pct * 100).toFixed(1)}
            onChange={(e) =>
              setParam("merma_pct", (parseFloat(e.target.value) || 0) / 100)
            }
            step="0.1"
            className="h-6 w-16 text-right text-xs"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{LABELS.interes}</span>
          <Input
            type="number"
            value={(params.interest_rate_annual * 100).toFixed(2)}
            onChange={(e) =>
              setParam(
                "interest_rate_annual",
                (parseFloat(e.target.value) || 0) / 100
              )
            }
            step="0.25"
            className="h-6 w-16 text-right text-xs"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {LABELS.meses_financiamiento}
          </span>
          <Input
            type="number"
            value={params.financing_months}
            onChange={(e) =>
              setParam("financing_months", parseFloat(e.target.value) || 0)
            }
            step="0.5"
            className="h-6 w-16 text-right text-xs"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{LABELS.isr}</span>
          <Input
            type="number"
            value={(params.isr_pct * 100).toFixed(0)}
            onChange={(e) =>
              setParam("isr_pct", (parseFloat(e.target.value) || 0) / 100)
            }
            step="1"
            className="h-6 w-16 text-right text-xs"
          />
        </div>
      </div>
    </div>
  );
}
