"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import {
  assignCollectorSchema,
  broadcastSchema,
  createRouteSchema,
  createScheduleSchema,
  rejectRequestSchema,
  scheduleRequestSchema,
  type AssignCollectorInput,
  type BroadcastInput,
  type CreateRouteInput,
  type CreateScheduleInput,
  type RejectRequestInput,
  type ScheduleRequestInput,
} from "@/lib/validations/admin";

type ActionResult = { ok: true } | { ok: false; error: string };
type WithIdResult = { ok: true; id: string } | { ok: false; error: string };

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (profile.role !== "admin") {
    return { profile, error: "Admin access required." as const };
  }
  return { profile, error: null };
}

function revalidateAdminRequests() {
  revalidatePath("/admin/requests");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/routes");
}

export async function approveRequestAction(requestId: string): Promise<ActionResult> {
  const { error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const supabase = await createSupabaseServerClient();
  const { data: req, error: fetchError } = await supabase
    .from("pickup_requests")
    .select("id, resident_id, status, type")
    .eq("id", requestId)
    .single();

  if (fetchError || !req) return { ok: false, error: "Request not found." };
  if (req.status !== "pending") {
    return { ok: false, error: "Only pending requests can be approved." };
  }

  const { error } = await supabase
    .from("pickup_requests")
    .update({ status: "approved" })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };

  await supabase.from("notifications").insert({
    user_id: req.resident_id,
    type: "request_update",
    title: "Request approved",
    body: "Your recycling pickup request has been approved and is awaiting scheduling.",
    link_url: "/resident/requests",
  });

  revalidateAdminRequests();
  revalidatePath("/resident/requests");
  revalidatePath("/resident/notifications");
  return { ok: true };
}

export async function rejectRequestAction(
  requestId: string,
  input: RejectRequestInput,
): Promise<ActionResult> {
  const { error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const parsed = rejectRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: req, error: fetchError } = await supabase
    .from("pickup_requests")
    .select("id, resident_id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !req) return { ok: false, error: "Request not found." };
  if (req.status !== "pending") {
    return { ok: false, error: "Only pending requests can be rejected." };
  }

  const { error } = await supabase
    .from("pickup_requests")
    .update({
      status: "rejected",
      rejection_reason: parsed.data.rejectionReason,
    })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };

  await supabase.from("notifications").insert({
    user_id: req.resident_id,
    type: "request_update",
    title: "Request rejected",
    body: `Reason: ${parsed.data.rejectionReason}`,
    link_url: "/resident/requests",
  });

  revalidateAdminRequests();
  revalidatePath("/resident/requests");
  revalidatePath("/resident/notifications");
  return { ok: true };
}

