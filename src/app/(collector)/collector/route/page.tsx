import { format } from "date-fns";
import { CheckCircle2, Clock, Flag, MapPin, Navigation, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteStatusBadge } from "@/components/shared/status-badge";
import { requireRole } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REQUEST_TYPE_LABELS } from "@/lib/validations/request";
import type { RequestType } from "@/lib/types/database";
import { StopActions } from "../tasks/stop-actions";
import { RouteControls } from "./route-controls";
import { RouteActions } from "@/components/collector/route-actions";
import { StopNavButton } from "@/components/collector/stop-nav-button";

export const metadata = { title: "Today's Route" };

export default async function CollectorRoutePage() {
  const profile = await requireRole("collector");
  const supabase = await createSupabaseServerClient();

  const today = format(new Date(), "yyyy-MM-dd");

  const { data: routesData } = await supabase
    .from("routes")
    .select(
      "id, name, scheduled_date, status, notes, stops:route_stops(id, stop_order, status, notes, arrived_at, completed_at, request:pickup_requests(id, address, latitude, longitude, type, scheduled_time_window, preferred_time_window, weight_kg_estimate, notes, resident:profiles!pickup_requests_resident_id_fkey(full_name, phone)))",
    )
    .eq("collector_id", profile.id)
    .in("status", ["planned", "in_progress"])
    .eq("scheduled_date", today)
    .order("created_at", { ascending: true });

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

  if (routes.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">
            Today&apos;s Route
          </h1>
          <p className="text-muted-foreground">
            Your assigned route appears here when one is ready.
          </p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No route scheduled for today. Check back tomorrow or open the
              Tasks page to claim an upcoming route.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const todayLabel = format(new Date(), "EEEE, MMM d, yyyy");

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Today&apos;s Route{routes.length > 1 ? "s" : ""}
        </h1>
        <p className="text-muted-foreground">
          {todayLabel}
          {routes.length > 1 ? ` • ${routes.length} routes scheduled` : ""}
        </p>
      </div>

      {routes.map((route) => {
        const stops = route.stops;
        const navStops = stops
          .map((s) =>
            s.request &&
            typeof s.request.latitude === "number" &&
            typeof s.request.longitude === "number"
              ? {
                  address: s.request.address,
                  latitude: s.request.latitude,
                  longitude: s.request.longitude,
                }
              : null,
          )
          .filter(
            (s): s is { address: string; latitude: number; longitude: number } =>
              s !== null,
          );

        const remainingNavStops = stops
          .filter((s) => s.status !== "completed" && s.status !== "skipped")
          .map((s) =>
            s.request &&
            typeof s.request.latitude === "number" &&
            typeof s.request.longitude === "number"
              ? {
                  address: s.request.address,
                  latitude: s.request.latitude,
                  longitude: s.request.longitude,
                }
              : null,
          )
          .filter(
            (s): s is { address: string; latitude: number; longitude: number } =>
              s !== null,
          );

        const total = stops.length;
        const completedCount = stops.filter((s) => s.status === "completed").length;
        const inProgress = stops.find(
          (s) => s.status === "en_route" || s.status === "arrived",
        );
        const nextPending = stops.find((s) => s.status === "pending");
        const currentStopId = inProgress?.id ?? nextPending?.id;
        const progressPct = total > 0 ? (completedCount / total) * 100 : 0;
        const allDone =
          total > 0 &&
          stops.every((s) =>
            ["completed", "missed", "skipped"].includes(s.status),
          );

        return (
          <div key={route.id} className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {route.name}
              </h2>
              <RouteStatusBadge status={route.status} />
            </div>

            <div className="bg-gradient-to-r from-primary to-green-600 rounded-lg p-6 text-white shadow-lg">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-green-50 text-sm">Total stops</p>
                  <p className="text-3xl font-semibold">{total}</p>
                </div>
                <div>
                  <p className="text-green-50 text-sm">Completed</p>
                  <p className="text-3xl font-semibold">{completedCount}</p>
                </div>
                <div>
                  <p className="text-green-50 text-sm">Remaining</p>
                  <p className="text-3xl font-semibold">{total - completedCount}</p>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex-1">
                  <CardTitle>Route progress</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                    <span>
                      {completedCount} of {total} stops completed
                    </span>
                    <span>•</span>
                    <RouteStatusBadge status={route.status} />
                  </p>
                </div>
                <RouteControls
                  routeId={route.id}
                  status={route.status}
                  canComplete={allDone}
                />
              </CardHeader>
              <CardContent>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {route.notes && (
                  <p className="text-sm text-muted-foreground italic mt-4">
                    &ldquo;{route.notes}&rdquo;
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle>Stops</CardTitle>
                {navStops.length > 0 && (
                  <RouteActions
                    stops={
                      remainingNavStops.length > 0 ? remainingNavStops : navStops
                    }
                  />
                )}
              </CardHeader>
              <CardContent>
                {stops.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No stops on this route yet.
                  </p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-border" />
                    <div className="space-y-6">
                      {stops.map((stop) => {
                        const isCurrent = stop.id === currentStopId;
                        const isCompleted = stop.status === "completed";
                        return (
                          <div
                            key={stop.id}
                            className={`relative pl-16 ${
                              isCurrent ? "bg-accent rounded-lg p-4 -ml-4" : ""
                            } ${isCompleted ? "opacity-70" : ""}`}
                          >
                            <div
                              className={`absolute left-0 top-0 w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg z-10 ${
                                isCompleted
                                  ? "bg-green-600 text-white"
                                  : isCurrent
                                    ? "bg-primary text-white ring-4 ring-primary/30"
                                    : "bg-white border-2 border-border text-muted-foreground"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-6 h-6" />
                              ) : (
                                stop.stop_order
                              )}
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-lg">
                                    {stop.request
                                      ? REQUEST_TYPE_LABELS[
                                          stop.request.type as RequestType
                                        ]
                                      : "Removed request"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {stop.request?.resident?.full_name ?? "—"}
                                    {stop.request?.resident?.phone &&
                                      ` • ${stop.request.resident.phone}`}
                                  </p>
                                </div>
                                {isCurrent && !isCompleted && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-primary text-white">
                                    <Navigation className="w-3 h-3 mr-1" />
                                    Current
                                  </span>
                                )}
                              </div>

                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2 text-foreground">
                                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <p>{stop.request?.address ?? "—"}</p>
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

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
                                {(stop.request?.scheduled_time_window ||
                                  stop.request?.preferred_time_window) && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {stop.request.scheduled_time_window ??
                                        stop.request.preferred_time_window}
                                    </span>
                                  </div>
                                )}
                                {stop.request?.weight_kg_estimate != null && (
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    <span>
                                      {stop.request.weight_kg_estimate} kg
                                    </span>
                                  </div>
                                )}
                              </div>

                              {stop.request?.notes && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                                  <span className="font-medium">Note: </span>
                                  {stop.request.notes}
                                </div>
                              )}

                              <StopActions
                                stopId={stop.id}
                                status={stop.status}
                              />
                            </div>
                          </div>
                        );
                      })}

                      <div className="relative pl-16">
                        <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center z-10">
                          <Flag className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">Route complete</p>
                          <p className="text-sm text-muted-foreground">
                            Return to depot when done.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
