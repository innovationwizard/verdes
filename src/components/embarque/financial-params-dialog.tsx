"use client";

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
          <div>
            <Label className="text-sm">{LABELS.merma} (%)</Label>
            <Input
              type="number"
              value={(params.merma_pct * 100).toFixed(1)}
              onChange={(e) =>
                setParam("merma_pct", (parseFloat(e.target.value) || 0) / 100)
              }
              step="0.1"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm">{LABELS.interes} (%)</Label>
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
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm">{LABELS.meses_financiamiento}</Label>
            <Input
              type="number"
              value={params.financing_months}
              onChange={(e) =>
                setParam("financing_months", parseFloat(e.target.value) || 0)
              }
              step="0.5"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm">{LABELS.isr} (%)</Label>
            <Input
              type="number"
              value={(params.isr_pct * 100).toFixed(0)}
              onChange={(e) =>
                setParam("isr_pct", (parseFloat(e.target.value) || 0) / 100)
              }
              step="1"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm">{LABELS.admin_fijo} (USD)</Label>
            <Input
              type="number"
              value={params.admin_fixed_usd}
              onChange={(e) =>
                setParam("admin_fixed_usd", parseFloat(e.target.value) || 0)
              }
              step="50"
              className="mt-1"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
