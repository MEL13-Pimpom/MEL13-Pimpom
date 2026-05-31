import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { classifyWasteImage } from "@/lib/ai/gemini";
import type { AiDecision } from "@/lib/validations/ai";

const BUCKET = "pickup-photos";

type RequestRow = {
  id: string;
  type: string;
  status: string;
  photo_url: string | null;
};

function extractStoragePath(publicUrl: string): string | null {
  // Public URL shape: https://<ref>.supabase.co/storage/v1/object/public/pickup-photos/<userId>/<filename>
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

function inferMimeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "heic":
      return "image/heic";
    case "gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

async function downloadAsBase64(
  storagePath: string,
): Promise<{ base64: string; mimeType: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) {
    throw new Error(`Could not download photo: ${error?.message ?? "unknown"}`);
  }
  const buffer = Buffer.from(await data.arrayBuffer());
  const mimeType = data.type && data.type.length > 0 ? data.type : inferMimeFromPath(storagePath);
  return { base64: buffer.toString("base64"), mimeType };
}

async function loadSettings() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("ai_enabled, ai_model, ai_min_confidence")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    return { ai_enabled: false, ai_model: "gemini-2.5-flash-lite", ai_min_confidence: 0.7 };
  }
  return data;
}

async function markError(requestId: string, reason: string) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("pickup_requests")
    .update({
      ai_decision: "error",
      ai_reason: reason.slice(0, 500),
      ai_classified_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending");
}

export type ClassifyOutcome = {
  ran: boolean;
  decision?: AiDecision;
  autoApproved?: boolean;
  error?: string;
  skippedReason?: "no_photo" | "ai_disabled";
};

/**
 * Run Gemini classification for a pickup request and apply the decision via RPC.
 * Never throws — failures are recorded as ai_decision='error' so request creation is unaffected.
 */
export async function classifyAndApply(
  request: Pick<RequestRow, "id" | "type" | "photo_url">,
): Promise<ClassifyOutcome> {
  try {
    if (!request.photo_url) {
      return { ran: false, skippedReason: "no_photo" };
    }

    const settings = await loadSettings();
    if (!settings.ai_enabled) {
      return { ran: false, skippedReason: "ai_disabled" };
    }

    const path = extractStoragePath(request.photo_url);
    if (!path) {
      await markError(request.id, "Could not resolve storage path from photo URL.");
      return { ran: true, decision: "error", error: "bad_path" };
    }

    const { base64, mimeType } = await downloadAsBase64(path);
    const result = await classifyWasteImage(base64, mimeType, settings.ai_model);

    const match = result.isWaste && result.category === request.type;
    let decision: AiDecision;
    if (!result.isWaste) {
      decision = "needs_review";
    } else if (match && result.confidence >= Number(settings.ai_min_confidence)) {
      decision = "auto_approved";
    } else {
      decision = "needs_review";
    }

    const supabase = await createSupabaseServerClient();
    const { error: rpcError } = await supabase.rpc("apply_ai_classification", {
      p_request_id: request.id,
      p_category: result.category,
      p_is_waste: result.isWaste,
      p_confidence: result.confidence,
      p_match: match,
      p_reason: result.reason,
      p_decision: decision,
    });

    if (rpcError) {
      await markError(request.id, `RPC failed: ${rpcError.message}`);
      return { ran: true, decision: "error", error: rpcError.message };
    }

    return { ran: true, decision, autoApproved: decision === "auto_approved" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    await markError(request.id, message).catch(() => {});
    return { ran: true, decision: "error", error: message };
  }
}
