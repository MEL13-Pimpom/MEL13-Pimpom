import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Package } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REQUEST_TYPE_LABELS } from "@/lib/validations/request";
import { CreateRouteForm } from "./create-route-form";
import { RouteCard } from "./route-card";

export const metadata = { title: "Route Assignment" };

const ROUTES_PER_PAGE = 10;

export default async function AdminRoutesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireRole("admin");
  const supabase = await createSupabaseServerClient();

  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const from = (requestedPage - 1) * ROUTES_PER_PAGE;
  const to = from + ROUTES_PER_PAGE - 1;

  const [
    { data: routesData, count: routesTotal },
    { data: collectorsData },
    { data: assignedStopsData },
  ] = await Promise.all([
    supabase
      .from("routes")
      .select(
        "id, name, scheduled_date, time_window, status, notes, collector:profiles!routes_collector_id_fkey(id, full_name), stops:route_stops(id, stop_order, status, request:pickup_requests(id, address, type, scheduled_time_window, preferred_time_window))",
        { count: "exact" },
      )
      .order("scheduled_date", { ascending: false })
      .range(from, to),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "collector")
      .order("full_name", { ascending: true }),
    supabase.from("route_stops").select("request_id, status"),
  ]);

  const totalRoutes = routesTotal ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRoutes / ROUTES_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);

  // A request is considered "occupied" only if it has an active stop.
  // Missed/skipped stops free the request so it can be added to another route.
  const activelyAssignedRequestIds = new Set(
    (assignedStopsData ?? [])
      .filter((s) => s.status !== "missed" && s.status !== "skipped")
      .map((s) => s.request_id),
  );

  const { data: assignableRequests } = await supabase
    .from("pickup_requests")
    .select(
      "id, address, type, preferred_date, preferred_time_window, scheduled_date, scheduled_time_window, status, resident:profiles!pickup_requests_resident_id_fkey(full_name)",
    )
    .in("status", ["approved", "scheduled"])
    .order("preferred_date", { ascending: true });

  const unassigned = (assignableRequests ?? [])
    .filter((r) => !activelyAssignedRequestIds.has(r.id))
    .map((r) => ({
      ...r,
      effectiveDate: r.scheduled_date ?? r.preferred_date,
      effectiveWindow: r.scheduled_time_window ?? r.preferred_time_window,
    }));

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
          Build collection routes, assign collectors, and group pickup requests
          (matched by date + time window).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-start">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Create route</CardTitle>
            <CardDescription>
              Pick a date + time window. Only requests matching both can be added.
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
              These approved/scheduled requests are not yet on any active route.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unassigned.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing waiting — every approved request is on a route.
              </p>
            ) : (
              <div className="space-y-2 max-h-[22rem] overflow-y-auto pr-1">
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
                        <p className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(r.effectiveDate), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1 capitalize">
                            <Clock className="w-3 h-3" />
                            {r.effectiveWindow}
                          </span>
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
            All routes ({totalRoutes})
          </h2>
          {totalPages > 1 && (
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
          )}
        </div>

        {totalRoutes === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No routes yet. Create one above to start grouping pickups.
              </p>
            </CardContent>
          </Card>
        ) : (
          routes.map((route) => {
            const matchingRequests = unassigned
              .filter(
                (r) =>
                  r.effectiveDate === route.scheduled_date &&
                  r.effectiveWindow === route.time_window,
              )
              .map((r) => ({
                id: r.id,
                address: r.address,
                type: r.type,
              }));

            return (
              <RouteCard
                key={route.id}
                route={{
                  id: route.id,
                  name: route.name,
                  scheduledDate: route.scheduled_date,
                  timeWindow: route.time_window,
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
                assignableRequests={matchingRequests}
              />
            );
          })
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Showing {from + 1}–{Math.min(to + 1, totalRoutes)} of {totalRoutes}
            </p>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
              >
                <Link
                  href={`/admin/routes?page=${Math.max(1, currentPage - 1)}`}
                  aria-disabled={currentPage <= 1}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {currentPage} / {totalPages}
              </span>
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
              >
                <Link
                  href={`/admin/routes?page=${Math.min(totalPages, currentPage + 1)}`}
                  aria-disabled={currentPage >= totalPages}
                  className={
                    currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
                  }
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
