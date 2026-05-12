"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import {
  changePasswordSchema,
  requestRoleChangeSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type RequestRoleChangeInput,
  type UpdateProfileInput,
} from "@/lib/validations/account";
import type { UserRole } from "@/lib/types/database";

type ActionResult = { ok: true } | { ok: false; error: string };

const ROLE_LABEL: Record<UserRole, string> = {
  resident: "Resident",
  admin: "Admin",
  collector: "Collector",
};

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone && parsed.data.phone.length > 0 ? parsed.data.phone : null,
      address:
        parsed.data.address && parsed.data.address.length > 0
          ? parsed.data.address
          : null,
      avatar_url:
        parsed.data.avatarUrl && parsed.data.avatarUrl.length > 0
          ? parsed.data.avatarUrl
          : null,
    })
    .eq("id", profile.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/account/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { ok: false, error: "You must be signed in." };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    return { ok: false, error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}

export async function requestRoleChangeAction(
  input: RequestRoleChangeInput,
): Promise<ActionResult> {
  const parsed = requestRoleChangeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const profile = await getCurrentProfile();

  if (profile.role === "admin") {
    return { ok: false, error: "Admins do not request role changes." };
  }
  if (parsed.data.requestedRole === profile.role) {
    return { ok: false, error: "You already have this role." };
  }

  const supabase = await createSupabaseServerClient();

  const title = `Role change requested: ${profile.full_name}`;
  const body = `${profile.full_name} (currently ${ROLE_LABEL[profile.role]}) is requesting the ${ROLE_LABEL[parsed.data.requestedRole]} role.\n\nReason: ${parsed.data.reason}`;
  const linkUrl = `/admin/users?focus=${profile.id}`;

  const { data: inserted, error: rpcError } = await supabase.rpc(
    "notify_admins_role_change_request",
    { p_title: title, p_body: body, p_link_url: linkUrl },
  );

  if (rpcError) return { ok: false, error: rpcError.message };
  if (!inserted || inserted === 0) {
    return {
      ok: false,
      error: "No administrators are available to review your request.",
    };
  }

  revalidatePath("/admin/notifications");
  revalidatePath("/admin/users");
  return { ok: true };
}
