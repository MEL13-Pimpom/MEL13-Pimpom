"use client";

import { useTransition } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  Info,
  Megaphone,
  Route,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import type { Notification, NotificationType } from "@/lib/types/database";

interface Props {
  notifications: Notification[];
}

const ICON_BY_TYPE: Record<NotificationType, typeof Bell> = {
  request_update: CheckCircle,
  task_assigned: Route,
  schedule_change: Clock,
  broadcast: Megaphone,
  system: Info,
  role_change_request: UserCog,
  role_change_response: ShieldCheck,
};

const TONE_BY_TYPE: Record<NotificationType, { bg: string; fg: string }> = {
  request_update: { bg: "bg-green-100", fg: "text-green-600" },
  task_assigned: { bg: "bg-blue-100", fg: "text-blue-600" },
  schedule_change: { bg: "bg-yellow-100", fg: "text-yellow-600" },
  broadcast: { bg: "bg-purple-100", fg: "text-purple-600" },
  system: { bg: "bg-gray-100", fg: "text-gray-600" },
  role_change_request: { bg: "bg-amber-100", fg: "text-amber-700" },
  role_change_response: { bg: "bg-primary/10", fg: "text-primary" },
};

export function NotificationList({ notifications }: Props) {
  const [markPending, startMarkTransition] = useTransition();
  const [markAllPending, startMarkAllTransition] = useTransition();

  const unread = notifications.filter((n) => !n.read_at);
  const read = notifications.filter((n) => n.read_at);

  const handleMark = (id: string) => {
    startMarkTransition(async () => {
      const result = await markNotificationReadAction(id);
      if (!result.ok) toast.error(result.error);
    });
  };

  const handleMarkAll = () => {
    startMarkAllTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("All notifications marked as read.");
    });
  };

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No notifications
          </h3>
          <p className="text-muted-foreground">
            You&apos;re all caught up — new updates will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {unread.length > 0 && (
        <Card>
          <CardHeader className="bg-accent flex flex-row items-center justify-between border-b border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-primary" />
              New ({unread.length})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAll}
              disabled={markAllPending}
            >
              {markAllPending ? "Marking..." : "Mark all as read"}
            </Button>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {unread.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onMark={handleMark}
                disabled={markPending}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {read.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg">Earlier</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border">
            {read.map((n) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onMark,
  disabled,
}: {
  notification: Notification;
  onMark?: (id: string) => void;
  disabled?: boolean;
}) {
  const Icon = ICON_BY_TYPE[notification.type] ?? Bell;
  const tone = TONE_BY_TYPE[notification.type] ?? TONE_BY_TYPE.system;
  const isUnread = !notification.read_at;

  return (
    <div className="p-5 hover:bg-accent transition-colors">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
            tone.bg,
          )}
        >
          <Icon className={cn("w-6 h-6", tone.fg)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-semibold text-foreground">{notification.title}</h3>
            {isUnread && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary text-primary-foreground flex-shrink-0">
                New
              </span>
            )}
          </div>
          {notification.body && (
            <p className="text-sm text-muted-foreground mb-2">{notification.body}</p>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(parseISO(notification.created_at), {
                addSuffix: true,
              })}
            </p>
            {isUnread && onMark && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMark(notification.id)}
                disabled={disabled}
                className="h-7 text-xs"
              >
                Mark as read
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
