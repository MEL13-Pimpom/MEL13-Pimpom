import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { COLLECTOR_NAV } from "@/components/layout/nav-config";
import { requireRole } from "@/lib/auth/get-current-profile";

export default async function CollectorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireRole("collector");
  return (
    <DashboardShell
      userName={profile.full_name || "Collector"}
      userRole={profile.role}
      navItems={COLLECTOR_NAV}
    >
      {children}
    </DashboardShell>
  );
}
