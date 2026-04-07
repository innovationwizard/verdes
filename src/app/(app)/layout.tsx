import { Header } from "@/components/layout/header";
import { getUser } from "@/lib/auth/get-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <>
      <Header user={user} />
      <div className="flex-1">{children}</div>
    </>
  );
}
