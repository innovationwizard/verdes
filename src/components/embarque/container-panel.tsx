"use client";

import { useShipmentStore } from "@/stores/shipment-store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LABELS } from "@/lib/constants/labels";
import { AllocationTable } from "./allocation-table";
import { CapacityBar } from "./capacity-bar";
import { Plus, Trash2 } from "lucide-react";

export function ContainerPanel() {
  const containers = useShipmentStore((s) => s.containers);
  const pnl = useShipmentStore((s) => s.pnl);
  const addContainer = useShipmentStore((s) => s.addContainer);
  const removeContainer = useShipmentStore((s) => s.removeContainer);

  return (
    <div className="flex-1 overflow-auto p-4">
      {containers.map((container) => {
        const totalKilos = container.allocations.reduce(
          (s, a) => s + a.kilos,
          0
        );

        return (
          <div key={container.id} className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {LABELS.contenedor} {container.sequence_number} —{" "}
                {container.size === "20ft" ? "20'" : "40'"}
              </p>
              {containers.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-destructive hover:text-destructive"
                  onClick={() => removeContainer(container.id)}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {LABELS.eliminar}
                </Button>
              )}
            </div>

            <AllocationTable container={container} />

            <CapacityBar
              allocatedKg={totalKilos}
              capacityKg={container.capacity_kg}
              totalPurchasedKg={pnl.total_kilos_purchased}
              mermaPct={useShipmentStore.getState().params.merma_pct}
            />
          </div>
        );
      })}

      <div className="mt-3 flex gap-2">
        <Select
          onValueChange={(v) => addContainer(v as "20ft" | "40ft")}
        >
          <SelectTrigger className="h-9 w-full border-dashed">
            <Plus className="mr-1 h-4 w-4" />
            <SelectValue placeholder={LABELS.agregar_contenedor} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20ft">Contenedor 20&apos;</SelectItem>
            <SelectItem value="40ft">Contenedor 40&apos;</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
