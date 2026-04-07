"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LABELS, STATUS_LABELS } from "@/lib/constants/labels";
import { formatNumber } from "@/lib/utils/currency";
import { Plus } from "lucide-react";
import { NewShipmentDialog } from "./new-shipment-dialog";

interface ShipmentRow {
  id: string;
  reference_code: string;
  label: string | null;
  date: string;
  status: string;
  quantity_qq: number;
  price_per_qq_gtq: number;
  exchange_rate: number;
  bag_weight_kg: number;
}

interface ShipmentListProps {
  shipments: ShipmentRow[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  complete: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export function ShipmentList({ shipments }: ShipmentListProps) {
  const [newOpen, setNewOpen] = useState(false);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{LABELS.embarques}</h1>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          {LABELS.nuevo_embarque}
        </Button>
      </div>

      {shipments.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>No hay embarques todavía.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setNewOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Crear primer embarque
          </Button>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="py-2 text-left">Referencia</th>
              <th className="py-2 text-left">Fecha</th>
              <th className="py-2 text-left">Estado</th>
              <th className="py-2 text-right">Quintales</th>
              <th className="py-2 text-right">Precio Q/qq</th>
              <th className="py-2 text-right">TC</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} className="border-b hover:bg-muted/30">
                <td className="py-2.5">
                  <Link
                    href={`/embarques/${s.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {s.reference_code}
                  </Link>
                </td>
                <td className="py-2.5 text-muted-foreground">
                  {new Date(s.date).toLocaleDateString("es-GT")}
                </td>
                <td className="py-2.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${STATUS_COLORS[s.status]}`}
                  >
                    {STATUS_LABELS[s.status] ?? s.status}
                  </Badge>
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {formatNumber(s.quantity_qq)}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {formatNumber(s.price_per_qq_gtq)}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  {s.exchange_rate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <NewShipmentDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        shipments={shipments}
      />
    </>
  );
}
