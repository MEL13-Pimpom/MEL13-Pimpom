import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin, Package, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StopStatusBadge } from "@/components/shared/status-badge";
import { requireRole } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REQUEST_TYPE_LABELS } from "@/lib/validations/request";
import type { RequestType } from "@/lib/types/database";
import { StopActions } from "./stop-actions";
import { ClaimRouteButton } from "./claim-route-button";
import { StopNavButton } from "@/components/collector/stop-nav-button";

export const metadata = { title: "Routes & Tasks" };

export default async function CollectorTasksPage() {
  const profile = await requireRole("collector");
  const supabase = await createSupabaseServerClient();

  const [{ data: routesData }, { data: availableData }] = await Promise.all([
    supabase
      .from("routes")
      .select(
        "id, name, scheduled_date, time_window, status, stops:route_stops(id, stop_order, status, notes, arrived_at, completed_at, request:pickup_requests(id, address, latitude, longitude, type, scheduled_time_window, preferred_time_window, weight_kg_estimate, notes, resident:profiles!pickup_requests_resident_id_fkey(full_name, phone)))",
      )
      .eq("collector_id", profile.id)
      .in("status", ["planned", "in_progress"])
      .order("scheduled_date", { ascending: true }),
    supabase
      .from("routes")
      .select(
        "id, name, scheduled_date, time_window, notes, stop_count:route_stops(count)",
      )
      .is("collector_id", null)
      .eq("status", "planned")
      .order("scheduled_date", { ascending: true }),
  ]);

  const routes = (routesData ?? []).map((r) => ({
    ...r,
    stops: (r.stops ?? [])
      .map((s) => {
        const request = Array.isArray(s.request) ? s.request[0] : s.request;
        const resident = request
          ? Array.isArray(request.resident)
            ? request.resident[0]
            : request.resident
          : null;
        return { ...s, request: request ? { ...request, resident } : null };
      })
      .sort((a, b) => a.stop_order - b.stop_order),
  }));

  const availableRoutes = (availableData ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    scheduled_date: r.scheduled_date,
    time_window: r.time_window,
    notes: r.notes,
    stopCount:
      Array.isArray(r.stop_count) && r.stop_count[0]
        ? Number(r.stop_count[0].count ?? 0)
        : 0,
  }));

  const totalStops = routes.reduce((sum, r) => sum + r.stops.length, 0);
  const completedStops = routes.reduce(
    (sum, r) => sum + r.stops.filter((s) => s.status === "completed").length,
    0,
  );
  const pendingStops = routes.reduce(
    (sum, r) => sum + r.stops.filter((s) => s.status === "pending").length,
    0,
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Routes &amp; Tasks
        </h1>
        <p className="text-muted-foreground">
          Claim an open route, then work through your assigned pickup stops.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            <CardTitle>Available routes</CardTitle>
          </div>
          <CardDescription>
            Planned routes that don&apos;t have a collector yet — claim one to add
            it to your queue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableRoutes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No open routes available right now.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableRoutes.map((r) => (
                <div
                  key={r.id}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(r.scheduled_date), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1 capitalize">
                          <Clock className="w-3 h-3" />
                          {r.time_window}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {r.stopCount} stop{r.stopCount === 1 ? "" : "s"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {r.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      &ldquo;{r.notes}&rdquo;
                    </p>
                  )}
                  <ClaimRouteButton routeId={r.id} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-3">
          <User className="w-5 h-5 text-primary" />
          My assigned tasks
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground mb-1">Total</p>
          <p className="text-2xl font-semibold">{totalStops}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-semibold text-yellow-600">{pendingStops}</p>
        </div>
        <div className="bg-white rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-2xl font-semibold text-green-600">{completedStops}</p>
        </div>
      </div>

      {routes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No assigned routes yet. Claim one above or wait for an admin to
              assign one.
            </p>
          </CardContent>
        </Card>
      ) : (
        routes.map((route) => (
          <Card key={route.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{route.name}</span>
                <span className="text-sm font-normal text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(parseISO(route.scheduled_date), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    <Clock className="w-4 h-4" />
                    {route.time_window}
                  </span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {route.stops.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  This route has no stops yet.
                </p>
              ) : (
                route.stops.map((stop) => (
                  <div
                    key={stop.id}
                    className="border border-border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                          {stop.stop_order}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {stop.request
                              ? REQUEST_TYPE_LABELS[stop.request.type as RequestType]
                              : "Removed request"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {stop.request?.resident?.full_name ?? "—"}
                            {stop.request?.resident?.phone &&
                              ` • ${stop.request.resident.phone}`}
                          </p>
                        </div>
                      </div>
                      <StopStatusBadge status={stop.status} />
                    </div>

                    <div className="flex items-start justify-between gap-3 text-sm text-foreground">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span>{stop.request?.address ?? "—"}</span>
                      </div>
                      {stop.request &&
                        typeof stop.request.latitude === "number" &&
                        typeof stop.request.longitude === "number" && (
                          <StopNavButton
                            stop={{
                              address: stop.request.address,
                              latitude: stop.request.latitude,
                              longitude: stop.request.longitude,
                            }}
                          />
                        )}
                    </div>

                    {(stop.request?.scheduled_time_window ||
                      stop.request?.preferred_time_window) && (
                      <p className="text-xs text-muted-foreground">
                        Time window:{" "}
                        {stop.request.scheduled_time_window ??
                          stop.request.preferred_time_window}
                      </p>
                    )}

                    {stop.request?.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                        <span className="font-medium">Note: </span>
                        {stop.request.notes}
                      </div>
                    )}

                    <StopActions stopId={stop.id} status={stop.status} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
