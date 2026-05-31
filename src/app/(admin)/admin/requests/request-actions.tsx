"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import {
  CalendarClock,
  CheckCircle,
  Eye,
  MapPin,
  Package,
  RefreshCcw,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RequestStatusBadge } from "@/components/shared/status-badge";
import { AiDecisionBadge } from "@/components/shared/ai-decision-badge";
import {
  approveRequestAction,
  rejectRequestAction,
  scheduleRequestAction,
} from "@/lib/actions/admin";
import { rerunAiClassificationAction } from "@/lib/actions/ai-settings";
import {
  rejectRequestSchema,
  scheduleRequestSchema,
  type RejectRequestInput,
  type ScheduleRequestInput,
} from "@/lib/validations/admin";
import {
  REQUEST_TYPE_LABELS,
  TIME_WINDOWS,
  TIME_WINDOW_LABELS,
} from "@/lib/validations/request";
import type { RequestStatus, RequestType } from "@/lib/types/database";

interface RequestDetails {
  id: string;
  status: RequestStatus;
  residentName: string;
  type: RequestType;
  address: string;
  preferredDate: string;
  preferredTimeWindow: string;
  scheduledDate: string | null;
  scheduledTimeWindow: string | null;
  notes: string | null;
  rejectionReason: string | null;
  photoUrl: string | null;
  weightKgEstimate: number | null;
  aiCategory: string | null;
  aiIsWaste: boolean | null;
  aiConfidence: number | null;
  aiMatch: boolean | null;
  aiReason: string | null;
  aiDecision: string | null;
}

