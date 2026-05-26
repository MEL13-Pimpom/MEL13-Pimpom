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
  timeWindow: z.enum(TIME_WINDOWS),
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

export type RejectRequestInput = z.infer<typeof rejectRequestSchema>;
export type ScheduleRequestInput = z.infer<typeof scheduleRequestSchema>;
export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type AssignCollectorInput = z.infer<typeof assignCollectorSchema>;
export type BroadcastInput = z.infer<typeof broadcastSchema>;
