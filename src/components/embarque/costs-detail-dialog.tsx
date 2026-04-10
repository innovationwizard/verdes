"use client";

import { useState, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LABELS, CATEGORY_LABELS } from "@/lib/constants/labels";
import { formatNumber, formatGTQ } from "@/lib/utils/currency";
import { Plus, X } from "lucide-react";
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

const VARIABLE_EXPORT_CATEGORIES: CostCategoryCode[] = [
  "export_var_20",
  "export_var_40",
];

const FIXED_EXPORT_CATEGORIES: CostCategoryCode[] = [
  "export_fixed_20",
  "export_fixed_40",
];

const CAPACITY: Record<string, number> = {
  export_var_20: 10000,
  export_var_40: 23000,
};

/**
 * Input that keeps local state while focused so store-driven re-renders
 * don't overwrite the user's in-progress typing.
 */
function LocalNumberInput({
  externalValue,
  onCommit,
  step,
  className,
}: {
  externalValue: number;
  onCommit: (v: number) => void;
  step?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const display = editing ? local : externalValue ? String(externalValue) : "";

  return (
    <Input
      ref={inputRef}
      type="number"
      value={display}
      onFocus={() => {
        setLocal(externalValue ? String(externalValue) : "");
        setEditing(true);
      }}
      onChange={(e) => {
        setLocal(e.target.value);
      }}
      onBlur={() => {
        setEditing(false);
        onCommit(parseFloat(local) || 0);
      }}
      step={step}
      className={className}
    />
  );
}

export function CostsDetailDialog({
  open,
  onOpenChange,
}: CostsDetailDialogProps) {
  const costs = useShipmentStore((s) => s.costs);
  const containers = useShipmentStore((s) => s.containers);
  const pnl = useShipmentStore((s) => s.pnl);
  const setCostOverride = useShipmentStore((s) => s.setCostOverride);
  const addExtraCost = useShipmentStore((s) => s.addExtraCost);
  const removeExtraCost = useShipmentStore((s) => s.removeExtraCost);
  const renameExtraCost = useShipmentStore((s) => s.renameExtraCost);

  const has20ft = containers.some((c) => c.size === "20ft");
  const has40ft = containers.some((c) => c.size === "40ft");

  const visibleCategories = CATEGORY_ORDER.filter((cat) => {
    if (cat === "export_fixed_20" || cat === "export_var_20") return has20ft;
    if (cat === "export_fixed_40" || cat === "export_var_40") return has40ft;
    return true;
  });

  const grouped = visibleCategories
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
      items: costs.filter((c) => c.category === cat),
      isVariableExport: VARIABLE_EXPORT_CATEGORIES.includes(cat),
      isFixedExport: FIXED_EXPORT_CATEGORIES.includes(cat),
      isInvoiceVariable: cat === "invoice_variable",
      capacity: CAPACITY[cat] ?? 0,
    }))
    .filter((g) => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{LABELS.costos_operativos}</DialogTitle>
        </DialogHeader>

        <Accordion className="w-full">
          {grouped.map((group) => {
            let displayTotal: number;
            if (group.isVariableExport) {
              displayTotal = group.items.reduce(
                (s, i) => s + i.amount * group.capacity,
                0
              );
            } else if (group.isInvoiceVariable) {
              displayTotal = group.items.reduce(
                (s, i) => s + i.amount * pnl.total_revenue_gtq,
                0
              );
            } else {
              displayTotal = group.items.reduce((s, i) => s + i.amount, 0);
            }

            return (
              <AccordionItem key={group.category} value={group.category}>
                <AccordionTrigger className="text-sm">
                  <div className="flex w-full items-center justify-between pr-4">
                    <span>{group.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {group.isInvoiceVariable
                        ? formatGTQ(displayTotal)
                        : group.items[0]?.currency === "USD"
                        ? `$${formatNumber(displayTotal)}`
                        : `Q ${formatNumber(displayTotal)}`}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {group.isVariableExport && (
                    <p className="mb-2 text-[11px] text-muted-foreground">
                      Ingrese el monto total en Q por contenedor
                    </p>
                  )}

                  {group.isInvoiceVariable ? (
                    <InvoiceVariableTable
                      items={group.items}
                      revenueGtq={pnl.total_revenue_gtq}
                      onOverride={setCostOverride}
                    />
                  ) : (
                    <>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-xs text-muted-foreground">
                            <th className="py-1 text-left">Concepto</th>
                            <th className="py-1 text-right">
                              {group.isVariableExport
                                ? "Total Q"
                                : LABELS.monto}
                            </th>
                            <th className="py-1 text-right">
                              {group.isVariableExport ? "Q/kg" : LABELS.unidad}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((item) => {
                            const isExtra = item.name.startsWith("Extra:");
                            const displayValue = group.isVariableExport
                              ? item.amount * group.capacity
                              : item.amount;

                            return (
                              <tr key={item.name} className="border-b">
                                <td className="py-1.5 text-sm">
                                  {isExtra ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        value={item.name.replace("Extra: ", "")}
                                        onChange={(e) =>
                                          renameExtraCost(
                                            item.name,
                                            item.category,
                                            `Extra: ${e.target.value}`
                                          )
                                        }
                                        placeholder="Concepto"
                                        className="h-6 w-36 text-xs"
                                      />
                                      <button
                                        onClick={() =>
                                          removeExtraCost(
                                            item.name,
                                            item.category
                                          )
                                        }
                                        className="text-muted-foreground hover:text-destructive"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    item.name
                                  )}
                                </td>
                                <td className="py-1.5 text-right">
                                  <LocalNumberInput
                                    externalValue={displayValue}
                                    onCommit={(inputVal) => {
                                      const storeVal = group.isVariableExport
                                        ? inputVal / group.capacity
                                        : inputVal;
                                      setCostOverride(
                                        item.name,
                                        item.category,
                                        storeVal
                                      );
                                    }}
                                    step={
                                      group.isVariableExport ? "1" : "0.01"
                                    }
                                    className="ml-auto h-6 w-28 text-right text-xs"
                                  />
                                </td>
                                <td className="py-1.5 text-right text-xs text-muted-foreground tabular-nums">
                                  {group.isVariableExport
                                    ? formatNumber(item.amount)
                                    : item.unit === "per_qq"
                                    ? "/qq"
                                    : item.unit === "per_kg"
                                    ? "/kg"
                                    : "fijo"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* "Agregar otro" for fixed export categories */}
                      {group.isFixedExport && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 w-full text-xs text-muted-foreground"
                          onClick={() => addExtraCost(group.category)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Agregar otro
                        </Button>
                      )}
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceVariableTable({
  items,
  revenueGtq,
  onOverride,
}: {
  items: { name: string; category: string; amount: number }[];
  revenueGtq: number;
  onOverride: (name: string, category: string, amount: number) => void;
}) {
  const totalPct = items.reduce((s, i) => s + i.amount, 0);
  const totalGtq = totalPct * revenueGtq;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-xs text-muted-foreground">
          <th className="py-1 text-left">Concepto</th>
          <th className="py-1 text-right">%</th>
          <th className="py-1 text-right">Monto Q</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const amountGtq = item.amount * revenueGtq;

          return (
            <tr key={item.name} className="border-b">
              <td className="py-1.5 text-sm">{item.name}</td>
              <td className="py-1.5 text-right">
                <LocalNumberInput
                  externalValue={
                    item.amount > 0
                      ? parseFloat((item.amount * 100).toFixed(2))
                      : 0
                  }
                  onCommit={(pctVal) => {
                    onOverride(item.name, item.category, pctVal / 100);
                  }}
                  step="0.01"
                  className="ml-auto h-6 w-20 text-right text-xs"
                />
              </td>
              <td className="py-1.5 text-right text-xs text-muted-foreground tabular-nums">
                {amountGtq > 0 ? formatGTQ(amountGtq) : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="border-t font-medium">
          <td className="py-1.5">Total</td>
          <td className="py-1.5 text-right text-xs tabular-nums">
            {(totalPct * 100).toFixed(2)}%
          </td>
          <td className="py-1.5 text-right text-xs tabular-nums">
            {formatGTQ(totalGtq)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
