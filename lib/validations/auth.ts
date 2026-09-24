import { z } from "zod";

const optionalPhone = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^\+?[0-9\s-]+$/, "Invalid phone number")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: optionalPhone,
  locale: z.enum(["ar", "en"]).default("ar"),
  hcaptchaToken: z.string().min(20).max(2000).optional(),
});

export const emailSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  locale: z.enum(["ar", "en"]).default("ar"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(32).max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(255),
  password: z.string().min(8).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
