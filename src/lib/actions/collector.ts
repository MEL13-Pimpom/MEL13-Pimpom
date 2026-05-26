"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { audit } from "@/lib/audit/log";
import type { StopStatus, TablesUpdate } from "@/lib/types/database";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireCollector() {
  const profile = await getCurrentProfile();
  if (profile.role !== "collector") {
    return { profile, error: "Collector access required." as const };
  }
  return { profile, error: null };
}

function revalidateCollectorPaths() {
  revalidatePath("/collector/dashboard");
  revalidatePath("/collector/tasks");
  revalidatePath("/collector/route");
  revalidatePath("/collector/history");
}

export async function updateStopStatusAction(
  stopId: string,
  status: StopStatus,
  notes?: string,
): Promise<ActionResult> {
  const { profile, error: authError } = await requireCollector();
  if (authError) return { ok: false, error: authError };

  const supabase = await createSupabaseServerClient();

  const { data: stop, error: fetchError } = await supabase
    .from("route_stops")
    .select(
      "id, route_id, request_id, route:routes(collector_id), request:pickup_requests(resident_id)",
    )
    .eq("id", stopId)
    .single();

  if (fetchError || !stop) return { ok: false, error: "Stop not found." };

  const route = Array.isArray(stop.route) ? stop.route[0] : stop.route;
  const request = Array.isArray(stop.request) ? stop.request[0] : stop.request;

  if (route?.collector_id !== profile.id) {
    return { ok: false, error: "You can only update your own stops." };
  }

  const now = new Date().toISOString();
  const update: TablesUpdate<"route_stops"> = { status };
  if (status === "arrived") update.arrived_at = now;
  if (status === "completed") {
    update.completed_at = now;
    if (!update.arrived_at) update.arrived_at = now;
  }
  if (notes && notes.trim().length > 0) update.notes = notes;

  const { error: stopError } = await supabase
    .from("route_stops")
    .update(update)
    .eq("id", stopId);
  if (stopError) return { ok: false, error: stopError.message };

  if (status === "completed" && stop.request_id) {
    await supabase
      .from("pickup_requests")
      .update({ status: "completed" })
      .eq("id", stop.request_id);
    if (request?.resident_id) {
      await supabase.from("notifications").insert({
        user_id: request.resident_id,
        type: "request_update",
        title: "Pickup completed",
        body: "Your recycling pickup has been collected — thank you for recycling!",
        link_url: "/resident/requests",
      });
    }
  } else if ((status === "missed" || status === "skipped") && stop.request_id) {
    // Return the request to "approved" + clear the assigned schedule so the
    // resident can pick a new date/window from /resident/requests.
    await supabase
      .from("pickup_requests")
      .update({
        status: "approved",
        scheduled_date: null,
        scheduled_time_window: null,
      })
      .eq("id", stop.request_id);

    const reason =
      status === "missed"
        ? "The collector wasn't able to complete this pickup."
        : "The collector skipped this stop.";

    if (request?.resident_id) {
      await supabase.from("notifications").insert({
        user_id: request.resident_id,
        type: "schedule_change",
        title: "Pickup needs rescheduling",
        body: `${reason} You can pick a new date and time on your requests page.`,
        link_url: "/resident/requests",
      });
    }

    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin");
    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map((a) => ({
          user_id: a.id,
          type: "system" as const,
          title: status === "missed" ? "Stop missed" : "Stop skipped",
          body: `Collector ${profile.full_name} marked a stop as ${status}. The request is back in the approved queue.`,
          link_url: "/admin/routes",
        })),
      );
    }
  } else if (status === "en_route" && stop.request_id) {
    await supabase
      .from("pickup_requests")
      .update({ status: "in_progress" })
      .eq("id", stop.request_id);
  }

  revalidateCollectorPaths();
  revalidatePath("/resident/requests");
  revalidatePath("/resident/notifications");
  revalidatePath("/admin/requests");
  return { ok: true };
}

export async function startRouteAction(routeId: string): Promise<ActionResult> {
  const { profile, error: authError } = await requireCollector();
  if (authError) return { ok: false, error: authError };

  const supabase = await createSupabaseServerClient();

  const { data: route, error: fetchError } = await supabase
    .from("routes")
    .select("id, collector_id, status")
    .eq("id", routeId)
    .single();
  if (fetchError || !route) return { ok: false, error: "Route not found." };
  if (route.collector_id !== profile.id) {
    return { ok: false, error: "You can only start your own routes." };
  }
  if (route.status !== "planned") {
    return { ok: false, error: "Only planned routes can be started." };
  }

  const { error } = await supabase
    .from("routes")
    .update({ status: "in_progress" })
    .eq("id", routeId);
  if (error) return { ok: false, error: error.message };

  revalidateCollectorPaths();
  return { ok: true };
}

export async function claimRouteAction(routeId: string): Promise<ActionResult> {
  const { profile, error: authError } = await requireCollector();
  if (authError) return { ok: false, error: authError };

  const supabase = await createSupabaseServerClient();

  const { data: route, error: fetchError } = await supabase
    .from("routes")
    .select("id, name, scheduled_date, time_window, status, collector_id")
    .eq("id", routeId)
    .single();
  if (fetchError || !route) return { ok: false, error: "Route not found." };
  if (route.collector_id) {
    return { ok: false, error: "This route already has a collector." };
  }
  if (route.status !== "planned") {
    return { ok: false, error: "Only planned routes can be claimed." };
  }

  const { error } = await supabase
    .from("routes")
    .update({ collector_id: profile.id })
    .eq("id", routeId)
    .is("collector_id", null);
  if (error) return { ok: false, error: error.message };

  // Notify all admins
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");
  if (admins && admins.length > 0) {
    await supabase.from("notifications").insert(
      admins.map((a) => ({
        user_id: a.id,
        type: "system" as const,
        title: "Route claimed by collector",
        body: `${profile.full_name} claimed route "${route.name}" on ${route.scheduled_date} (${route.time_window}).`,
        link_url: "/admin/routes",
      })),
    );
  }

  await audit({
    actor: profile,
    action: "route.claim",
    targetType: "route",
    targetId: routeId,
    oldValue: "unassigned",
    newValue: profile.id,
  });

  revalidateCollectorPaths();
  revalidatePath("/admin/routes");
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function completeRouteAction(routeId: string): Promise<ActionResult> {
  const { profile, error: authError } = await requireCollector();
  if (authError) return { ok: false, error: authError };

  const supabase = await createSupabaseServerClient();

  const { data: route, error: fetchError } = await supabase
    .from("routes")
    .select("id, collector_id, status")
    .eq("id", routeId)
    .single();
  if (fetchError || !route) return { ok: false, error: "Route not found." };
  if (route.collector_id !== profile.id) {
    return { ok: false, error: "You can only complete your own routes." };
  }

  const { data: pendingStops } = await supabase
    .from("route_stops")
    .select("id")
    .eq("route_id", routeId)
    .in("status", ["pending", "en_route", "arrived"]);
  if ((pendingStops ?? []).length > 0) {
    return {
      ok: false,
      error: "Mark every stop as completed, missed, or skipped first.",
    };
  }

  const { error } = await supabase
    .from("routes")
    .update({ status: "completed" })
    .eq("id", routeId);
  if (error) return { ok: false, error: error.message };

  revalidateCollectorPaths();
  return { ok: true };
}
