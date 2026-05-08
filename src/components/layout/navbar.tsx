"use client";

import Link from "next/link";
import { LogOut, Recycle, User } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

interface NavbarProps {
  userName: string;
  userRole: string;
}

export function Navbar({ userName, userRole }: NavbarProps) {
  const [pending, startTransition] = useTransition();

  return (
    <header className="bg-white border-b border-border shadow-sm sticky top-0 z-30">
      <div className="px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Recycle className="h-6 w-6 text-primary" strokeWidth={1.75} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold">Recycling Pickup</span>
            <span className="text-xs text-muted-foreground">Scheduler</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
            <User className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium">{userName}</span>
              <span className="text-[11px] text-muted-foreground capitalize">
                {userRole}
              </span>
            </div>
          </div>
          <form action={() => startTransition(() => logoutAction())}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              disabled={pending}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">
                {pending ? "Signing out..." : "Sign out"}
              </span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
