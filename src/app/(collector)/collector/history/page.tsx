import { format, parseISO } from "date-fns";
import {
  Award,
  Calendar,
  CheckCircle2,
  History,
  Package,
  Recycle,
} from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Route History" };

export default async function CollectorHistoryPage() {
  const profile = await requireRole("collector");
  const supabase = await createSupabaseServerClient();

  const { data: routesData } = await supabase
    .from("routes")
    .select(
      "id, name, scheduled_date, status, stops:route_stops(id, status, request:pickup_requests(weight_kg_estimate))",
    )
    .eq("collector_id", profile.id)
    .eq("status", "completed")
    .order("scheduled_date", { ascending: false })
    .limit(50);

  const routes = (routesData ?? []).map((r) => ({
    ...r,
    stops: (r.stops ?? []).map((s) => ({
      ...s,
      request: Array.isArray(s.request) ? s.request[0] : s.request,
    })),
  }));

  const totalRoutes = routes.length;
  const totalStops = routes.reduce((sum, r) => sum + r.stops.length, 0);
  const totalCompletedStops = routes.reduce(
    (sum, r) => sum + r.stops.filter((s) => s.status === "completed").length,
    0,
  );
  const totalKg = routes.reduce(
    (sum, r) =>
      sum +
      r.stops.reduce(
        (s, st) =>
          st.status === "completed"
            ? s + (st.request?.weight_kg_estimate ?? 0)
            : s,
        0,
      ),
    0,
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2 flex items-center gap-2">
          <History className="w-7 h-7 text-primary" />
          Route History
        </h1>
        <p className="text-muted-foreground">
          Routes you&apos;ve completed and your personal recycling impact.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Completed Routes"
          value={totalRoutes}
          icon={Award}
          tone="primary"
        />
        <StatsCard
          label="Total Stops"
          value={totalStops}
          icon={Package}
          tone="default"
        />
        <StatsCard
          label="Pickups Done"
          value={totalCompletedStops}
          icon={CheckCircle2}
          tone="primary"
        />
        <StatsCard
          label="kg Recycled"
          value={`${totalKg.toFixed(1)} kg`}
          icon={Recycle}
          tone="primary"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent completed routes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto px-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Stops</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Missed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No completed routes yet — your history will appear here.
                    </TableCell>
                  </TableRow>
                ) : (
                  routes.map((r) => {
                    const completedStops = r.stops.filter(
                      (s) => s.status === "completed",
                    ).length;
                    const missedStops = r.stops.filter(
                      (s) => s.status === "missed",
                    ).length;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {format(parseISO(r.scheduled_date), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.stops.length}</TableCell>
                        <TableCell className="text-green-600">
                          {completedStops}
                        </TableCell>
                        <TableCell className={missedStops > 0 ? "text-red-600" : ""}>
                          {missedStops}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-200"
                          >
                            Completed
                          </Badge>
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
    </div>
  );
}
