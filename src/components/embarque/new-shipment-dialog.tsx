"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LABELS } from "@/lib/constants/labels";
import { toast } from "sonner";

interface ShipmentOption {
  id: string;
  reference_code: string;
  status: string;
}

interface NewShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipments: ShipmentOption[];
}

export function NewShipmentDialog({
  open,
  onOpenChange,
  shipments,
}: NewShipmentDialogProps) {
  const [source, setSource] = useState("blank");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    setCreating(true);
    const supabase = createClient();

    // Generate reference code
    const { data: refCode } = await supabase.rpc("generate_reference_code");
    if (!refCode) {
      toast.error("Error al generar código de referencia");
      setCreating(false);
      return;
    }

    if (source === "blank") {
      // Create blank shipment with defaults
      const { data: shipment, error } = await supabase
        .from("shipments")
        .insert({
          reference_code: refCode,
          quantity_qq: 233,
          price_per_qq_gtq: 8000,
          bag_weight_kg: 46,
          exchange_rate: 7.75,
        })
        .select("id")
        .single();

      if (error || !shipment) {
        toast.error("Error al crear embarque");
        setCreating(false);
        return;
      }

      // Create one default 20ft container
      const { data: container } = await supabase
        .from("containers")
        .insert({
          shipment_id: shipment.id,
          size: "20ft",
          sequence_number: 1,
          capacity_kg: 10000,
        })
        .select("id")
        .single();

      // Create allocations for all quality grades
      if (container) {
        const { data: grades } = await supabase
          .from("quality_grades")
          .select("id")
          .eq("is_active", true)
          .order("sort_order");

        if (grades?.length) {
          await supabase.from("container_allocations").insert(
            grades.map((g) => ({
              container_id: container.id,
              quality_grade_id: g.id,
              kilos: 0,
              sale_price_usd_kg: 0,
            }))
          );
        }
      }

      // Snapshot current cost prices
      await snapshotCosts(supabase, shipment.id);

      router.push(`/embarques/${shipment.id}`);
      onOpenChange(false);
    } else {
      // Clone from existing shipment
      const sourceId = source;

      // Fetch source shipment
      const { data: src } = await supabase
        .from("shipments")
        .select(
          "*, containers(*, container_allocations(*))"
        )
        .eq("id", sourceId)
        .single();

      if (!src) {
        toast.error("Error al clonar embarque");
        setCreating(false);
        return;
      }

      // Create new shipment
      const { data: newShipment, error } = await supabase
        .from("shipments")
        .insert({
          reference_code: refCode,
          quantity_qq: src.quantity_qq,
          price_per_qq_gtq: src.price_per_qq_gtq,
          bag_weight_kg: src.bag_weight_kg,
          exchange_rate: src.exchange_rate,
          merma_pct: src.merma_pct,
          interest_rate_annual: src.interest_rate_annual,
          financing_months: src.financing_months,
          isr_pct: src.isr_pct,
          admin_fixed_usd: src.admin_fixed_usd,
          cloned_from_id: sourceId,
        })
        .select("id")
        .single();

      if (error || !newShipment) {
        toast.error("Error al clonar embarque");
        setCreating(false);
        return;
      }

      // Clone containers and allocations
      for (const srcContainer of src.containers ?? []) {
        const { data: newContainer } = await supabase
          .from("containers")
          .insert({
            shipment_id: newShipment.id,
            size: srcContainer.size,
            sequence_number: srcContainer.sequence_number,
            capacity_kg: srcContainer.capacity_kg,
          })
          .select("id")
          .single();

        if (newContainer && srcContainer.container_allocations?.length) {
          await supabase.from("container_allocations").insert(
            srcContainer.container_allocations.map(
              (a: { quality_grade_id: string; input_mode: "kilos" | "percentage"; kilos: number; percentage: number | null; sale_price_usd_kg: number }) => ({
                container_id: newContainer.id,
                quality_grade_id: a.quality_grade_id,
                input_mode: a.input_mode,
                kilos: a.kilos,
                percentage: a.percentage,
                sale_price_usd_kg: a.sale_price_usd_kg,
              })
            )
          );
        }
      }

      // Snapshot current cost prices (fresh, not from source)
      await snapshotCosts(supabase, newShipment.id);

      router.push(`/embarques/${newShipment.id}`);
      onOpenChange(false);
    }

    setCreating(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{LABELS.nuevo_embarque}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm">{LABELS.clonar_desde}</Label>
            <Select value={source} onValueChange={(v) => v && setSource(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">
                  {LABELS.embarque_en_blanco}
                </SelectItem>
                {shipments.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.reference_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full"
          >
            {creating ? "Creando..." : "Crear embarque"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

async function snapshotCosts(
  supabase: ReturnType<typeof createClient>,
  shipmentId: string
) {
  // Get all cost items with their latest prices
  const { data: items } = await supabase
    .from("cost_items")
    .select("id, cost_prices(*)")
    .eq("is_active", true);

  if (!items?.length) return;

  const rows = items
    .map((item) => {
      const prices = item.cost_prices ?? [];
      const latest = prices.sort(
        (a: { effective_at: string }, b: { effective_at: string }) =>
          new Date(b.effective_at).getTime() -
          new Date(a.effective_at).getTime()
      )[0];

      if (!latest) return null;

      return {
        shipment_id: shipmentId,
        cost_item_id: item.id,
        amount: latest.amount,
        currency: latest.currency,
        unit: latest.unit,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length) {
    await supabase.from("shipment_costs").insert(rows);
  }
}
