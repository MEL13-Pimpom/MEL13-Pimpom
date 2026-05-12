import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  Recycle,
  TrendingUp,
} from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { RequestStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REQUEST_TYPE_LABELS } from "@/lib/validations/request";

export const metadata = { title: "Resident Dashboard" };

const ACTIVE_STATUSES = ["pending", "approved", "scheduled", "in_progress"] as const;

export default async function ResidentDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  const [
    { count: activeCount },
    { count: awaitingCount },
    { count: completedCount },
    { data: completedRequests },
    { data: upcoming },
  ] = await Promise.all([
    supabase
      .from("pickup_requests")
      .select("id", { count: "exact", head: true })
      .eq("resident_id", profile.id)
      .in("status", [...ACTIVE_STATUSES]),
    supabase
      .from("pickup_requests")
      .select("id", { count: "exact", head: true })
      .eq("resident_id", profile.id)
      .eq("status", "pending"),
    supabase
      .from("pickup_requests")
      .select("id", { count: "exact", head: true })
      .eq("resident_id", profile.id)
      .eq("status", "completed"),
    supabase
      .from("pickup_requests")
      .select("weight_kg_estimate")
      .eq("resident_id", profile.id)
      .eq("status", "completed"),
    supabase
      .from("pickup_requests")
      .select("id, type, address, scheduled_date, scheduled_time_window, status")
      .eq("resident_id", profile.id)
      .eq("status", "scheduled")
      .order("scheduled_date", { ascending: true })
      .limit(3),
  ]);

  const totalKg = (completedRequests ?? []).reduce(
    (sum, r) => sum + (r.weight_kg_estimate ?? 0),
    0,
  );

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Welcome back, {profile.full_name || "Resident"}
          </h1>
          <p className="text-muted-foreground">
            Track your recycling pickups and schedule new ones.
          </p>
        </div>
        <Button asChild className="h-12 px-6">
          <Link href="/resident/new-request">
            <Plus className="w-5 h-5 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Active Requests"
          value={activeCount ?? 0}
          icon={FileText}
          tone="primary"
        />
        <StatsCard
          label="Awaiting Approval"
          value={awaitingCount ?? 0}
          icon={Clock}
          tone="amber"
        />
        <StatsCard
          label="Completed"
          value={completedCount ?? 0}
          icon={CheckCircle}
          tone="primary"
        />
        <StatsCard
          label="Total Recycled"
          value={`${totalKg.toFixed(1)} kg`}
          icon={Recycle}
          tone="default"
          helper={totalKg > 0 ? "Great work!" : "No data yet"}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Upcoming pickups</CardTitle>
            <CardDescription>Your next 3 scheduled requests</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/resident/requests">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {(upcoming ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have any scheduled pickups yet. Submit a new request to get
              started.
            </p>
          ) : (
            <div className="space-y-3">
              {(upcoming ?? []).map((r) => (
                <Link
                  key={r.id}
                  href="/resident/requests"
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-foreground">
                        {REQUEST_TYPE_LABELS[r.type]}
                      </p>
                      <RequestStatusBadge status={r.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {r.scheduled_date
                          ? format(parseISO(r.scheduled_date), "MMM d, yyyy")
                          : "TBD"}
                      </span>
                      {r.scheduled_time_window && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {r.scheduled_time_window}
                        </span>
                      )}
                      <span className="truncate max-w-xs">{r.address}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-gradient-to-r from-primary to-green-600 rounded-lg p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" /> Keep up the great work!
            </h2>
            <p className="text-green-50">
              Every recycling pickup makes a difference. Schedule your next one in
              just a few steps.
            </p>
          </div>
          <Button asChild className="bg-white text-primary hover:bg-green-50 h-12 px-6">
            <Link href="/resident/new-request">
              <Plus className="w-5 h-5 mr-2" />
              Create Request
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
