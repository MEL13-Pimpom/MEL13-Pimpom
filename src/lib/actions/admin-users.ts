"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { audit } from "@/lib/audit/log";
import {
  adminUpdateUserSchema,
  type AdminUpdateUserInput,
} from "@/lib/validations/admin-users";
import type { Database, UserRole } from "@/lib/types/database";

type ActionResult = { ok: true } | { ok: false; error: string };

const ROLE_LABEL: Record<UserRole, string> = {
  resident: "Resident",
  admin: "Administrator",
  collector: "Collector",
};

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (profile.role !== "admin") {
    return { profile, error: "Admin access required." as const };
  }
  return { profile, error: null };
}

export async function adminUpdateUserAction(
  input: AdminUpdateUserInput,
): Promise<ActionResult> {
  const { profile: admin, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const parsed = adminUpdateUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: target, error: fetchError } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", parsed.data.userId)
    .single();
  if (fetchError || !target) {
    return { ok: false, error: "User not found." };
  }

  if (target.id === admin.id && parsed.data.role !== "admin") {
    return { ok: false, error: "You cannot demote your own admin account." };
  }

  const roleChanged = target.role !== parsed.data.role;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone:
        parsed.data.phone && parsed.data.phone.length > 0
          ? parsed.data.phone
          : null,
      address:
        parsed.data.address && parsed.data.address.length > 0
          ? parsed.data.address
          : null,
      role: parsed.data.role,
    })
    .eq("id", parsed.data.userId);

  if (updateError) return { ok: false, error: updateError.message };

  if (roleChanged && target.id !== admin.id) {
    await supabase.from("notifications").insert({
      user_id: target.id,
      type: "role_change_response",
      title: "Your role has been updated",
      body: `An administrator changed your role from ${ROLE_LABEL[target.role as UserRole]} to ${ROLE_LABEL[parsed.data.role]}.`,
      link_url: "/account/profile",
    });
  }

  if (roleChanged) {
    await audit({
      actor: admin,
      action: "user.role_change",
      targetType: "profile",
      targetId: target.id,
      oldValue: target.role,
      newValue: parsed.data.role,
    });
  } else {
    await audit({
      actor: admin,
      action: "user.update",
      targetType: "profile",
      targetId: target.id,
      newValue: parsed.data.fullName,
    });
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export async function adminDeleteUserAction(
  userId: string,
): Promise<ActionResult> {
  const { profile: admin, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  if (admin.id === userId) {
    return { ok: false, error: "You cannot delete your own account." };
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return {
      ok: false,
      error:
        "Server is missing SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };

  await audit({
    actor: admin,
    action: "user.delete",
    targetType: "profile",
    targetId: userId,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}
