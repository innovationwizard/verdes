import { createClient } from "@/lib/supabase/server";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: "master" | "operator" | "gerencia";
};

export async function getUser(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    full_name: profile.full_name,
    role: profile.role as UserProfile["role"],
  };
}

export async function requireAuth(): Promise<UserProfile> {
  const user = await getUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    return redirect("/login") as never;
  }
  return user;
}

export async function requireRole(
  minRole: "gerencia" | "operator" | "master"
): Promise<UserProfile> {
  const user = await requireAuth();

  const roleHierarchy: Record<string, number> = {
    gerencia: 0,
    operator: 1,
    master: 2,
  };

  if (roleHierarchy[user.role] < roleHierarchy[minRole]) {
    const { redirect } = await import("next/navigation");
    return redirect("/embarques") as never;
  }

  return user;
}
