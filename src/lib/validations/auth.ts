import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export const signupSchema = z
  .object({
    fullName: z.string().min(2, { message: "Full name is required." }),
    email: z.string().email({ message: "Enter a valid email address." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
    role: z.enum(["resident", "collector"]),
    phone: z.string().optional(),
    address: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address." }),
});

export const verifyOtpSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address." }),
  token: z
    .string()
    .length(6, { message: "Enter the 6-digit code from your email." })
    .regex(/^\d{6}$/, { message: "The code must be 6 digits." }),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email({ message: "Enter a valid email address." }),
    token: z
      .string()
      .length(6, { message: "Enter the 6-digit code from your email." })
      .regex(/^\d{6}$/, { message: "The code must be 6 digits." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
