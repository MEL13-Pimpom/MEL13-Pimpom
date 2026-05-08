import { ClipboardList, Clock, PackageCheck, Recycle } from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export const metadata = { title: "Resident Dashboard" };

export default async function ResidentDashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome back, {profile.full_name || "Resident"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your recycling pickups and schedule new ones.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Active Requests" value={0} icon={ClipboardList} tone="primary" />
        <StatsCard label="Awaiting Approval" value={0} icon={Clock} tone="amber" />
        <StatsCard label="Completed" value={0} icon={PackageCheck} tone="primary" />
        <StatsCard label="Total Recycled" value="0 kg" icon={Recycle} tone="default" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming up</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any scheduled pickups yet. Submit a new request to get
            started.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
