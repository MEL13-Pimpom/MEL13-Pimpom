import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export interface AuditEntry {
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  actor?: Pick<Profile, "id" | "full_name"> | null;
}

async function resolveIp(): Promise<string | null> {
  try {
    const h = await headers();
    const xff = h.get("x-forwarded-for");
    if (xff) return xff.split(",")[0]!.trim();
    return h.get("x-real-ip");
  } catch {
    return null;
  }
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    let actorId: string | null = entry.actor?.id ?? null;
    let actorName = entry.actor?.full_name ?? "System";

    if (!entry.actor) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        actorId = user.id;
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();
        if (prof?.full_name) actorName = prof.full_name;
      }
    }

    const ip = await resolveIp();

    await supabase.from("audit_logs").insert({
      actor_id: actorId,
      actor_name: actorName,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      old_value: entry.oldValue ?? null,
      new_value: entry.newValue ?? null,
      ip_address: ip,
    });
  } catch (err) {
    console.error("[audit] failed to log entry", entry.action, err);
  }
}
