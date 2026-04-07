import { requireRole } from "@/lib/auth/get-user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("master");
  return <>{children}</>;
}
