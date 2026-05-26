"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin, Plus, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StopStatusBadge } from "@/components/shared/status-badge";
import {
  addStopToRouteAction,
  assignCollectorAction,
  removeStopFromRouteAction,
} from "@/lib/actions/admin";
import { REQUEST_TYPE_LABELS } from "@/lib/validations/request";
import type { RequestType, RouteStatus, StopStatus } from "@/lib/types/database";

interface RouteData {
  id: string;
  name: string;
  scheduledDate: string;
  timeWindow: string;
  status: RouteStatus;
  notes: string | null;
  collector: { id: string; full_name: string } | null;
  stops: {
    id: string;
    stopOrder: number;
    status: StopStatus;
    request: {
      id: string;
      address: string;
      type: RequestType;
      timeWindow: string | null;
    } | null;
  }[];
}

interface Props {
  route: RouteData;
  collectors: { id: string; full_name: string }[];
  assignableRequests: { id: string; address: string; type: RequestType }[];
}

const UNASSIGNED = "__unassigned";

export function RouteCard({ route, collectors, assignableRequests }: Props) {
  const router = useRouter();
  const [stopToAdd, setStopToAdd] = useState<string>("");
  const [addPending, startAdd] = useTransition();
  const [removePending, startRemove] = useTransition();
  const [assignPending, startAssign] = useTransition();

  const handleAddStop = () => {
    if (!stopToAdd) return;
    startAdd(async () => {
      const result = await addStopToRouteAction(route.id, stopToAdd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Stop added to route.");
      setStopToAdd("");
      router.refresh();
    });
  };

  const handleRemoveStop = (stopId: string) => {
    startRemove(async () => {
      const result = await removeStopFromRouteAction(stopId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Stop removed.");
      router.refresh();
    });
  };

  const handleAssignCollector = (collectorId: string) => {
    if (collectorId === UNASSIGNED || !collectorId) return;
    startAssign(async () => {
      const result = await assignCollectorAction({
        routeId: route.id,
        collectorId,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Collector assigned.");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {route.name}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(parseISO(route.scheduledDate), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1 capitalize">
                <Clock className="w-4 h-4" />
                {route.timeWindow}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {route.collector?.full_name ?? "Unassigned"}
              </span>
              <span className="capitalize px-2 py-0.5 rounded-full bg-secondary text-xs">
                {route.status}
              </span>
            </div>
            {route.notes && (
              <p className="text-sm text-muted-foreground italic mt-2">
                &ldquo;{route.notes}&rdquo;
              </p>
            )}
          </div>
          <div className="w-full md:w-48 flex justify-end">
            <Select
              value={route.collector?.id ?? UNASSIGNED}
              onValueChange={handleAssignCollector}
              disabled={assignPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign collector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED} disabled>
                  Assign collector
                </SelectItem>
                {collectors.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {route.stops.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No stops yet — add an approved request below.
          </p>
        ) : (
          <ol className="space-y-2">
            {route.stops.map((stop) => (
              <li
                key={stop.id}
                className="flex items-center gap-4 p-3 bg-secondary rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
                  {stop.stopOrder}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-sm">
                      {stop.request
                        ? REQUEST_TYPE_LABELS[stop.request.type]
                        : "Removed request"}
                    </p>
                    <StopStatusBadge status={stop.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {stop.request?.address ?? "—"}
                    {stop.request?.timeWindow ? ` • ${stop.request.timeWindow}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveStop(stop.id)}
                  disabled={removePending}
                  className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ol>
        )}

        {assignableRequests.length > 0 ? (
          <div className="flex gap-2 items-end pt-2 border-t border-border">
            <div className="flex-1">
              <Select value={stopToAdd} onValueChange={setStopToAdd}>
                <SelectTrigger>
                  <SelectValue placeholder="Add a request that matches this date & window..." />
                </SelectTrigger>
                <SelectContent>
                  {assignableRequests.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {REQUEST_TYPE_LABELS[r.type]} — {r.address.slice(0, 50)}
                      {r.address.length > 50 ? "…" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddStop}
              disabled={!stopToAdd || addPending}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add stop
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic pt-2 border-t border-border">
            No unassigned requests match this route&apos;s date &amp; time window.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
