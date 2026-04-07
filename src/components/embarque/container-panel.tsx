"use client";

import { useShipmentStore } from "@/stores/shipment-store";
import { Button } from "@/components/ui/button";
import { LABELS } from "@/lib/constants/labels";
import { AllocationTable } from "./allocation-table";
import { CapacityBar } from "./capacity-bar";
import { Plus, Trash2 } from "lucide-react";

export function ContainerPanel() {
  const containers = useShipmentStore((s) => s.containers);
  const pnl = useShipmentStore((s) => s.pnl);
  const addContainer = useShipmentStore((s) => s.addContainer);
  const removeContainer = useShipmentStore((s) => s.removeContainer);
  const setContainerSize = useShipmentStore((s) => s.setContainerSize);

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
              <div className="flex items-center gap-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {LABELS.contenedor} {container.sequence_number}
                </p>
                {/* Size toggle */}
                <div className="flex items-center gap-1">
                  <button
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                      container.size === "20ft"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => setContainerSize(container.id, "20ft")}
                  >
                    20&apos;
                  </button>
                  <button
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                      container.size === "40ft"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => setContainerSize(container.id, "40ft")}
                  >
                    40&apos;
                  </button>
                </div>
              </div>
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

      <Button
        variant="outline"
        className="mt-3 w-full border-dashed"
        onClick={() => addContainer("20ft")}
      >
        <Plus className="mr-1 h-4 w-4" />
        {LABELS.agregar_contenedor}
      </Button>
    </div>
  );
}
