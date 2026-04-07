import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ShipmentWorkspace } from "@/components/embarque/shipment-workspace";
import type { QualityGradeInfo } from "@/stores/shipment-store";

export default async function ShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch shipment with all related data
  const { data: shipment } = await supabase
    .from("shipments")
    .select(
      `
      *,
      containers(
        *,
        container_allocations(
          *,
          quality_grades:quality_grade_id(id, code, display_name, tier, sort_order)
        )
      ),
      shipment_costs(
        *,
        cost_items:cost_item_id(id, category, name, sort_order)
      )
    `
    )
    .eq("id", id)
    .single();

  if (!shipment) notFound();

  // Fetch all quality grades (for adding new allocations)
  const { data: qualityGrades } = await supabase
    .from("quality_grades")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <main className="mx-auto w-full max-w-6xl p-4">
      <ShipmentWorkspace
        shipment={shipment}
        qualityGrades={(qualityGrades ?? []) as QualityGradeInfo[]}
      />
    </main>
  );
}
