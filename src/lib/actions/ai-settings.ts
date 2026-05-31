"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { audit } from "@/lib/audit/log";
import { classifyAndApply } from "@/lib/ai/classify-request";
import { aiSettingsSchema, type AiSettingsInput } from "@/lib/validations/settings";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateAiSettingsAction(
  input: AiSettingsInput,
): Promise<ActionResult> {
  const parsed = aiSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const profile = await getCurrentProfile();
  if (profile.role !== "admin") {
    return { ok: false, error: "Admin access required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      ai_enabled: parsed.data.aiEnabled,
      ai_model: parsed.data.aiModel,
      ai_min_confidence: parsed.data.aiMinConfidence,
    })
    .eq("id", 1);

  if (error) {
    return { ok: false, error: error.message };
  }

  await audit({
    actor: profile,
    action: "settings.update_ai",
    targetType: "app_settings",
    targetId: "1",
    newValue: `enabled=${parsed.data.aiEnabled}; model=${parsed.data.aiModel}; min=${parsed.data.aiMinConfidence}`,
  });

  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export async function rerunAiClassificationAction(
  requestId: string,
): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (profile.role !== "admin") {
    return { ok: false, error: "Admin access required." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: req, error } = await supabase
    .from("pickup_requests")
    .select("id, type, photo_url, status")
    .eq("id", requestId)
    .single();

  if (error || !req) {
    return { ok: false, error: "Request not found." };
  }
  if (req.status !== "pending") {
    return { ok: false, error: "Only pending requests can be reclassified." };
  }

  const outcome = await classifyAndApply({
    id: req.id,
    type: req.type,
    photo_url: req.photo_url,
  });

  if (!outcome.ran) {
    if (outcome.skippedReason === "ai_disabled") {
      return { ok: false, error: "AI classification is currently disabled. Enable it in the admin dashboard." };
    }
    if (outcome.skippedReason === "no_photo") {
      return { ok: false, error: "This request has no photo to classify." };
    }
    return { ok: false, error: "AI did not run." };
  }

  if (outcome.decision === "error") {
    return { ok: false, error: outcome.error ?? "AI failed." };
  }

  await audit({
    actor: profile,
    action: "request.rerun_ai",
    targetType: "pickup_request",
    targetId: requestId,
    newValue: outcome.decision ?? "skipped",
  });

  revalidatePath("/admin/requests");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}
