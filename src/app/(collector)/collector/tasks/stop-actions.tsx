"use client";

import { useTransition } from "react";
import { CheckCircle, MapPin, Navigation, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateStopStatusAction } from "@/lib/actions/collector";
import type { StopStatus } from "@/lib/types/database";

interface Props {
  stopId: string;
  status: StopStatus;
}

export function StopActions({ stopId, status }: Props) {
  const [pending, startTransition] = useTransition();

  const isTerminal =
    status === "completed" || status === "missed" || status === "skipped";

  const handleUpdate = (next: StopStatus, message: string) => {
    startTransition(async () => {
      const result = await updateStopStatusAction(stopId, next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(message);
    });
  };

  if (isTerminal) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
      {status === "pending" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleUpdate("en_route", "Marked as en route.")}
          disabled={pending}
        >
          <Navigation className="w-4 h-4 mr-1" />
          En route
        </Button>
      )}
      {(status === "pending" || status === "en_route") && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleUpdate("arrived", "Arrived at location.")}
          disabled={pending}
        >
          <MapPin className="w-4 h-4 mr-1" />
          Arrived
        </Button>
      )}
      <Button
        size="sm"
        onClick={() => handleUpdate("completed", "Pickup completed!")}
        disabled={pending}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <CheckCircle className="w-4 h-4 mr-1" />
        Complete
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleUpdate("missed", "Marked as missed.")}
        disabled={pending}
        className="text-destructive hover:bg-destructive/10"
      >
        <XCircle className="w-4 h-4 mr-1" />
        Missed
      </Button>
    </div>
  );
}
