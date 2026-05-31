"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { audit } from "@/lib/audit/log";
import { classifyAndApply } from "@/lib/ai/classify-request";
import {
  createRequestSchema,
  rescheduleRequestSchema,
  type CreateRequestInput,
  type RescheduleRequestInput,
} from "@/lib/validations/request";

type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function createRequestAction(
  input: CreateRequestInput,
): Promise<ActionResult> {
  const parsed = createRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const profile = await getCurrentProfile();
  if (profile.role !== "resident") {
    return { ok: false, error: "Only residents can submit requests." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pickup_requests")
    .insert({
      resident_id: profile.id,
      type: parsed.data.type,
      address: parsed.data.address,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      geocoding_source: parsed.data.geocodingSource,
      weight_kg_estimate: parsed.data.weightKgEstimate ?? null,
      preferred_date: parsed.data.preferredDate,
      preferred_time_window: parsed.data.preferredTimeWindow,
      notes: parsed.data.notes ?? null,
      photo_url: parsed.data.photoUrl && parsed.data.photoUrl.length > 0
        ? parsed.data.photoUrl
        : null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create request." };
  }

  await audit({
    actor: profile,
    action: "request.create",
    targetType: "pickup_request",
    targetId: data.id,
    newValue: `${parsed.data.type} • ${parsed.data.preferredDate} ${parsed.data.preferredTimeWindow}`,
  });

  await classifyAndApply({
    id: data.id,
    type: parsed.data.type,
    photo_url: parsed.data.photoUrl && parsed.data.photoUrl.length > 0 ? parsed.data.photoUrl : null,
  });

  revalidatePath("/resident/requests");
  revalidatePath("/resident/dashboard");
  revalidatePath("/admin/requests");
  return { ok: true, id: data.id };
}

export async function cancelRequestAction(requestId: string): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("pickup_requests")
    .select("id, resident_id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: "Request not found." };
  }
  if (existing.resident_id !== profile.id) {
    return { ok: false, error: "You can only cancel your own requests." };
  }
  if (!["pending", "approved"].includes(existing.status)) {
    return { ok: false, error: "Only pending or approved requests can be cancelled." };
  }

  const { error } = await supabase
    .from("pickup_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await audit({
    actor: profile,
    action: "request.cancel",
    targetType: "pickup_request",
    targetId: requestId,
    oldValue: existing.status,
    newValue: "cancelled",
  });

  revalidatePath("/resident/requests");
  revalidatePath("/resident/dashboard");
  return { ok: true };
}

export async function rescheduleRequestAction(
  requestId: string,
  input: RescheduleRequestInput,
): Promise<ActionResult> {
  const parsed = rescheduleRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const profile = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("pickup_requests")
    .select("id, resident_id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: "Request not found." };
  }
  if (existing.resident_id !== profile.id) {
    return { ok: false, error: "You can only reschedule your own requests." };
  }
  if (!["pending", "approved"].includes(existing.status)) {
    return { ok: false, error: "Only pending or approved requests can be rescheduled." };
  }

  const { error } = await supabase
    .from("pickup_requests")
    .update({
      preferred_date: parsed.data.preferredDate,
      preferred_time_window: parsed.data.preferredTimeWindow,
    })
    .eq("id", requestId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await audit({
    actor: profile,
    action: "request.reschedule",
    targetType: "pickup_request",
    targetId: requestId,
    newValue: `${parsed.data.preferredDate} ${parsed.data.preferredTimeWindow}`,
  });

  revalidatePath("/resident/requests");
  revalidatePath("/resident/dashboard");
  return { ok: true };
}
