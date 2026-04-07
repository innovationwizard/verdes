"use client";

import { useShipmentStore } from "@/stores/shipment-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LABELS, STATUS_LABELS } from "@/lib/constants/labels";
import { Settings, DollarSign } from "lucide-react";

interface ShipmentHeaderProps {
  onOpenCosts: () => void;
  onOpenFinancial: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  complete: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export function ShipmentHeader({
  onOpenCosts,
  onOpenFinancial,
}: ShipmentHeaderProps) {
  const meta = useShipmentStore((s) => s.meta);
  const setStatus = useShipmentStore((s) => s.setStatus);

  return (
    <div className="flex items-center justify-between border-b px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="text-base font-medium">{meta.reference_code}</span>
        <Select
          value={meta.status}
          onValueChange={(v) =>
            setStatus(v as "draft" | "in_progress" | "complete" | "cancelled")
          }
        >
          <SelectTrigger className="h-7 w-auto gap-1 border-0 px-2.5 text-xs font-medium">
            <Badge
              variant="outline"
              className={`${STATUS_COLORS[meta.status]} border`}
            >
              <SelectValue />
            </Badge>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-sm">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onOpenCosts}>
          <DollarSign className="mr-1 h-4 w-4" />
          {LABELS.costos}
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenFinancial}>
          <Settings className="mr-1 h-4 w-4" />
          {LABELS.parametros}
        </Button>
      </div>
    </div>
  );
}
