"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function markNotificationReadAction(
  notificationId: string,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", profile.id)
    .is("read_at", null);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/resident/notifications");
  revalidatePath("/admin/notifications");
  revalidatePath("/collector/notifications");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/resident/notifications");
  revalidatePath("/admin/notifications");
  revalidatePath("/collector/notifications");
  return { ok: true };
}
