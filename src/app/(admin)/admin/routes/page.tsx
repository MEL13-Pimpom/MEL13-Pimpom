import { format, parseISO } from "date-fns";
import { Calendar, MapPin, Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REQUEST_TYPE_LABELS } from "@/lib/validations/request";
import { CreateRouteForm } from "./create-route-form";
import { RouteCard } from "./route-card";

export const metadata = { title: "Route Assignment" };

export default async function AdminRoutesPage() {
  await requireRole("admin");
  const supabase = await createSupabaseServerClient();

  const [
    { data: routesData },
    { data: collectorsData },
    { data: assignedRequestIdsData },
  ] = await Promise.all([
    supabase
      .from("routes")
      .select(
        "id, name, scheduled_date, status, notes, collector:profiles!routes_collector_id_fkey(id, full_name), stops:route_stops(id, stop_order, status, request:pickup_requests(id, address, type, scheduled_time_window, preferred_time_window))",
      )
      .order("scheduled_date", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "collector")
      .order("full_name", { ascending: true }),
    supabase.from("route_stops").select("request_id"),
  ]);

  const assignedRequestIds = new Set(
    (assignedRequestIdsData ?? []).map((r) => r.request_id),
  );

  const { data: assignableRequests } = await supabase
    .from("pickup_requests")
    .select(
      "id, address, type, preferred_date, preferred_time_window, scheduled_date, scheduled_time_window, status, resident:profiles!pickup_requests_resident_id_fkey(full_name)",
    )
    .in("status", ["approved", "scheduled"])
    .order("preferred_date", { ascending: true });

  const unassigned = (assignableRequests ?? []).filter(
    (r) => !assignedRequestIds.has(r.id),
  );

  const routes = (routesData ?? []).map((r) => ({
    ...r,
    collector: Array.isArray(r.collector) ? r.collector[0] : r.collector,
    stops: (r.stops ?? [])
      .map((s) => ({
        ...s,
        request: Array.isArray(s.request) ? s.request[0] : s.request,
      }))
      .sort((a, b) => a.stop_order - b.stop_order),
  }));

  const collectors = collectorsData ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Route Assignment
        </h1>
        <p className="text-muted-foreground">
          Build collection routes, assign collectors, and group pickup requests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Create route</CardTitle>
            <CardDescription>
              Set a date and (optionally) assign a collector now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateRouteForm collectors={collectors} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Unassigned approved requests</CardTitle>
            <CardDescription>
              These approved/scheduled requests are not yet attached to any route.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unassigned.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing waiting — every approved request is on a route.
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {unassigned.map((r) => {
                  const resident = Array.isArray(r.resident)
                    ? r.resident[0]
                    : r.resident;
                  return (
                    <div
                      key={r.id}
                      className="flex items-start gap-3 p-3 border border-border rounded-lg"
                    >
                      <Package className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-medium text-sm">
                            {REQUEST_TYPE_LABELS[r.type]}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {r.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {resident?.full_name ?? "—"} • {r.address}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(
                            parseISO(r.scheduled_date ?? r.preferred_date),
                            "MMM d, yyyy",
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            All routes ({routes.length})
          </h2>
        </div>

        {routes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No routes yet. Create one above to start grouping pickups.
              </p>
            </CardContent>
          </Card>
        ) : (
          routes.map((route) => (
            <RouteCard
              key={route.id}
              route={{
                id: route.id,
                name: route.name,
                scheduledDate: route.scheduled_date,
                status: route.status,
                notes: route.notes,
                collector: route.collector ?? null,
                stops: route.stops.map((s) => ({
                  id: s.id,
                  stopOrder: s.stop_order,
                  status: s.status,
                  request: s.request
                    ? {
                        id: s.request.id,
                        address: s.request.address,
                        type: s.request.type,
                        timeWindow:
                          s.request.scheduled_time_window ??
                          s.request.preferred_time_window,
                      }
                    : null,
                })),
              }}
              collectors={collectors}
              assignableRequests={unassigned.map((r) => ({
                id: r.id,
                address: r.address,
                type: r.type,
              }))}
            />
          ))
        )}
      </div>
    </div>
  );
}
