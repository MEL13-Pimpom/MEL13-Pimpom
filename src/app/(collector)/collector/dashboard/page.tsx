import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  Navigation,
  Package,
  Route as RouteIcon,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCard } from "@/components/shared/stats-card";
import { StopStatusBadge } from "@/components/shared/status-badge";
import { requireRole } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REQUEST_TYPE_LABELS } from "@/lib/validations/request";
import type { RequestType } from "@/lib/types/database";

export const metadata = { title: "Collector Dashboard" };

export default async function CollectorDashboardPage() {
  const profile = await requireRole("collector");
  const supabase = await createSupabaseServerClient();

  const { data: activeRoute } = await supabase
    .from("routes")
    .select(
      "id, name, scheduled_date, status, stops:route_stops(id, stop_order, status, request:pickup_requests(id, address, type, scheduled_time_window, preferred_time_window))",
    )
    .eq("collector_id", profile.id)
    .in("status", ["planned", "in_progress"])
    .order("scheduled_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const stops = activeRoute
    ? (activeRoute.stops ?? [])
        .map((s) => ({
          ...s,
          request: Array.isArray(s.request) ? s.request[0] : s.request,
        }))
        .sort((a, b) => a.stop_order - b.stop_order)
    : [];

  const todayStops = stops.length;
  const completedToday = stops.filter((s) => s.status === "completed").length;
  const pendingToday = stops.filter((s) => s.status === "pending").length;
  const missedToday = stops.filter((s) => s.status === "missed").length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Hello, {profile.full_name || "Collector"}
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Assigned Today"
          value={todayStops}
          icon={Package}
          tone="primary"
        />
        <StatsCard
          label="Completed"
          value={completedToday}
          icon={CheckCircle2}
          tone="primary"
        />
        <StatsCard
          label="Pending"
          value={pendingToday}
          icon={Clock}
          tone="amber"
        />
        <StatsCard
          label="Missed"
          value={missedToday}
          icon={XCircle}
          tone={missedToday > 0 ? "destructive" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RouteIcon className="w-5 h-5 text-primary" />
                Active route
              </CardTitle>
              <CardDescription>
                {activeRoute
                  ? `${activeRoute.name} • ${format(
                      parseISO(activeRoute.scheduled_date),
                      "MMM d, yyyy",
                    )}`
                  : "No route assigned"}
              </CardDescription>
            </div>
            {activeRoute && (
              <Button asChild>
                <Link href="/collector/route">
                  <Navigation className="w-4 h-4 mr-2" />
                  View route
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!activeRoute ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                You don&apos;t have an active route yet. Check back later or
                contact your administrator.
              </p>
            ) : stops.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Your route has no stops yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {stops.slice(0, 4).map((stop) => (
                  <li
                    key={stop.id}
                    className="flex items-center gap-4 p-3 border border-border rounded-lg"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {stop.stop_order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">
                          {stop.request
                            ? REQUEST_TYPE_LABELS[stop.request.type as RequestType]
                            : "Removed request"}
                        </p>
                        <StopStatusBadge status={stop.status} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {stop.request?.address ?? "—"}
                      </p>
                    </div>
                  </li>
                ))}
                {stops.length > 4 && (
                  <Button asChild variant="ghost" size="sm" className="w-full">
                    <Link href="/collector/route">
                      See all {stops.length} stops
                    </Link>
                  </Button>
                )}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start h-12">
              <Link href="/collector/route">
                <Navigation className="w-5 h-5 mr-2" />
                Today&apos;s route
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-12">
              <Link href="/collector/tasks">
                <ClipboardList className="w-5 h-5 mr-2" />
                All assigned tasks
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-12">
              <Link href="/collector/history">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Route history
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
