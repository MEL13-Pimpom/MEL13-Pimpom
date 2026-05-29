"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin, Plus, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  deleteRouteAction,
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

const ACTIVE_STOP_STATUSES: StopStatus[] = [
  "en_route",
  "arrived",
  "completed",
  "missed",
  "skipped",
];

export function RouteCard({ route, collectors, assignableRequests }: Props) {
  const router = useRouter();
  const [stopToAdd, setStopToAdd] = useState<string>("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addPending, startAdd] = useTransition();
  const [removePending, startRemove] = useTransition();
  const [assignPending, startAssign] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const hasActiveStops = route.stops.some((s) =>
    ACTIVE_STOP_STATUSES.includes(s.status),
  );
  const canDeleteRoute = !hasActiveStops;

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

  const stopCount = route.stops.length;
  const deleteDescription =
    stopCount > 0
      ? `${stopCount} pending stop${
          stopCount === 1 ? "" : "s"
        } will be released back to the approved queue. This action cannot be undone.`
      : "This action cannot be undone.";

  const handleConfirmDelete = () => {
    startDelete(async () => {
      const result = await deleteRouteAction(route.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Route deleted.");
      setDeleteOpen(false);
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
          <div className="w-full md:w-auto flex flex-col gap-1 md:items-end">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="flex-1 md:flex-none md:w-52">
                <Select
                  value={route.collector?.id ?? UNASSIGNED}
                  onValueChange={handleAssignCollector}
                  disabled={assignPending || hasActiveStops}
                >
                  <SelectTrigger
                    title={
                      hasActiveStops
                        ? "Locked — collector has already started working stops."
                        : undefined
                    }
                  >
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                disabled={deletePending || !canDeleteRoute}
                title={
                  !canDeleteRoute
                    ? "Cannot delete — route already has stops in progress."
                    : undefined
                }
                className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {deletePending ? "Deleting..." : "Delete"}
              </Button>
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete route &ldquo;{route.name}&rdquo;?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {deleteDescription}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deletePending}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleConfirmDelete();
                      }}
                      disabled={deletePending}
                      variant="destructive"
                    >
                      {deletePending ? "Deleting..." : "Delete route"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {hasActiveStops && (
              <p className="text-xs text-muted-foreground italic">
                Collector locked — route is already in progress.
              </p>
            )}
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
                {stop.status === "pending" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveStop(stop.id)}
                    disabled={removePending}
                    className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                    title="Remove stop from route"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                ) : (
                  <div
                    className="w-9 flex-shrink-0"
                    title="Locked — collector already started this stop."
                  />
                )}
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
