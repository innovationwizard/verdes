import { QualityGradeManagement } from "@/components/costos/quality-grade-management";
import { createClient } from "@/lib/supabase/server";

export default async function CalidadesPage() {
  const supabase = await createClient();

  const { data: grades } = await supabase
    .from("quality_grades")
    .select("*")
    .order("sort_order");

  return (
    <main className="mx-auto w-full max-w-4xl p-4">
      <h1 className="mb-4 text-lg font-semibold">Calidades</h1>
      <QualityGradeManagement grades={grades ?? []} />
    </main>
  );
}