export function RequestActions({ request }: { request: RequestDetails }) {
  const [viewOpen, setViewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();
  const [schedulePending, startSchedule] = useTransition();
  const [rerunPending, startRerun] = useTransition();

  const canRerun =
    request.status === "pending" &&
    (request.aiDecision === "error" || request.aiDecision === "skipped" || request.aiDecision === null);

  const handleRerun = () => {
    startRerun(async () => {
      const result = await rerunAiClassificationAction(request.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("AI re-ran on this request.");
    });
  };

  const rejectForm = useForm<RejectRequestInput>({
    resolver: zodResolver(rejectRequestSchema),
    defaultValues: { rejectionReason: "" },
  });

  const scheduleForm = useForm<ScheduleRequestInput>({
    resolver: zodResolver(scheduleRequestSchema),
    defaultValues: {
      scheduledDate: request.scheduledDate ?? request.preferredDate,
      scheduledTimeWindow:
        (request.scheduledTimeWindow as ScheduleRequestInput["scheduledTimeWindow"]) ??
        (request.preferredTimeWindow as ScheduleRequestInput["scheduledTimeWindow"]) ??
        "morning",
    },
  });

  const handleApprove = () => {
    startApprove(async () => {
      const result = await approveRequestAction(request.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Request approved.");
    });
  };

  const handleReject = (values: RejectRequestInput) => {
    startReject(async () => {
      const result = await rejectRequestAction(request.id, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Request rejected.");
      setRejectOpen(false);
      rejectForm.reset();
    });
  };

  const handleSchedule = (values: ScheduleRequestInput) => {
    startSchedule(async () => {
      const result = await scheduleRequestAction(request.id, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Request scheduled.");
      setScheduleOpen(false);
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setViewOpen(true)}
        title="View details"
      >
        <Eye className="w-4 h-4" />
      </Button>

      {request.status === "pending" && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleApprove}
            disabled={approvePending}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            title="Approve"
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRejectOpen(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Reject"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        </>
      )}

      {canRerun && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRerun}
          disabled={rerunPending}
          className="text-primary hover:text-primary/80 hover:bg-accent"
          title="Re-run AI classification"
        >
          <RefreshCcw className={`w-4 h-4 ${rerunPending ? "animate-spin" : ""}`} />
        </Button>
      )}

      {(request.status === "approved" || request.status === "scheduled") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setScheduleOpen(true)}
          className="text-primary hover:text-primary/80 hover:bg-accent"
          title={request.status === "scheduled" ? "Reschedule" : "Schedule"}
        >
          <CalendarClock className="w-4 h-4" />
        </Button>
      )}

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Request details
              <RequestStatusBadge status={request.status} />
            </DialogTitle>
            <DialogDescription>
              Submitted by {request.residentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <DetailField icon={User} label="Resident" value={request.residentName} />
              <DetailField
                icon={Package}
                label="Waste type"
                value={REQUEST_TYPE_LABELS[request.type]}
              />
              <DetailField
                icon={CalendarClock}
                label="Preferred"
                value={`${format(parseISO(request.preferredDate), "MMM d, yyyy")} • ${request.preferredTimeWindow}`}
              />
              {request.scheduledDate && (
                <DetailField
                  icon={CalendarClock}
                  label="Scheduled"
                  value={`${format(parseISO(request.scheduledDate), "MMM d, yyyy")}${request.scheduledTimeWindow ? ` • ${request.scheduledTimeWindow}` : ""}`}
                />
              )}
              {request.weightKgEstimate != null && (
                <DetailField
                  icon={Package}
                  label="Weight estimate"
                  value={`${request.weightKgEstimate} kg`}
                />
              )}
            </div>
            <DetailField icon={MapPin} label="Address" value={request.address} />
            {request.notes && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Notes from resident
                </p>
                <p className="text-sm italic text-foreground">&ldquo;{request.notes}&rdquo;</p>
              </div>
            )}
            {request.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                <span className="font-medium">Rejection reason: </span>
                {request.rejectionReason}
              </div>
            )}
            {request.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={request.photoUrl}
                alt="Pickup"
                className="rounded-lg border border-border max-h-72 object-cover"
              />
            )}

            {request.aiDecision && (
              <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="size-4 text-primary" />
                    AI classification
                  </div>
                  <AiDecisionBadge decision={request.aiDecision} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      AI detected
                    </p>
                    <p className="text-foreground">
                      {request.aiCategory ?? "—"}
                      {request.aiConfidence != null
                        ? ` (${Math.round(request.aiConfidence * 100)}%)`
                        : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      Resident declared
                    </p>
                    <p className="text-foreground">{REQUEST_TYPE_LABELS[request.type]}</p>
                  </div>
                </div>
                {request.aiReason && (
                  <p className="text-xs text-muted-foreground italic">
                    &ldquo;{request.aiReason}&rdquo;
                  </p>
                )}
                {canRerun && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRerun}
                    disabled={rerunPending}
                  >
                    <RefreshCcw
                      className={`w-4 h-4 mr-2 ${rerunPending ? "animate-spin" : ""}`}
                    />
                    Re-run AI
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject request</DialogTitle>
            <DialogDescription>
              Provide a reason — the resident will see this in their notifications.
            </DialogDescription>
          </DialogHeader>
          <Form {...rejectForm}>
            <form
              onSubmit={rejectForm.handleSubmit(handleReject)}
              className="space-y-4"
            >
              <FormField
                control={rejectForm.control}
                name="rejectionReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="e.g. Address not in service area."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectOpen(false)}
                  disabled={rejectPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-destructive text-white hover:bg-destructive/90"
                  disabled={rejectPending}
                >
                  {rejectPending ? "Rejecting..." : "Reject request"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {request.status === "scheduled" ? "Reschedule pickup" : "Schedule pickup"}
            </DialogTitle>
            <DialogDescription>
              Confirm the date and time window — resident will be notified.
            </DialogDescription>
          </DialogHeader>
          <Form {...scheduleForm}>
            <form
              onSubmit={scheduleForm.handleSubmit(handleSchedule)}
              className="space-y-4"
            >
              <FormField
                control={scheduleForm.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={scheduleForm.control}
                name="scheduledTimeWindow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time window</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a window" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIME_WINDOWS.map((w) => (
                          <SelectItem key={w} value={w}>
                            {TIME_WINDOW_LABELS[w]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setScheduleOpen(false)}
                  disabled={schedulePending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={schedulePending}>
                  {schedulePending ? "Saving..." : "Save schedule"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <div className="flex items-start gap-2 text-foreground">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
        <span>{value}</span>
      </div>
    </div>
  );
}
