import { Search, Users as UsersIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types/database";
import { UserRowActions } from "./user-row-actions";
import { UserSearchInput } from "./user-search-input";
import { UserRoleFilter } from "./user-role-filter";
import { FocusUserScroller } from "./focus-user-scroller";

export const metadata = { title: "Manage Users" };

const ROLE_BADGE: Record<UserRole, { label: string; className: string }> = {
  admin: {
    label: "Admin",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  collector: {
    label: "Collector",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  resident: {
    label: "Resident",
    className: "bg-green-100 text-green-800 border-green-200",
  },
};

function initials(name: string) {
  return (name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface PageProps {
  searchParams: Promise<{
    q?: string;
    role?: string;
    focus?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const admin = await requireRole("admin");
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (params.role && ["resident", "admin", "collector"].includes(params.role)) {
    query = query.eq("role", params.role as UserRole);
  }
  if (params.q && params.q.trim().length > 0) {
    const term = params.q.trim().replace(/[%_]/g, "\\$&");
    query = query.ilike("full_name", `%${term}%`);
  }

  const { data, error } = await query;
  const users: Profile[] = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <UsersIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-1">
            Manage Users
          </h1>
          <p className="text-muted-foreground">
            View, edit, and remove user accounts. New accounts are created via
            sign-up only.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All users ({users.length})</CardTitle>
          <CardDescription>
            Filter by role or search by full name. Edit a user to change their
            details or role.
          </CardDescription>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <UserSearchInput defaultValue={params.q ?? ""} />
            </div>
            <UserRoleFilter defaultValue={params.role ?? "all"} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-destructive">
                      Failed to load users: {error.message}
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No users match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const badge = ROLE_BADGE[u.role];
                    const isFocused = params.focus === u.id;
                    return (
                      <TableRow
                        key={u.id}
                        data-user-id={u.id}
                        className={
                          isFocused
                            ? "bg-primary/5 ring-1 ring-primary/30"
                            : undefined
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border">
                              {u.avatar_url ? (
                                <AvatarImage src={u.avatar_url} alt={u.full_name} />
                              ) : null}
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {initials(u.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col leading-tight">
                              <span className="font-medium text-foreground">
                                {u.full_name || "(no name)"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {u.id === admin.id ? "you" : u.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.email || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={badge.className} variant="outline">
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.phone || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {u.address || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <UserRowActions
                            user={u}
                            isSelf={u.id === admin.id}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {params.focus ? <FocusUserScroller userId={params.focus} /> : null}
    </div>
  );
}
