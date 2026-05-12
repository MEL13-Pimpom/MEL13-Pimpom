import { BarChart3, FileText, Recycle, TrendingUp } from "lucide-react";
import { format, parseISO, subMonths, startOfMonth } from "date-fns";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { REQUEST_TYPE_LABELS } from "@/lib/validations/request";
import type { RequestStatus, RequestType } from "@/lib/types/database";
import { ReportsCharts } from "./reports-charts";

export const metadata = { title: "Reports & Analytics" };

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  missed: "Missed",
};

export default async function AdminReportsPage() {
  await requireRole("admin");
  const supabase = await createSupabaseServerClient();

  const sixMonthsAgo = subMonths(startOfMonth(new Date()), 5).toISOString();

  const [{ data: allRequests }, { data: recentRequests }] = await Promise.all([
    supabase.from("pickup_requests").select("id, status, type, weight_kg_estimate"),
    supabase
      .from("pickup_requests")
      .select("id, status, type, weight_kg_estimate, created_at")
      .gte("created_at", sixMonthsAgo),
  ]);

  const all = allRequests ?? [];
  const total = all.length;
  const completed = all.filter((r) => r.status === "completed");
  const completedCount = completed.length;
  const completionRate = total > 0 ? (completedCount / total) * 100 : 0;
  const totalKg = completed.reduce(
    (sum, r) => sum + (r.weight_kg_estimate ?? 0),
    0,
  );

  const monthlyMap = new Map<string, { requests: number; completed: number; kg: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(startOfMonth(new Date()), i);
    monthlyMap.set(format(d, "yyyy-MM"), { requests: 0, completed: 0, kg: 0 });
  }
  for (const r of recentRequests ?? []) {
    const key = format(parseISO(r.created_at), "yyyy-MM");
    const bucket = monthlyMap.get(key);
    if (!bucket) continue;
    bucket.requests += 1;
    if (r.status === "completed") {
      bucket.completed += 1;
      bucket.kg += r.weight_kg_estimate ?? 0;
    }
  }
  const monthly = Array.from(monthlyMap.entries()).map(([key, v]) => ({
    month: format(parseISO(`${key}-01`), "MMM"),
    requests: v.requests,
    completed: v.completed,
    kg: Number(v.kg.toFixed(1)),
  }));

  const typeCounts = new Map<RequestType, number>();
  for (const r of all) {
    typeCounts.set(r.type, (typeCounts.get(r.type) ?? 0) + 1);
  }
  const wasteDistribution = Array.from(typeCounts.entries()).map(([type, value]) => ({
    name: REQUEST_TYPE_LABELS[type],
    value,
  }));

  const statusCounts = new Map<RequestStatus, number>();
  for (const r of all) {
    statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
  }
  const statusData = Array.from(statusCounts.entries()).map(([status, count]) => ({
    status: STATUS_LABELS[status],
    count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground">
          System performance metrics and recycling insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Requests"
          value={total}
          icon={FileText}
          tone="primary"
        />
        <StatsCard
          label="Completion Rate"
          value={`${completionRate.toFixed(1)}%`}
          icon={TrendingUp}
          tone="primary"
          helper={`${completedCount} of ${total} completed`}
        />
        <StatsCard
          label="Total Recycled"
          value={`${totalKg.toFixed(1)} kg`}
          icon={Recycle}
          tone="default"
        />
        <StatsCard
          label="Statuses Tracked"
          value={statusData.length}
          icon={BarChart3}
          tone="default"
        />
      </div>

      <ReportsCharts
        monthly={monthly}
        wasteDistribution={wasteDistribution}
        statusData={statusData}
      />

      <Card>
        <CardHeader>
          <CardTitle>Status breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statusData.map((s) => (
              <div key={s.status} className="p-4 border border-border rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{s.status}</p>
                <p className="text-2xl font-semibold">{s.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
