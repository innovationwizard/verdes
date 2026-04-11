"use client";

import { useState } from "react";
import { useShipmentStore } from "@/stores/shipment-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LABELS } from "@/lib/constants/labels";

interface FinancialParamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ParamField({
  label,
  externalValue,
  onCommit,
  step,
}: {
  label: string;
  externalValue: number;
  onCommit: (v: number) => void;
  step?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState("");

  const display = editing ? local : externalValue ? String(externalValue) : "";

  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <Input
        type="number"
        value={display}
        onFocus={() => {
          setLocal(externalValue ? String(externalValue) : "");
          setEditing(true);
        }}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          setEditing(false);
          onCommit(parseFloat(local) || 0);
        }}
        step={step}
        className="mt-1"
      />
    </div>
  );
}

export function FinancialParamsDialog({
  open,
  onOpenChange,
}: FinancialParamsDialogProps) {
  const params = useShipmentStore((s) => s.params);
  const setParam = useShipmentStore((s) => s.setParam);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{LABELS.parametros}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ParamField
            label={`${LABELS.merma} (%)`}
            externalValue={parseFloat((params.merma_pct * 100).toFixed(1))}
            onCommit={(v) => setParam("merma_pct", v / 100)}
            step="0.1"
          />
          <ParamField
            label={`${LABELS.interes} (%)`}
            externalValue={parseFloat((params.interest_rate_annual * 100).toFixed(2))}
            onCommit={(v) => setParam("interest_rate_annual", v / 100)}
            step="0.25"
          />
          <ParamField
            label={LABELS.meses_financiamiento}
            externalValue={params.financing_months}
            onCommit={(v) => setParam("financing_months", v)}
            step="0.5"
          />
          <ParamField
            label={`${LABELS.isr} (%)`}
            externalValue={parseFloat((params.isr_pct * 100).toFixed(0))}
            onCommit={(v) => setParam("isr_pct", v / 100)}
            step="1"
          />
          <ParamField
            label={`${LABELS.admin_fijo} (USD)`}
            externalValue={params.admin_fixed_usd}
            onCommit={(v) => setParam("admin_fixed_usd", v)}
            step="50"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
