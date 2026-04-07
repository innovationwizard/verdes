"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LABELS } from "@/lib/constants/labels";
import { LogOut, User, ChevronDown, Leaf } from "lucide-react";

interface HeaderProps {
  user: {
    full_name: string;
    role: "master" | "operator" | "gerencia";
    email: string;
  } | null;
}

const ROLE_COLORS: Record<string, string> = {
  master: "bg-purple-100 text-purple-800",
  operator: "bg-blue-100 text-blue-800",
  gerencia: "bg-gray-100 text-gray-800",
};

const ROLE_LABELS: Record<string, string> = {
  master: LABELS.master,
  operator: LABELS.operator,
  gerencia: LABELS.gerencia,
};

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/embarques", label: LABELS.embarques },
    ...(user?.role === "master"
      ? [{ href: "/admin/costos", label: LABELS.admin }]
      : []),
  ];

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/embarques" className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
            <Leaf className="h-4 w-4 text-primary" />
            {LABELS.app_name}
          </Link>
          <nav className="flex gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  pathname.startsWith(link.href)
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-muted">
              <User className="h-4 w-4" />
              <span>{user.full_name}</span>
              <Badge
                variant="secondary"
                className={`text-[10px] ${ROLE_COLORS[user.role]}`}
              >
                {ROLE_LABELS[user.role]}
              </Badge>
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {user.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {LABELS.cerrar_sesion}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
