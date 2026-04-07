"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LABELS, CATEGORY_LABELS } from "@/lib/constants/labels";
import { formatNumber } from "@/lib/utils/currency";
import { Plus, History } from "lucide-react";
import { toast } from "sonner";
import type { CostCategoryCode } from "@/types/database";

interface CostPrice {
  id: string;
  amount: number;
  currency: string;
  unit: string;
  notes: string | null;
  effective_at: string;
}

interface CostItem {
  id: string;
  category: CostCategoryCode;
  name: string;
  sort_order: number;
  cost_prices: CostPrice[];
}

interface CostManagementProps {
  costItems: CostItem[];
}

const CATEGORY_ORDER: CostCategoryCode[] = [
  "purchasing",
  "maquila",
  "export_fixed_20",
  "export_var_20",
  "export_fixed_40",
  "export_var_40",
  "invoice_variable",
  "admin_fixed",
];

function getLatestPrice(prices: CostPrice[]): CostPrice | undefined {
  return [...prices].sort(
    (a, b) =>
      new Date(b.effective_at).getTime() - new Date(a.effective_at).getTime()
  )[0];
}

export function CostManagement({ costItems: initialItems }: CostManagementProps) {
  const [items, setItems] = useState(initialItems);
  const [newPriceItem, setNewPriceItem] = useState<CostItem | null>(null);
  const [newAmount, setNewAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [historyItem, setHistoryItem] = useState<CostItem | null>(null);
  const [saving, setSaving] = useState(false);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  async function handleAddPrice() {
    if (!newPriceItem || !newAmount) return;
    setSaving(true);

    const supabase = createClient();
    const latestPrice = getLatestPrice(newPriceItem.cost_prices);

    const { data, error } = await supabase
      .from("cost_prices")
      .insert({
        cost_item_id: newPriceItem.id,
        amount: parseFloat(newAmount),
        currency: latestPrice?.currency ?? "GTQ",
        unit: latestPrice?.unit ?? "flat",
        notes: newNotes || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error al registrar precio");
      setSaving(false);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === newPriceItem.id
          ? { ...item, cost_prices: [...item.cost_prices, data] }
          : item
      )
    );

    toast.success("Precio registrado");
    setNewPriceItem(null);
    setNewAmount("");
    setNewNotes("");
    setSaving(false);
  }

  return (
    <>
      <Accordion className="w-full">
        {grouped.map((group) => (
          <AccordionItem key={group.category} value={group.category}>
            <AccordionTrigger className="text-sm">
              <div className="flex w-full items-center justify-between pr-4">
                <span className="font-medium">{group.label}</span>
                <span className="text-xs text-muted-foreground">
                  {group.items.length} conceptos
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-1.5 text-left">Concepto</th>
                    <th className="py-1.5 text-right">{LABELS.precio_actual}</th>
                    <th className="py-1.5 text-right">{LABELS.unidad}</th>
                    <th className="py-1.5 text-right">{LABELS.moneda}</th>
                    <th className="py-1.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item) => {
                    const latest = getLatestPrice(item.cost_prices);
                    return (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">{item.name}</td>
                        <td className="py-2 text-right tabular-nums">
                          {latest
                            ? latest.unit === "pct_invoice"
                              ? `${(latest.amount * 100).toFixed(2)}%`
                              : formatNumber(latest.amount)
                            : "—"}
                        </td>
                        <td className="py-2 text-right text-xs text-muted-foreground">
                          {latest?.unit === "pct_invoice"
                            ? "% factura"
                            : latest?.unit === "per_qq"
                            ? "por qq"
                            : latest?.unit === "per_kg"
                            ? "por kg"
                            : "fijo"}
                        </td>
                        <td className="py-2 text-right text-xs text-muted-foreground">
                          {latest?.currency ?? "—"}
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => setHistoryItem(item)}
                            >
                              <History className="mr-1 h-3 w-3" />
                              Historial
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => {
                                setNewPriceItem(item);
                                setNewAmount(
                                  latest ? String(latest.amount) : ""
                                );
                              }}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Nuevo
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* New Price Dialog */}
      <Dialog
        open={!!newPriceItem}
        onOpenChange={(open) => !open && setNewPriceItem(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{LABELS.registrar_precio}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{newPriceItem?.name}</p>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">{LABELS.monto}</Label>
              <Input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                step="0.01"
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-sm">{LABELS.notas}</Label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="mt-1"
                placeholder="Opcional"
              />
            </div>
            <Button
              onClick={handleAddPrice}
              disabled={saving || !newAmount}
              className="w-full"
            >
              {saving ? "Guardando..." : LABELS.registrar_precio}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={!!historyItem}
        onOpenChange={(open) => !open && setHistoryItem(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {LABELS.historial_precios}: {historyItem?.name}
            </DialogTitle>
          </DialogHeader>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-1 text-left">Fecha</th>
                <th className="py-1 text-right">{LABELS.monto}</th>
                <th className="py-1 text-left">{LABELS.notas}</th>
              </tr>
            </thead>
            <tbody>
              {historyItem?.cost_prices
                .sort(
                  (a, b) =>
                    new Date(b.effective_at).getTime() -
                    new Date(a.effective_at).getTime()
                )
                .map((price, i) => (
                  <tr key={price.id} className={`border-b ${i === 0 ? "font-medium" : "text-muted-foreground"}`}>
                    <td className="py-1.5">
                      {new Date(price.effective_at).toLocaleDateString("es-GT")}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {price.unit === "pct_invoice"
                        ? `${(price.amount * 100).toFixed(2)}%`
                        : formatNumber(price.amount)}
                    </td>
                    <td className="py-1.5 text-xs">
                      {price.notes ?? "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </>
  );
}
