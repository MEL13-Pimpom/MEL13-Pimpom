"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { audit } from "@/lib/audit/log";
import {
  assignCollectorSchema,
  broadcastSchema,
  createRouteSchema,
  rejectRequestSchema,
  scheduleRequestSchema,
  type AssignCollectorInput,
  type BroadcastInput,
  type CreateRouteInput,
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
  revalidatePath("/admin/reports");
}

export async function approveRequestAction(requestId: string): Promise<ActionResult> {
  const { profile: admin, error: authError } = await requireAdmin();
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

  await audit({
    actor: admin,
    action: "request.approve",
    targetType: "pickup_request",
    targetId: requestId,
    oldValue: "pending",
    newValue: "approved",
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
  const { profile: admin, error: authError } = await requireAdmin();
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

  await audit({
    actor: admin,
    action: "request.reject",
    targetType: "pickup_request",
    targetId: requestId,
    oldValue: "pending",
    newValue: `rejected: ${parsed.data.rejectionReason.slice(0, 200)}`,
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
  const { profile: admin, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const parsed = scheduleRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: req, error: fetchError } = await supabase
    .from("pickup_requests")
    .select("id, resident_id, status, scheduled_date, scheduled_time_window")
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

  await audit({
    actor: admin,
    action: "request.schedule",
    targetType: "pickup_request",
    targetId: requestId,
    oldValue: req.scheduled_date
      ? `${req.scheduled_date} ${req.scheduled_time_window ?? ""}`
      : req.status,
    newValue: `${parsed.data.scheduledDate} ${parsed.data.scheduledTimeWindow}`,
  });

  revalidateAdminRequests();
  revalidatePath("/resident/requests");
  revalidatePath("/resident/notifications");
  return { ok: true };
}

export async function createRouteAction(
  input: CreateRouteInput,
): Promise<WithIdResult> {
  const { profile: admin, error: authError } = await requireAdmin();
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
      time_window: parsed.data.timeWindow,
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
      body: `You have been assigned to route "${parsed.data.name}" on ${parsed.data.scheduledDate} (${parsed.data.timeWindow}).`,
      link_url: "/collector/route",
    });
  }

  await audit({
    actor: admin,
    action: "route.create",
    targetType: "route",
    targetId: data.id,
    newValue: `${parsed.data.name} • ${parsed.data.scheduledDate} • ${parsed.data.timeWindow}${
      collectorId ? ` • collector:${collectorId}` : ""
    }`,
  });

  revalidatePath("/admin/routes");
  revalidatePath("/admin/reports");
  revalidatePath("/collector/dashboard");
  revalidatePath("/collector/tasks");
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

  const { data: route, error: routeError } = await supabase
    .from("routes")
    .select("id, scheduled_date, time_window, status")
    .eq("id", routeId)
    .single();
  if (routeError || !route) return { ok: false, error: "Route not found." };

  const { data: req, error: reqError } = await supabase
    .from("pickup_requests")
    .select(
      "id, resident_id, status, preferred_date, preferred_time_window, scheduled_date, scheduled_time_window",
    )
    .eq("id", requestId)
    .single();
  if (reqError || !req) return { ok: false, error: "Request not found." };

  const reqDate = req.scheduled_date ?? req.preferred_date;
  const reqWindow = req.scheduled_time_window ?? req.preferred_time_window;

  if (reqDate !== route.scheduled_date) {
    return {
      ok: false,
      error: `Date mismatch — request is for ${reqDate} but route is on ${route.scheduled_date}.`,
    };
  }
  if (reqWindow !== route.time_window) {
    return {
      ok: false,
      error: `Time-window mismatch — request prefers "${reqWindow}" but route is "${route.time_window}".`,
    };
  }

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

  if (req.status === "approved") {
    await supabase
      .from("pickup_requests")
      .update({
        status: "scheduled",
        scheduled_date: route.scheduled_date,
        scheduled_time_window: route.time_window,
      })
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

  const { data: stop, error: fetchError } = await supabase
    .from("route_stops")
    .select("id, status, request_id")
    .eq("id", stopId)
    .single();
  if (fetchError || !stop) return { ok: false, error: "Stop not found." };

  if (stop.status !== "pending") {
    return {
      ok: false,
      error:
        "Only pending stops can be removed — the collector has already started this one.",
    };
  }

  const { error } = await supabase.from("route_stops").delete().eq("id", stopId);
  if (error) return { ok: false, error: error.message };

  // Return the request to the approved queue so admins can re-route it.
  // Keep scheduled_date/window so re-adding to a route with the same slot
  // is friction-free (per product spec).
  if (stop.request_id) {
    await supabase
      .from("pickup_requests")
      .update({ status: "approved" })
      .eq("id", stop.request_id)
      .eq("status", "scheduled");
  }

  revalidatePath("/admin/routes");
  revalidatePath("/admin/requests");
  revalidatePath("/collector/route");
  revalidatePath("/collector/tasks");
  revalidatePath("/resident/requests");
  return { ok: true };
}

const ACTIVE_STOP_STATUSES = [
  "en_route",
  "arrived",
  "completed",
  "missed",
  "skipped",
] as const;

export async function deleteRouteAction(
  routeId: string,
): Promise<ActionResult> {
  const { profile: admin, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const supabase = await createSupabaseServerClient();

  const { data: route, error: routeError } = await supabase
    .from("routes")
    .select("id, name, scheduled_date, time_window, collector_id")
    .eq("id", routeId)
    .single();
  if (routeError || !route) return { ok: false, error: "Route not found." };

  const { data: stops, error: stopsError } = await supabase
    .from("route_stops")
    .select("id, status, request_id")
    .eq("route_id", routeId);
  if (stopsError) return { ok: false, error: stopsError.message };

  const nonPending = (stops ?? []).filter((s) => s.status !== "pending");
  if (nonPending.length > 0) {
    return {
      ok: false,
      error:
        "Cannot delete — some stops are already in progress or finished. Remove only routes where every stop is still pending.",
    };
  }

  const requestIds = (stops ?? [])
    .map((s) => s.request_id)
    .filter((id): id is string => Boolean(id));

  // Revert the linked pickup_requests first (keeps scheduled_date/window),
  // then drop stops + route. RLS already enforces is_admin on writes.
  if (requestIds.length > 0) {
    await supabase
      .from("pickup_requests")
      .update({ status: "approved" })
      .in("id", requestIds)
      .eq("status", "scheduled");
  }

  if ((stops ?? []).length > 0) {
    const { error: deleteStopsError } = await supabase
      .from("route_stops")
      .delete()
      .eq("route_id", routeId);
    if (deleteStopsError) return { ok: false, error: deleteStopsError.message };
  }

  const { error: deleteRouteError } = await supabase
    .from("routes")
    .delete()
    .eq("id", routeId);
  if (deleteRouteError) return { ok: false, error: deleteRouteError.message };

  if (route.collector_id) {
    await supabase.from("notifications").insert({
      user_id: route.collector_id,
      type: "system",
      title: "Route removed",
      body: `Route "${route.name}" on ${route.scheduled_date} (${route.time_window}) was removed by an admin.`,
      link_url: "/collector/tasks",
    });
  }

  await audit({
    actor: admin,
    action: "route.delete",
    targetType: "route",
    targetId: routeId,
    oldValue: `${route.name} • ${route.scheduled_date} • ${route.time_window}`,
  });

  revalidatePath("/admin/routes");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/reports");
  revalidatePath("/collector/route");
  revalidatePath("/collector/tasks");
  revalidatePath("/collector/notifications");
  revalidatePath("/resident/requests");
  return { ok: true };
}

export async function assignCollectorAction(
  input: AssignCollectorInput,
): Promise<ActionResult> {
  const { profile: admin, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const parsed = assignCollectorSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: route, error: routeError } = await supabase
    .from("routes")
    .select("id, name, scheduled_date, time_window, collector_id")
    .eq("id", parsed.data.routeId)
    .single();

  if (routeError || !route) return { ok: false, error: "Route not found." };

  // Lock collector reassignment once a collector has started touching stops.
  const { data: lockedStops } = await supabase
    .from("route_stops")
    .select("id")
    .eq("route_id", parsed.data.routeId)
    .in("status", [...ACTIVE_STOP_STATUSES]);
  if ((lockedStops ?? []).length > 0) {
    return {
      ok: false,
      error:
        "Cannot change collector — at least one stop is already en-route, arrived, completed, missed, or skipped.",
    };
  }

  const { error } = await supabase
    .from("routes")
    .update({ collector_id: parsed.data.collectorId })
    .eq("id", parsed.data.routeId);
  if (error) return { ok: false, error: error.message };

  await supabase.from("notifications").insert({
    user_id: parsed.data.collectorId,
    type: "task_assigned",
    title: "Route assigned to you",
    body: `You have been assigned to route "${route.name}" on ${route.scheduled_date} (${route.time_window}).`,
    link_url: "/collector/route",
  });

  await audit({
    actor: admin,
    action: "route.assign_collector",
    targetType: "route",
    targetId: parsed.data.routeId,
    oldValue: route.collector_id ?? "unassigned",
    newValue: parsed.data.collectorId,
  });

  revalidatePath("/admin/routes");
  revalidatePath("/collector/route");
  revalidatePath("/collector/tasks");
  revalidatePath("/collector/dashboard");
  revalidatePath("/collector/notifications");
  return { ok: true };
}

export async function broadcastNotificationAction(
  input: BroadcastInput,
): Promise<ActionResult> {
  const { profile: admin, error: authError } = await requireAdmin();
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

  await audit({
    actor: admin,
    action: "broadcast.send",
    targetType: "broadcast",
    targetId: parsed.data.targetRole,
    newValue: parsed.data.title,
  });

  revalidatePath("/admin/notifications");
  revalidatePath("/resident/notifications");
  revalidatePath("/collector/notifications");
  return { ok: true };
}
