import Link from "next/link";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileText,
  Recycle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { format, formatDistanceToNow, parseISO, subMonths, startOfMonth } from "date-fns";
import { StatsCard } from "@/components/shared/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const AUDIT_LOGS_PER_PAGE = 20;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ auditPage?: string }>;
}) {
  await requireRole("admin");
  const supabase = await createSupabaseServerClient();

  const sixMonthsAgo = subMonths(startOfMonth(new Date()), 5).toISOString();

  const { auditPage: auditPageParam } = await searchParams;
  const requestedAuditPage = Math.max(
    1,
    Number.parseInt(auditPageParam ?? "1", 10) || 1,
  );
  const auditFrom = (requestedAuditPage - 1) * AUDIT_LOGS_PER_PAGE;
  const auditTo = auditFrom + AUDIT_LOGS_PER_PAGE - 1;

  const [
    { data: allRequests },
    { data: recentRequests },
    { data: auditData, count: auditTotal },
  ] = await Promise.all([
    supabase.from("pickup_requests").select("id, status, type, weight_kg_estimate"),
    supabase
      .from("pickup_requests")
      .select("id, status, type, weight_kg_estimate, created_at")
      .gte("created_at", sixMonthsAgo),
    supabase
      .from("audit_logs")
      .select(
        "id, action, actor_id, actor_name, target_type, target_id, old_value, new_value, ip_address, created_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(auditFrom, auditTo),
  ]);

  const auditLogs = auditData ?? [];
  const totalAuditLogs = auditTotal ?? 0;
  const totalAuditPages = Math.max(
    1,
    Math.ceil(totalAuditLogs / AUDIT_LOGS_PER_PAGE),
  );
  const currentAuditPage = Math.min(requestedAuditPage, totalAuditPages);

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

      <Card id="audit-logs" className="scroll-mt-20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <CardTitle>System Audit Logs</CardTitle>
          </div>
          <CardDescription>
            {totalAuditLogs === 0
              ? "No audit events recorded yet."
              : `Showing ${auditFrom + 1}–${Math.min(
                  auditTo + 1,
                  totalAuditLogs,
                )} of ${totalAuditLogs} actions across requests, routes, and user management.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No audit events recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell
                        className="whitespace-nowrap text-xs"
                        title={format(parseISO(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                      >
                        {formatDistanceToNow(parseISO(log.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {log.actor_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.target_type ? (
                          <>
                            <span className="font-medium">{log.target_type}</span>
                            {log.target_id ? (
                              <span className="ml-1 font-mono">
                                {String(log.target_id).slice(0, 8)}
                              </span>
                            ) : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs">
                        {log.old_value || log.new_value ? (
                          <span>
                            {log.old_value ? (
                              <span className="line-through opacity-70">
                                {log.old_value}
                              </span>
                            ) : null}
                            {log.old_value && log.new_value ? " → " : ""}
                            {log.new_value ?? ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.ip_address ? String(log.ip_address) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalAuditPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {currentAuditPage} of {totalAuditPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={currentAuditPage <= 1}
                >
                  <Link
                    href={`/admin/reports?auditPage=${Math.max(
                      1,
                      currentAuditPage - 1,
                    )}#audit-logs`}
                    aria-disabled={currentAuditPage <= 1}
                    className={
                      currentAuditPage <= 1 ? "pointer-events-none opacity-50" : ""
                    }
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  disabled={currentAuditPage >= totalAuditPages}
                >
                  <Link
                    href={`/admin/reports?auditPage=${Math.min(
                      totalAuditPages,
                      currentAuditPage + 1,
                    )}#audit-logs`}
                    aria-disabled={currentAuditPage >= totalAuditPages}
                    className={
                      currentAuditPage >= totalAuditPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
