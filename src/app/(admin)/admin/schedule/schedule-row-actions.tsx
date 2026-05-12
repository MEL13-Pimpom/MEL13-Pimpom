"use client";

import { useState, useTransition } from "react";
import { Power, Trash2 } from "lucide-react";
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
  deleteScheduleAction,
  toggleScheduleAction,
} from "@/lib/actions/admin";

export function ScheduleRowActions({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [togglePending, startToggle] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const handleToggle = () => {
    startToggle(async () => {
      const result = await toggleScheduleAction(id, !isActive);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isActive ? "Schedule disabled." : "Schedule enabled.");
    });
  };

  const handleDelete = () => {
    startDelete(async () => {
      const result = await deleteScheduleAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Schedule deleted.");
      setDeleteOpen(false);
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleToggle}
        disabled={togglePending}
        title={isActive ? "Disable" : "Enable"}
      >
        <Power className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setDeleteOpen(true)}
        className="text-destructive hover:bg-destructive/10"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the time window. Existing requests are
              unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deletePending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deletePending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