export async function scheduleRequestAction(
  requestId: string,
  input: ScheduleRequestInput,
): Promise<ActionResult> {
  const { error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const parsed = scheduleRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: req, error: fetchError } = await supabase
    .from("pickup_requests")
    .select("id, resident_id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !req) return { ok: false, error: "Request not found." };
  if (req.status !== "approved" && req.status !== "scheduled") {
    return {
      ok: false,
      error: "Only approved or scheduled requests can be (re)scheduled.",
    };
  }

  const { error } = await supabase
    .from("pickup_requests")
    .update({
      status: "scheduled",
      scheduled_date: parsed.data.scheduledDate,
      scheduled_time_window: parsed.data.scheduledTimeWindow,
    })
    .eq("id", requestId);
  if (error) return { ok: false, error: error.message };

  await supabase.from("notifications").insert({
    user_id: req.resident_id,
    type: "schedule_change",
    title: "Pickup scheduled",
    body: `Your pickup is scheduled for ${parsed.data.scheduledDate} (${parsed.data.scheduledTimeWindow}).`,
    link_url: "/resident/requests",
  });

  revalidateAdminRequests();
  revalidatePath("/resident/requests");
  revalidatePath("/resident/notifications");
  return { ok: true };
}

export async function createRouteAction(
  input: CreateRouteInput,
): Promise<WithIdResult> {
  const { error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const parsed = createRouteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  const collectorId =
    parsed.data.collectorId && parsed.data.collectorId.length > 0
      ? parsed.data.collectorId
      : null;

  const { data, error } = await supabase
    .from("routes")
    .insert({
      name: parsed.data.name,
      scheduled_date: parsed.data.scheduledDate,
      collector_id: collectorId,
      notes: parsed.data.notes ?? null,
      status: "planned",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create route." };
  }

  if (collectorId) {
    await supabase.from("notifications").insert({
      user_id: collectorId,
      type: "task_assigned",
      title: "New route assigned",
      body: `You have been assigned to route "${parsed.data.name}" on ${parsed.data.scheduledDate}.`,
      link_url: "/collector/route",
    });
  }

  revalidatePath("/admin/routes");
  revalidatePath("/collector/dashboard");
  revalidatePath("/collector/route");
  return { ok: true, id: data.id };
}

export async function addStopToRouteAction(
  routeId: string,
  requestId: string,
): Promise<ActionResult> {
  const { error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("route_stops")
    .select("id", { count: "exact", head: true })
    .eq("route_id", routeId);

  const { error: stopError } = await supabase.from("route_stops").insert({
    route_id: routeId,
    request_id: requestId,
    stop_order: (count ?? 0) + 1,
    status: "pending",
  });
  if (stopError) return { ok: false, error: stopError.message };

  const { data: req } = await supabase
    .from("pickup_requests")
    .select("status, resident_id")
    .eq("id", requestId)
    .single();

  if (req && req.status === "approved") {
    await supabase
      .from("pickup_requests")
      .update({ status: "scheduled" })
      .eq("id", requestId);
  }

  revalidatePath("/admin/routes");
  revalidatePath("/admin/requests");
  revalidatePath("/collector/route");
  revalidatePath("/collector/tasks");
  return { ok: true };
}

export async function removeStopFromRouteAction(
  stopId: string,
): Promise<ActionResult> {
  const { error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("route_stops").delete().eq("id", stopId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/routes");
  revalidatePath("/collector/route");
  return { ok: true };
}

export async function assignCollectorAction(
  input: AssignCollectorInput,
): Promise<ActionResult> {
  const { error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const parsed = assignCollectorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: route, error: routeError } = await supabase
    .from("routes")
    .select("id, name, scheduled_date")
    .eq("id", parsed.data.routeId)
    .single();

  if (routeError || !route) return { ok: false, error: "Route not found." };

  const { error } = await supabase
    .from("routes")
    .update({ collector_id: parsed.data.collectorId })
    .eq("id", parsed.data.routeId);
  if (error) return { ok: false, error: error.message };

  await supabase.from("notifications").insert({
    user_id: parsed.data.collectorId,
    type: "task_assigned",
    title: "Route assigned to you",
    body: `You have been assigned to route "${route.name}" on ${route.scheduled_date}.`,
    link_url: "/collector/route",
  });

  revalidatePath("/admin/routes");
  revalidatePath("/collector/route");
  revalidatePath("/collector/dashboard");
  revalidatePath("/collector/notifications");
  return { ok: true };
}

export async function broadcastNotificationAction(
  input: BroadcastInput,
): Promise<ActionResult> {
  const { error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const parsed = broadcastSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("profiles").select("id");
  if (parsed.data.targetRole !== "all") {
    query = query.eq("role", parsed.data.targetRole);
  }
  const { data: users, error: usersError } = await query;
  if (usersError) return { ok: false, error: usersError.message };
  if (!users || users.length === 0) {
    return { ok: false, error: "No recipients found for this audience." };
  }

  const rows = users.map((u) => ({
    user_id: u.id,
    type: "broadcast" as const,
    title: parsed.data.title,
    body: parsed.data.body,
  }));

  const { error: insertError } = await supabase.from("notifications").insert(rows);
  if (insertError) return { ok: false, error: insertError.message };

  revalidatePath("/admin/notifications");
  revalidatePath("/resident/notifications");
  revalidatePath("/collector/notifications");
  return { ok: true };
}

export async function createScheduleAction(
  input: CreateScheduleInput,
): Promise<ActionResult> {
  const { error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const parsed = createScheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("schedules").insert({
    area: parsed.data.area,
    day_of_week: parsed.data.dayOfWeek,
    time_window: parsed.data.timeWindow,
    capacity: parsed.data.capacity,
    is_active: true,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/schedule");
  return { ok: true };
}

export async function toggleScheduleAction(
  scheduleId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const { error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("schedules")
    .update({ is_active: isActive })
    .eq("id", scheduleId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/schedule");
  return { ok: true };
}

export async function deleteScheduleAction(
  scheduleId: string,
): Promise<ActionResult> {
  const { error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("schedules").delete().eq("id", scheduleId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/schedule");
  return { ok: true };
}
