"use client";

import { useTransition } from "react";
import { CheckCircle, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  completeRouteAction,
  startRouteAction,
} from "@/lib/actions/collector";
import type { RouteStatus } from "@/lib/types/database";

interface Props {
  routeId: string;
  status: RouteStatus;
  canComplete: boolean;
}

export function RouteControls({ routeId, status, canComplete }: Props) {
  const [pending, startTransition] = useTransition();

  const handleStart = () => {
    startTransition(async () => {
      const result = await startRouteAction(routeId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Route started — good luck out there!");
    });
  };

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeRouteAction(routeId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Route completed. Great job!");
    });
  };

  if (status === "planned") {
    return (
      <Button onClick={handleStart} disabled={pending}>
        <Play className="w-4 h-4 mr-2" />
        {pending ? "Starting..." : "Start route"}
      </Button>
    );
  }

  if (status === "in_progress") {
    return (
      <Button
        onClick={handleComplete}
        disabled={pending || !canComplete}
        className="bg-green-600 hover:bg-green-700 text-white"
        title={canComplete ? "Complete route" : "Finish all stops first"}
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        {pending ? "Saving..." : "Complete route"}
      </Button>
    );
  }

  return null;
}
