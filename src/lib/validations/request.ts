import { z } from "zod";

export const REQUEST_TYPES = [
  "paper",
  "plastic",
  "metal",
  "glass",
  "electronic",
  "mixed",
] as const;

export const TIME_WINDOWS = [
  "morning",
  "afternoon",
  "evening",
] as const;

export const TIME_WINDOW_LABELS: Record<(typeof TIME_WINDOWS)[number], string> = {
  morning: "Morning (8 AM – 12 PM)",
  afternoon: "Afternoon (12 PM – 4 PM)",
  evening: "Evening (4 PM – 8 PM)",
};

export const REQUEST_TYPE_LABELS: Record<(typeof REQUEST_TYPES)[number], string> = {
  paper: "Paper",
  plastic: "Plastic",
  metal: "Metal",
  glass: "Glass",
  electronic: "Electronics",
  mixed: "Mixed",
};

export const createRequestSchema = z.object({
  type: z.enum(REQUEST_TYPES),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  latitude: z.number({
    required_error: "Please confirm the pickup location on the map.",
    invalid_type_error: "Please confirm the pickup location on the map.",
  }),
  longitude: z.number({
    required_error: "Please confirm the pickup location on the map.",
    invalid_type_error: "Please confirm the pickup location on the map.",
  }),
  geocodingSource: z.enum(["auto", "manual"]),
  weightKgEstimate: z
    .number({ invalid_type_error: "Weight must be a number." })
    .positive({ message: "Weight must be positive." })
    .optional(),
  preferredDate: z
    .string()
    .min(1, { message: "Pickup date is required." })
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date." }),
  preferredTimeWindow: z.enum(TIME_WINDOWS),
  notes: z.string().max(500).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
});

export const rescheduleRequestSchema = z.object({
  preferredDate: z
    .string()
    .min(1, { message: "Pickup date is required." })
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date." }),
  preferredTimeWindow: z.enum(TIME_WINDOWS),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type RescheduleRequestInput = z.infer<typeof rescheduleRequestSchema>;
