import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ADMIN_NAV } from "@/components/layout/nav-config";
import { requireRole } from "@/lib/auth/get-current-profile";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireRole("admin");
  return (
    <DashboardShell
      userName={profile.full_name || "Admin"}
      userRole={profile.role}
      navItems={ADMIN_NAV}
    >
      {children}
    </DashboardShell>
  );
}
