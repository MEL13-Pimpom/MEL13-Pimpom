import { CheckCircle2, ClipboardList, Route as RouteIcon } from "lucide-react";
import { StatsCard } from "@/components/shared/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export const metadata = { title: "Collector Dashboard" };

export default async function CollectorDashboardPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold">
          Hello, {profile.full_name || "Collector"}
        </h1>
        <p className="text-muted-foreground mt-1">
          Your assigned pickups and route for the day.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="Today's Stops" value={0} icon={ClipboardList} tone="primary" />
        <StatsCard label="Completed" value={0} icon={CheckCircle2} tone="primary" />
        <StatsCard label="Active Route" value="None" icon={RouteIcon} tone="default" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s route</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No route assigned yet. Check back later or contact your administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
