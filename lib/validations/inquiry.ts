import { z } from "zod";

const optionalContact = z
  .string()
  .trim()
  .max(255)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const inquiryCreateSchema = z.object({
  propertyId: z.string().cuid(),
  message: z.string().trim().min(10).max(2000),
  name: optionalContact,
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  phone: optionalContact,
  locale: z.enum(["ar", "en"]).default("ar"),
  hcaptchaToken: z.string().optional(),
});

export type InquiryCreateInput = z.infer<typeof inquiryCreateSchema>;
