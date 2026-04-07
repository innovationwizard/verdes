import { createClient } from "@/lib/supabase/server";
import { ShipmentList } from "@/components/embarque/shipment-list";

export default async function EmbarquesPage() {
  const supabase = await createClient();

  const { data: shipments } = await supabase
    .from("shipments")
    .select("id, reference_code, label, date, status, quantity_qq, price_per_qq_gtq, exchange_rate, bag_weight_kg")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-4xl p-4">
      <ShipmentList shipments={shipments ?? []} />
    </main>
  );
}
