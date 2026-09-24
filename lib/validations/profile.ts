import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

const optionalPhone = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^\+?[0-9\s-]+$/, "Invalid phone number")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: optionalPhone,
  bio: optionalText(1000),
  whatsapp: optionalPhone,
  preferredLocale: z.enum(["ar", "en"]).default("ar"),
  cityId: z
    .string()
    .cuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
