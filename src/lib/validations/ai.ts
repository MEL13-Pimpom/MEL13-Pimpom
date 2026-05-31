import { z } from "zod";

export const AI_CATEGORIES = [
  "paper",
  "plastic",
  "metal",
  "glass",
  "electronic",
  "mixed",
  "notwaste",
] as const;

export type AiCategory = (typeof AI_CATEGORIES)[number];

export const AI_CATEGORY_LABELS: Record<AiCategory, string> = {
  paper: "Paper",
  plastic: "Plastic",
  metal: "Metal",
  glass: "Glass",
  electronic: "Electronics",
  mixed: "Mixed",
  notwaste: "Not waste",
};

export const aiClassificationSchema = z.object({
  category: z.enum(AI_CATEGORIES),
  isWaste: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string().max(500),
});

export type AiClassification = z.infer<typeof aiClassificationSchema>;

export const AI_DECISIONS = [
  "auto_approved",
  "needs_review",
  "skipped",
  "error",
] as const;

export type AiDecision = (typeof AI_DECISIONS)[number];

export const AI_DECISION_LABELS: Record<AiDecision, string> = {
  auto_approved: "Auto-approved",
  needs_review: "Needs review",
  skipped: "Skipped",
  error: "Error",
};
