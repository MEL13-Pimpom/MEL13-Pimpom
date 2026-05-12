"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Calendar,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  MapPinned,
  PlusCircle,
  Route,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  Bell,
  Calendar,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  MapPinned,
  PlusCircle,
  Route,
  Users,
};

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border min-h-[calc(100vh-65px)] hidden md:block">
      <nav className="p-4 space-y-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = ICON_MAP[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              {Icon && <Icon className="w-5 h-5" />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
