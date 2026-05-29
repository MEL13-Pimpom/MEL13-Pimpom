import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, FileText, MapPin, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/shared/status-badge";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  REQUEST_TYPE_LABELS,
  TIME_WINDOW_LABELS,
} from "@/lib/validations/request";
import type { RequestStatus } from "@/lib/types/database";
import { RequestStatusTabs } from "./request-status-tabs";
import { RequestRowActions } from "./request-row-actions";

export const metadata = { title: "My Requests" };

const STATUS_FILTERS: { value: "all" | RequestStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function ResidentRequestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  const statusFilter = (params.status as RequestStatus | "all" | undefined) ?? "all";

  let query = supabase
    .from("pickup_requests")
    .select(
      "id, type, address, status, preferred_date, preferred_time_window, scheduled_date, scheduled_time_window, weight_kg_estimate, notes, rejection_reason, created_at",
    )
    .eq("resident_id", profile.id)
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: requests } = await query;
  const rows = requests ?? [];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">My Requests</h1>
          <p className="text-muted-foreground">
            View and manage your recycling pickup requests
          </p>
        </div>
        <Button asChild className="h-11">
          <Link href="/resident/new-request">
            <Plus className="w-5 h-5 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      <RequestStatusTabs current={statusFilter} options={STATUS_FILTERS} />

      <div className="space-y-4">
        {rows.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No requests found
              </h3>
              <p className="text-muted-foreground mb-6">
                {statusFilter !== "all"
                  ? "Try a different filter or create a new request."
                  : "You haven't submitted any requests yet."}
              </p>
              <Button asChild>
                <Link href="/resident/new-request">
                  <Plus className="w-5 h-5 mr-2" />
                  Submit your first request
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          rows.map((r) => {
            const canModify = r.status === "pending" || r.status === "approved";
            return (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {REQUEST_TYPE_LABELS[r.type]}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Submitted {format(parseISO(r.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Preferred:{" "}
                            {format(parseISO(r.preferred_date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {TIME_WINDOW_LABELS[
                              r.preferred_time_window as keyof typeof TIME_WINDOW_LABELS
                            ] ?? r.preferred_time_window}
                          </span>
                        </div>
                        {r.scheduled_date && (
                          <div className="flex items-center gap-2 text-primary">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Scheduled:{" "}
                              {format(parseISO(r.scheduled_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{r.address}</span>
                        </div>
                        {r.weight_kg_estimate != null && (
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span>{r.weight_kg_estimate} kg estimate</span>
                          </div>
                        )}
                      </div>
                      {r.rejection_reason && (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                          <span className="font-medium">Rejection reason: </span>
                          {r.rejection_reason}
                        </div>
                      )}
                      {r.notes && (
                        <p className="mt-3 text-sm text-muted-foreground italic">
                          &ldquo;{r.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3 md:ml-auto">
                      <RequestStatusBadge status={r.status} />
                      {canModify && (
                        <RequestRowActions
                          requestId={r.id}
                          currentDate={r.preferred_date}
                          currentTimeWindow={r.preferred_time_window}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
