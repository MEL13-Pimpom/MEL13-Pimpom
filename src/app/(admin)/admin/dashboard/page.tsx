import { ClipboardList, Clock, PackageCheck, Users } from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  const [
    { count: pendingCount },
    { count: scheduledCount },
    { count: completedCount },
    { count: residentCount },
  ] = await Promise.all([
    supabase
      .from("pickup_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("pickup_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled"),
    supabase
      .from("pickup_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "resident"),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome, {profile.full_name || "Admin"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Operational overview of the recycling pickup program.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Pending Approval"
          value={pendingCount ?? 0}
          icon={Clock}
          tone="amber"
        />
        <StatsCard
          label="Scheduled"
          value={scheduledCount ?? 0}
          icon={ClipboardList}
          tone="primary"
        />
        <StatsCard
          label="Completed"
          value={completedCount ?? 0}
          icon={PackageCheck}
          tone="primary"
        />
        <StatsCard
          label="Residents"
          value={residentCount ?? 0}
          icon={Users}
          tone="default"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Detailed analytics will appear here in the next phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
