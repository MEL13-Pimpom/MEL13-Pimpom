"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import {
  cancelRequestAction,
  rescheduleRequestAction,
} from "@/lib/actions/requests";
import {
  rescheduleRequestSchema,
  TIME_WINDOWS,
  TIME_WINDOW_LABELS,
  type RescheduleRequestInput,
} from "@/lib/validations/request";

interface Props {
  requestId: string;
  currentDate: string;
  currentTimeWindow: string;
}

export function RequestRowActions({ requestId, currentDate, currentTimeWindow }: Props) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelPending, startCancelTransition] = useTransition();
  const [reschedulePending, startRescheduleTransition] = useTransition();

  const initialTimeWindow = (TIME_WINDOWS as readonly string[]).includes(
    currentTimeWindow,
  )
    ? (currentTimeWindow as RescheduleRequestInput["preferredTimeWindow"])
    : "morning";

  const form = useForm<RescheduleRequestInput>({
    resolver: zodResolver(rescheduleRequestSchema),
    defaultValues: {
      preferredDate: currentDate,
      preferredTimeWindow: initialTimeWindow,
    },
  });

  const handleCancel = () => {
    startCancelTransition(async () => {
      const result = await cancelRequestAction(requestId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Request cancelled.");
      setCancelOpen(false);
    });
  };

  const handleReschedule = (values: RescheduleRequestInput) => {
    startRescheduleTransition(async () => {
      const result = await rescheduleRequestAction(requestId, values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Request rescheduled.");
      setRescheduleOpen(false);
    });
  };

  return (
    <>
      <div className="flex gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRescheduleOpen(true)}
          className="h-10"
        >
          <CalendarClock className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Reschedule</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCancelOpen(true)}
          className="h-10 text-destructive hover:bg-destructive/10"
        >
          <XCircle className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Cancel</span>
        </Button>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the request as cancelled. You can always submit a new
              one later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelPending}>Keep request</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={cancelPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {cancelPending ? "Cancelling..." : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule pickup</DialogTitle>
            <DialogDescription>
              Pick a new preferred date and time window.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleReschedule)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="preferredDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred date</FormLabel>
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
                control={form.control}
                name="preferredTimeWindow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred time</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a window" />
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
                  onClick={() => setRescheduleOpen(false)}
                  disabled={reschedulePending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={reschedulePending}>
                  {reschedulePending ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
