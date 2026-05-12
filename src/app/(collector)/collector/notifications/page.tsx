import { NotificationList } from "@/components/shared/notification-list";
import { requireRole } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Notifications" };

export default async function CollectorNotificationsPage() {
  const profile = await requireRole("collector");
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Notifications</h1>
        <p className="text-muted-foreground">
          {unreadCount > 0 ? (
            <>
              You have{" "}
              <span className="font-semibold text-primary">{unreadCount}</span> unread
              notification{unreadCount === 1 ? "" : "s"}.
            </>
          ) : (
            "All caught up! No new notifications."
          )}
        </p>
      </div>

      <NotificationList notifications={notifications} />
    </div>
  );
}
