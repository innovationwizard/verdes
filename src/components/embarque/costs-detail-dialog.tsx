"use client";

import { useShipmentStore } from "@/stores/shipment-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { LABELS, CATEGORY_LABELS } from "@/lib/constants/labels";
import { formatNumber } from "@/lib/utils/currency";
import type { CostCategoryCode } from "@/types/database";

interface CostsDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_ORDER: CostCategoryCode[] = [
  "purchasing",
  "maquila",
  "export_fixed_20",
  "export_var_20",
  "export_fixed_40",
  "export_var_40",
  "invoice_variable",
];

export function CostsDetailDialog({
  open,
  onOpenChange,
}: CostsDetailDialogProps) {
  const costs = useShipmentStore((s) => s.costs);
  const setCostOverride = useShipmentStore((s) => s.setCostOverride);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    items: costs.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{LABELS.costos_operativos}</DialogTitle>
        </DialogHeader>

        <Accordion className="w-full">
          {grouped.map((group) => {
            const total = group.items.reduce((s, i) => s + i.amount, 0);
            return (
              <AccordionItem key={group.category} value={group.category}>
                <AccordionTrigger className="text-sm">
                  <div className="flex w-full items-center justify-between pr-4">
                    <span>{group.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {group.items[0]?.currency === "USD"
                        ? `$${formatNumber(total)}`
                        : `Q ${formatNumber(total)}`}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="py-1 text-left">Concepto</th>
                        <th className="py-1 text-right">
                          {LABELS.monto}
                        </th>
                        <th className="py-1 text-right">{LABELS.unidad}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item) => (
                        <tr key={item.name} className="border-b">
                          <td className="py-1.5 text-sm">{item.name}</td>
                          <td className="py-1.5 text-right">
                            <Input
                              type="number"
                              value={item.amount || ""}
                              onChange={(e) =>
                                setCostOverride(
                                  item.name,
                                  item.category,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              step="0.01"
                              className="ml-auto h-6 w-24 text-right text-xs"
                            />
                          </td>
                          <td className="py-1.5 text-right text-xs text-muted-foreground">
                            {item.unit === "pct_invoice"
                              ? `${(item.amount * 100).toFixed(2)}%`
                              : item.unit === "per_qq"
                              ? "/qq"
                              : item.unit === "per_kg"
                              ? "/kg"
                              : "fijo"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}
