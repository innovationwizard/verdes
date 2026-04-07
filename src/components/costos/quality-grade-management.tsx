"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface QualityGrade {
  id: string;
  code: string;
  display_name: string;
  tier: string;
  sort_order: number;
  is_active: boolean;
}

interface QualityGradeManagementProps {
  grades: QualityGrade[];
}

const TIER_COLORS: Record<string, string> = {
  top: "bg-emerald-100 text-emerald-800",
  medium: "bg-blue-100 text-blue-800",
  low: "bg-gray-100 text-gray-800",
};

const TIER_LABELS: Record<string, string> = {
  top: "Superior",
  medium: "Media",
  low: "Baja",
};

export function QualityGradeManagement({
  grades: initialGrades,
}: QualityGradeManagementProps) {
  const [grades, setGrades] = useState(initialGrades);
  const [addOpen, setAddOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newTier, setNewTier] = useState("low");
  const [saving, setSaving] = useState(false);

  async function handleToggleActive(grade: QualityGrade) {
    const supabase = createClient();
    const { error } = await supabase
      .from("quality_grades")
      .update({ is_active: !grade.is_active })
      .eq("id", grade.id);

    if (error) {
      toast.error("Error al actualizar");
      return;
    }

    setGrades((prev) =>
      prev.map((g) =>
        g.id === grade.id ? { ...g, is_active: !g.is_active } : g
      )
    );
    toast.success("Calidad actualizada");
  }

  async function handleAdd() {
    if (!newCode || !newName) return;
    setSaving(true);

    const supabase = createClient();
    const maxOrder = grades.reduce((max, g) => Math.max(max, g.sort_order), 0);

    const { data, error } = await supabase
      .from("quality_grades")
      .insert({
        code: newCode.toUpperCase(),
        display_name: newName,
        tier: newTier,
        sort_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      toast.error("Error al crear calidad");
      setSaving(false);
      return;
    }

    setGrades((prev) => [...prev, data]);
    toast.success("Calidad creada");
    setAddOpen(false);
    setNewCode("");
    setNewName("");
    setNewTier("low");
    setSaving(false);
  }

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Agregar calidad
        </Button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-xs text-muted-foreground">
            <th className="py-2 text-left">Orden</th>
            <th className="py-2 text-left">Código</th>
            <th className="py-2 text-left">Nombre</th>
            <th className="py-2 text-left">Tier</th>
            <th className="py-2 text-center">Activo</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((grade) => (
            <tr key={grade.id} className="border-b">
              <td className="py-2 text-muted-foreground">{grade.sort_order}</td>
              <td className="py-2 font-mono text-xs">{grade.code}</td>
              <td className="py-2">{grade.display_name}</td>
              <td className="py-2">
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${TIER_COLORS[grade.tier]}`}
                >
                  {TIER_LABELS[grade.tier] ?? grade.tier}
                </Badge>
              </td>
              <td className="py-2 text-center">
                <button
                  onClick={() => handleToggleActive(grade)}
                  className={`h-5 w-9 rounded-full transition-colors ${
                    grade.is_active ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      grade.is_active ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar calidad</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Código</Label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="ej: TH"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Nombre</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ej: TH"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Tier</Label>
              <Select value={newTier} onValueChange={(v) => v && setNewTier(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Superior (SGQ)</SelectItem>
                  <SelectItem value="medium">Media (PGQ)</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAdd}
              disabled={saving || !newCode || !newName}
              className="w-full"
            >
              {saving ? "Guardando..." : "Agregar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
