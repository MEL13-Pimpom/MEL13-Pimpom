import type { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Sidebar, type NavItem } from "./sidebar";

interface DashboardShellProps {
  userName: string;
  userRole: string;
  navItems: NavItem[];
  children: ReactNode;
}

export function DashboardShell({
  userName,
  userRole,
  navItems,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar userName={userName} userRole={userRole} />
      <div className="flex">
        <Sidebar items={navItems} />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
