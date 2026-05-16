import { format, parseISO } from "date-fns";
import { Calendar, MapPin, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StopStatusBadge } from "@/components/shared/status-badge";
import { requireRole } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REQUEST_TYPE_LABELS } from "@/lib/validations/request";
import type { RequestType } from "@/lib/types/database";
import { StopActions } from "./stop-actions";
import { StopNavButton } from "@/components/collector/stop-nav-button";

export const metadata = { title: "My Tasks" };

export default async function CollectorTasksPage() {
  const profile = await requireRole("collector");
  const supabase = await createSupabaseServerClient();

  const { data: routesData } = await supabase
    .from("routes")
    .select(
      "id, name, scheduled_date, status, stops:route_stops(id, stop_order, status, notes, arrived_at, completed_at, request:pickup_requests(id, address, latitude, longitude, type, scheduled_time_window, preferred_time_window, weight_kg_estimate, notes, resident:profiles!pickup_requests_resident_id_fkey(full_name, phone)))",
    )
    .eq("collector_id", profile.id)
    .in("status", ["planned", "in_progress"])
    .order("scheduled_date", { ascending: true });

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
        <h1 className="text-3xl font-semibold text-foreground mb-2">My Tasks</h1>
        <p className="text-muted-foreground">
          All pickup tasks assigned to you across active routes.
        </p>
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
              No tasks assigned. Your administrator will assign routes when they&apos;re
              ready.
            </p>
          </CardContent>
        </Card>
      ) : (
        routes.map((route) => (
          <Card key={route.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{route.name}</span>
                <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(parseISO(route.scheduled_date), "MMM d, yyyy")}
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
