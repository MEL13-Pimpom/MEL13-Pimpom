import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RESIDENT_NAV } from "@/components/layout/nav-config";
import { requireRole } from "@/lib/auth/get-current-profile";

export default async function ResidentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireRole("resident");
  return (
    <DashboardShell
      userName={profile.full_name || "Resident"}
      userRole={profile.role}
      avatarUrl={profile.avatar_url}
      navItems={RESIDENT_NAV}
    >
      {children}
    </DashboardShell>
  );
}
