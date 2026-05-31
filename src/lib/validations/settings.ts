import { z } from "zod";

export const AI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
] as const;

export type AiModel = (typeof AI_MODELS)[number];

export const DEFAULT_AI_MODEL: AiModel = "gemini-2.5-flash-lite";

export const AI_MODEL_LABELS: Record<AiModel, string> = {
  "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite (fastest, cheapest)",
  "gemini-2.5-flash": "Gemini 2.5 Flash (more accurate)",
  "gemini-3.1-flash-lite": "Gemini 3.1 Flash Lite (latest)",
};

export const aiSettingsSchema = z.object({
  aiEnabled: z.boolean(),
  aiModel: z.enum(AI_MODELS),
  aiMinConfidence: z.number().min(0).max(1),
});

export type AiSettingsInput = z.infer<typeof aiSettingsSchema>;

export function isAllowedAiModel(model: string): model is AiModel {
  return (AI_MODELS as readonly string[]).includes(model);
}
