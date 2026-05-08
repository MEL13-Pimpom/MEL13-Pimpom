import type { NavItem } from "./sidebar";
import type { UserRole } from "@/lib/types/database";

export const RESIDENT_NAV: NavItem[] = [
  { href: "/resident/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/resident/requests", label: "My Requests", icon: "FileText" },
  { href: "/resident/new-request", label: "New Request", icon: "PlusCircle" },
  { href: "/resident/notifications", label: "Notifications", icon: "Bell" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/requests", label: "Manage Requests", icon: "ClipboardList" },
  { href: "/admin/schedule", label: "Schedule", icon: "Calendar" },
  { href: "/admin/routes", label: "Route Assignment", icon: "MapPinned" },
  { href: "/admin/notifications", label: "Notifications", icon: "Bell" },
  { href: "/admin/reports", label: "Reports", icon: "BarChart3" },
];

export const COLLECTOR_NAV: NavItem[] = [
  { href: "/collector/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/collector/tasks", label: "Assigned Tasks", icon: "ClipboardList" },
  { href: "/collector/route", label: "Today's Route", icon: "Route" },
  { href: "/collector/notifications", label: "Notifications", icon: "Bell" },
];

export function navForRole(role: UserRole): NavItem[] {
  switch (role) {
    case "admin":
      return ADMIN_NAV;
    case "collector":
      return COLLECTOR_NAV;
    case "resident":
    default:
      return RESIDENT_NAV;
  }
}
