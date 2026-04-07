"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useShipmentStore } from "@/stores/shipment-store";
import type {
  QualityGradeInfo,
  ContainerData,
  AllocationData,
} from "@/stores/shipment-store";
import type { CostLineInput } from "@/lib/engine/types";
import { createClient } from "@/lib/supabase/client";
import { ShipmentHeader } from "./shipment-header";
import { PurchasePanel } from "./purchase-panel";
import { ContainerPanel } from "./container-panel";
import { PnlSummary } from "./pnl-summary";
import { CostsDetailDialog } from "./costs-detail-dialog";
import { FinancialParamsDialog } from "./financial-params-dialog";
import { toast } from "sonner";
import { LABELS } from "@/lib/constants/labels";

interface ShipmentWorkspaceProps {
  shipment: Record<string, unknown>;
  qualityGrades: QualityGradeInfo[];
}

export function ShipmentWorkspace({
  shipment,
  qualityGrades,
}: ShipmentWorkspaceProps) {
  const loadShipment = useShipmentStore((s) => s.loadShipment);
  const isDirty = useShipmentStore((s) => s.isDirty);
  const markClean = useShipmentStore((s) => s.markClean);
  const [costsOpen, setCostsOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved"
  );
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Transform server data into store format
  useEffect(() => {
    const s = shipment as Record<string, unknown>;
    const containers = (s.containers as Array<Record<string, unknown>>) ?? [];
    const shipmentCosts =
      (s.shipment_costs as Array<Record<string, unknown>>) ?? [];

    const transformedContainers: ContainerData[] = containers.map((c) => {
      const allocations =
        (c.container_allocations as Array<Record<string, unknown>>) ?? [];

      // Build allocations for ALL quality grades
      const allocMap = new Map<string, AllocationData>();
      for (const a of allocations) {
        const grade = a.quality_grades as Record<string, unknown> | null;
        if (!grade) continue;
        allocMap.set(grade.id as string, {
          quality_grade_id: grade.id as string,
          quality_grade_code: grade.code as string,
          kilos: a.kilos as number,
          percentage: a.percentage as number | null,
          sale_price_usd_kg: a.sale_price_usd_kg as number,
        });
      }

      // Ensure all quality grades are represented
      const fullAllocations: AllocationData[] = qualityGrades.map((g) => {
        const existing = allocMap.get(g.id);
        if (existing) return existing;
        return {
          quality_grade_id: g.id,
          quality_grade_code: g.code,
          kilos: 0,
          percentage: null,
          sale_price_usd_kg: 0,
        };
      });

      return {
        id: c.id as string,
        size: c.size as "20ft" | "40ft",
        sequence_number: c.sequence_number as number,
        capacity_kg: c.capacity_kg as number,
        input_mode: "kilos" as const,
        allocations: fullAllocations,
      };
    });

    // Transform costs
    const transformedCosts: CostLineInput[] = shipmentCosts.map((sc) => {
      const costItem = sc.cost_items as Record<string, unknown>;
      return {
        category: costItem.category as CostLineInput["category"],
        name: costItem.name as string,
        amount: sc.amount as number,
        currency: sc.currency as "GTQ" | "USD",
        unit: sc.unit as CostLineInput["unit"],
      };
    });

    loadShipment({
      meta: {
        id: s.id as string,
        reference_code: s.reference_code as string,
        status: s.status as "draft" | "in_progress" | "complete" | "cancelled",
        date: s.date as string,
        label: s.label as string | null,
      },
      purchase: {
        quantity_qq: s.quantity_qq as number,
        price_per_qq_gtq: s.price_per_qq_gtq as number,
        bag_weight_kg: s.bag_weight_kg as number,
        exchange_rate: s.exchange_rate as number,
      },
      containers: transformedContainers,
      costs: transformedCosts,
      params: {
        merma_pct: s.merma_pct as number,
        interest_rate_annual: s.interest_rate_annual as number,
        financing_months: s.financing_months as number,
        isr_pct: s.isr_pct as number,
        admin_fixed_usd: s.admin_fixed_usd as number,
      },
      qualityGrades,
    });
  }, [shipment, qualityGrades, loadShipment]);

  // Auto-save with debounce
  const save = useCallback(async () => {
    const state = useShipmentStore.getState();
    if (!state.isDirty || !state.meta.id) return;

    setSaveStatus("saving");
    const supabase = createClient();

    // Save shipment
    const { error: shipmentError } = await supabase
      .from("shipments")
      .update({
        quantity_qq: state.purchase.quantity_qq,
        price_per_qq_gtq: state.purchase.price_per_qq_gtq,
        bag_weight_kg: state.purchase.bag_weight_kg,
        exchange_rate: state.purchase.exchange_rate,
        merma_pct: state.params.merma_pct,
        interest_rate_annual: state.params.interest_rate_annual,
        financing_months: state.params.financing_months,
        isr_pct: state.params.isr_pct,
        admin_fixed_usd: state.params.admin_fixed_usd,
        status: state.meta.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", state.meta.id);

    if (shipmentError) {
      setSaveStatus("error");
      toast.error(LABELS.error_guardar);
      return;
    }

    // Save allocations
    for (const container of state.containers) {
      for (const alloc of container.allocations) {
        await supabase
          .from("container_allocations")
          .upsert(
            {
              container_id: container.id,
              quality_grade_id: alloc.quality_grade_id,
              kilos: alloc.kilos,
              percentage: alloc.percentage,
              sale_price_usd_kg: alloc.sale_price_usd_kg,
              input_mode: container.input_mode,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "container_id,quality_grade_id" }
          );
      }
    }

    // Save cost overrides
    for (const cost of state.costs) {
      await supabase
        .from("shipment_costs")
        .update({ amount: cost.amount })
        .eq("shipment_id", state.meta.id)
        .eq("unit", cost.unit)
        .filter(
          "cost_item_id",
          "in",
          `(SELECT id FROM cost_items WHERE name = '${cost.name}' AND category = '${cost.category}')`
        );
    }

    markClean();
    setSaveStatus("saved");
  }, [markClean]);

  useEffect(() => {
    if (!isDirty) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, save]);

  return (
    <div className="flex flex-col rounded-lg border bg-card">
      <div className="relative">
        <ShipmentHeader
          onOpenCosts={() => setCostsOpen(true)}
          onOpenFinancial={() => setFinancialOpen(true)}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <span
            className={`text-xs ${
              saveStatus === "saving"
                ? "text-muted-foreground"
                : saveStatus === "error"
                ? "text-destructive"
                : "text-muted-foreground/50"
            }`}
          >
            {saveStatus === "saving"
              ? LABELS.guardando
              : saveStatus === "error"
              ? LABELS.error_guardar
              : LABELS.guardado}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <PurchasePanel />
        <ContainerPanel />
      </div>

      <PnlSummary />

      <CostsDetailDialog open={costsOpen} onOpenChange={setCostsOpen} />
      <FinancialParamsDialog
        open={financialOpen}
        onOpenChange={setFinancialOpen}
      />
    </div>
  );
}
