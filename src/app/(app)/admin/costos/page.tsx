import { CostManagement } from "@/components/costos/cost-management";
import { createClient } from "@/lib/supabase/server";

export default async function CostosPage() {
  const supabase = await createClient();

  const { data: costItems } = await supabase
    .from("cost_items")
    .select("*, cost_prices(*)")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <main className="mx-auto w-full max-w-4xl p-4">
      <h1 className="mb-4 text-lg font-semibold">Administración de costos</h1>
      <CostManagement costItems={costItems ?? []} />
    </main>
  );
}
