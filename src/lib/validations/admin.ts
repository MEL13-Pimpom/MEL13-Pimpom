import { z } from "zod";
import { TIME_WINDOWS } from "./request";

export const rejectRequestSchema = z.object({
  rejectionReason: z.string().min(10, {
    message: "Rejection reason must be at least 10 characters.",
  }),
});

export const scheduleRequestSchema = z.object({
  scheduledDate: z
    .string()
    .min(1, { message: "Scheduled date is required." })
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date." }),
  scheduledTimeWindow: z.enum(TIME_WINDOWS),
});

export const createRouteSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters." }),
  scheduledDate: z
    .string()
    .min(1, { message: "Date is required." })
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date." }),
  collectorId: z.string().uuid().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
});

export const assignCollectorSchema = z.object({
  routeId: z.string().uuid(),
  collectorId: z.string().uuid({ message: "Pick a collector." }),
});

export const broadcastSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  body: z.string().min(10, { message: "Body must be at least 10 characters." }),
  targetRole: z.enum(["resident", "collector", "all"]),
});

export const createScheduleSchema = z.object({
  area: z.string().min(2, { message: "Area is required." }),
  dayOfWeek: z.coerce
    .number()
    .int()
    .min(0)
    .max(6, { message: "Day of week must be 0–6." }),
  timeWindow: z.string().min(3, { message: "Time window is required." }),
  capacity: z.coerce.number().int().positive().default(10),
});

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export type RejectRequestInput = z.infer<typeof rejectRequestSchema>;
export type ScheduleRequestInput = z.infer<typeof scheduleRequestSchema>;
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type AssignCollectorInput = z.infer<typeof assignCollectorSchema>;
export type BroadcastInput = z.infer<typeof broadcastSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
