"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/lib/types/database";

interface Props {
  current: "all" | RequestStatus;
  options: { value: "all" | RequestStatus; label: string }[];
}

export function RequestStatusTabs({ current, options }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = current === opt.value;
        const href =
          opt.value === "all" ? "/resident/requests" : `/resident/requests?status=${opt.value}`;
        return (
          <Link
            key={opt.value}
            href={href}
            className={cn(
              "px-4 py-2 rounded-full text-sm border transition-colors",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-foreground border-border hover:bg-accent",
            )}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
