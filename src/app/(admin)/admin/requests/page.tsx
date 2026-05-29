import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RequestStatusBadge } from "@/components/shared/status-badge";
import { requireRole } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REQUEST_TYPE_LABELS } from "@/lib/validations/request";
import type { RequestStatus } from "@/lib/types/database";
import { RequestActions } from "./request-actions";

export const metadata = { title: "Manage Requests" };

const STATUS_OPTIONS: { value: "all" | RequestStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}

export default async function AdminRequestsPage({ searchParams }: PageProps) {
  await requireRole("admin");
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();

  const statusFilter = (params.status as RequestStatus | "all" | undefined) ?? "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("pickup_requests")
    .select(
      "id, type, address, status, preferred_date, preferred_time_window, scheduled_date, scheduled_time_window, weight_kg_estimate, notes, rejection_reason, photo_url, created_at, resident:profiles!pickup_requests_resident_id_fkey(id, full_name, phone)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: requests, count } = await query;
  const rows = requests ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Manage Requests
        </h1>
        <p className="text-muted-foreground">
          Review, approve, schedule, or reject recycling pickup requests.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search by resident name…"
                defaultValue={params.q ?? ""}
                className="pl-10 h-11"
              />
            </div>
            <Button type="submit" variant="outline" className="h-11">
              <Filter className="w-4 h-4 mr-2" /> Apply
            </Button>
          </form>
          <div className="flex flex-wrap gap-2 mt-4">
            {STATUS_OPTIONS.map((opt) => {
              const active = statusFilter === opt.value;
              const href =
                opt.value === "all"
                  ? "/admin/requests"
                  : `/admin/requests?status=${opt.value}`;
              return (
                <Link
                  key={opt.value}
                  href={href}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-foreground border-border hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            All Requests
            <span className="text-sm font-normal text-muted-foreground">
              {count ?? 0} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto px-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Waste type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Preferred</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No requests match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => {
                    const resident = Array.isArray(r.resident)
                      ? r.resident[0]
                      : r.resident;
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium">
                            {resident?.full_name ?? "Unknown"}
                          </div>
                          {resident?.phone && (
                            <div className="text-xs text-muted-foreground">
                              {resident.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{REQUEST_TYPE_LABELS[r.type]}</TableCell>
                        <TableCell className="max-w-[220px] truncate" title={r.address}>
                          {r.address}
                        </TableCell>
                        <TableCell>
                          <div>{format(parseISO(r.preferred_date), "MMM d, yyyy")}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.preferred_time_window}
                          </div>
                        </TableCell>
                        <TableCell>
                          {r.scheduled_date
                            ? format(parseISO(r.scheduled_date), "MMM d, yyyy")
                            : "—"}
                          {r.scheduled_time_window && (
                            <div className="text-xs text-muted-foreground">
                              {r.scheduled_time_window}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.weight_kg_estimate != null
                            ? `${r.weight_kg_estimate} kg`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <RequestStatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <RequestActions
                            request={{
                              id: r.id,
                              status: r.status,
                              residentName: resident?.full_name ?? "Resident",
                              type: r.type,
                              address: r.address,
                              preferredDate: r.preferred_date,
                              preferredTimeWindow: r.preferred_time_window,
                              scheduledDate: r.scheduled_date,
                              scheduledTimeWindow: r.scheduled_time_window,
                              notes: r.notes,
                              rejectionReason: r.rejection_reason,
                              photoUrl: r.photo_url,
                              weightKgEstimate: r.weight_kg_estimate,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                >
                  <Link
                    href={{
                      pathname: "/admin/requests",
                      query: {
                        ...(statusFilter !== "all"
                          ? { status: statusFilter }
                          : {}),
                        page: Math.max(1, page - 1),
                      },
                    }}
                    aria-disabled={page <= 1}
                    className={
                      page <= 1 ? "pointer-events-none opacity-50" : ""
                    }
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                >
                  <Link
                    href={{
                      pathname: "/admin/requests",
                      query: {
                        ...(statusFilter !== "all"
                          ? { status: statusFilter }
                          : {}),
                        page: Math.min(totalPages, page + 1),
                      },
                    }}
                    aria-disabled={page >= totalPages}
                    className={
                      page >= totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
