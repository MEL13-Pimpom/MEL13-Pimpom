import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RequestStatus, RouteStatus, StopStatus } from "@/lib/types/database";

const REQUEST_STYLES: Record<RequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  missed: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};

const ROUTE_STYLES: Record<RouteStatus, string> = {
  planned: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  uncompleted: "bg-orange-100 text-orange-800 border-orange-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};

const STOP_STYLES: Record<StopStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  en_route: "bg-blue-100 text-blue-800 border-blue-200",
  arrived: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  missed: "bg-red-100 text-red-800 border-red-200",
  skipped: "bg-gray-100 text-gray-700 border-gray-200",
};

function humanize(value: string) {
  return value
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", REQUEST_STYLES[status])}>
      {humanize(status)}
    </Badge>
  );
}

export function RouteStatusBadge({ status }: { status: RouteStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", ROUTE_STYLES[status])}>
      {humanize(status)}
    </Badge>
  );
}

export function StopStatusBadge({ status }: { status: StopStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", STOP_STYLES[status])}>
      {humanize(status)}
    </Badge>
  );
}
