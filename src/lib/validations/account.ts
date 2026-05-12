import { z } from "zod";

export const updateProfileSchema = z.object({
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
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, { message: "Current password is required." }),
    newPassword: z
      .string()
      .min(8, { message: "New password must be at least 8 characters." }),
    confirmPassword: z.string().min(8, { message: "Confirm your new password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "New password must differ from current password.",
  });

export const requestRoleChangeSchema = z.object({
  requestedRole: z.enum(["resident", "collector", "admin"]),
  reason: z
    .string()
    .min(10, { message: "Reason must be at least 10 characters." })
    .max(500, { message: "Reason must be 500 characters or fewer." }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RequestRoleChangeInput = z.infer<typeof requestRoleChangeSchema>;
