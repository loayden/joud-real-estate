import { z } from "zod";

const score = z.coerce.number().int().min(1).max(5);
const optionalScore = score.optional();
const emptyToUndefined = z.literal("").transform(() => undefined);

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(emptyToUndefined);

export const ratingSubmitSchema = z.object({
  propertyId: z.string().cuid(),
  overallScore: score,
  accuracyScore: optionalScore,
  valueScore: optionalScore,
  locationScore: optionalScore,
  commScore: optionalScore,
  reviewTitle: optionalText(200),
  reviewBody: optionalText(4000),
});

export const ratingResponseSchema = z.object({
  response: z.string().trim().min(2).max(2000),
});

export const helpfulVoteSchema = z.object({
  isHelpful: z.coerce.boolean(),
});

export const ratingRejectSchema = z.object({
  reason: z.string().trim().min(5).max(1000).optional(),
});

export const priceAlertSchema = z.object({
  propertyId: z.string().cuid(),
  targetPrice: z.coerce.number().positive().max(999999999).optional(),
});

export const reportPropertySchema = z.object({
  propertyId: z.string().cuid(),
  reason: z.enum([
    "FAKE_LISTING",
    "DUPLICATE",
    "WRONG_PRICE",
    "WRONG_LOCATION",
    "INAPPROPRIATE",
    "SOLD_NOT_UPDATED",
    "OTHER",
  ]),
  details: optionalText(4000),
});

export const reportResolveSchema = z.object({
  status: z.enum(["REVIEWING", "RESOLVED", "DISMISSED"]),
  action: optionalText(500),
});

export const compareIdsSchema = z.object({
  ids: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, 4),
    )
    .pipe(z.array(z.string().cuid()).min(1).max(4)),
});
