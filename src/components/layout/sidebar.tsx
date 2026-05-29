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
    <aside className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border hidden md:block sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto self-start z-20">
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
                "group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-md hover:bg-[#388e3c]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary hover:shadow-sm hover:translate-x-1 hover:font-medium",
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
