import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { navForRole } from "@/components/layout/nav-config";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getCurrentProfile();
  const label =
    profile.role.charAt(0).toUpperCase() + profile.role.slice(1);

  return (
    <DashboardShell
      userName={profile.full_name || label}
      userRole={profile.role}
      avatarUrl={profile.avatar_url}
      navItems={navForRole(profile.role)}
    >
      {children}
    </DashboardShell>
  );
}
