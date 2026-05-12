import { z } from "zod";

export const adminUpdateUserSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z
    .string()
    .max(20, { message: "Phone must be 20 characters or fewer." })
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(300, { message: "Address must be 300 characters or fewer." })
    .optional()
    .or(z.literal("")),
  role: z.enum(["resident", "admin", "collector"]),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
