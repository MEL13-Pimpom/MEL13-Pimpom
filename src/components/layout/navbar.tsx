"use client";

import Link from "next/link";
import { ChevronDown, KeyRound, LogOut, Recycle, UserCircle } from "lucide-react";
import { useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/lib/actions/auth";

interface NavbarProps {
  userName: string;
  userRole: string;
  avatarUrl?: string | null;
}

export function Navbar({ userName, userRole, avatarUrl }: NavbarProps) {
  const [pending, startTransition] = useTransition();

  const initials = (userName || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label="Open account menu"
              >
                <Avatar className="h-8 w-8 border border-border">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={userName} /> : null}
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col leading-tight items-start">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-[11px] text-muted-foreground capitalize">
                    {userRole}
                  </span>
                </div>
                <ChevronDown className="hidden sm:block w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground capitalize font-normal">
                    {userRole}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/account/profile" className="cursor-pointer">
                  <UserCircle className="w-4 h-4" />
                  Edit profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/account/password" className="cursor-pointer">
                  <KeyRound className="w-4 h-4" />
                  Change password
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={pending}
                onSelect={(e) => {
                  e.preventDefault();
                  startTransition(() => logoutAction());
                }}
                className="cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                {pending ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
