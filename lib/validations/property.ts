import { z } from "zod";

const emptyToUndefined = z.literal("").transform(() => undefined);

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(emptyToUndefined);

const optionalCuid = z
  .string()
  .cuid()
  .optional()
  .or(emptyToUndefined)
  .nullable();

const optionalPositiveNumber = (max: number) =>
  z.coerce.number().positive().max(max).optional();

const optionalInt = (min: number, max: number) =>
  z.coerce.number().int().min(min).max(max).optional();

export const propertyMutationSchema = z.object({
  titleAr: z.string().trim().min(5).max(300).optional(),
  titleEn: optionalString(300),
  descriptionAr: z.string().trim().min(20).max(5000).optional(),
  descriptionEn: optionalString(5000),
  listingType: z.enum(["SALE", "RENT"]).optional(),
  categoryId: z.string().cuid().optional(),
  typeId: z.string().cuid().optional(),
  regionId: z.string().cuid().optional(),
  cityId: z.string().cuid().optional(),
  neighborhoodId: optionalCuid,
  price: optionalPositiveNumber(999999999),
  priceNegotiable: z.coerce.boolean().optional(),
  area: optionalPositiveNumber(999999),
  areaUnit: z.string().trim().max(10).default("sqm").optional(),
  bedrooms: optionalInt(0, 50),
  bathrooms: optionalInt(0, 30),
  floors: optionalInt(1, 50),
  parkingSpaces: optionalInt(0, 20),
  yearBuilt: optionalInt(1900, new Date().getFullYear() + 1),
  streetWidth: optionalPositiveNumber(100),
  address: optionalString(500),
  street: optionalString(200),
  buildingNumber: optionalString(20),
  apartmentNumber: optionalString(20),
  floorNumber: optionalInt(0, 100),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  virtualTourUrl: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .or(emptyToUndefined),
  tour360ImageUrls: z
    .array(z.string().trim().url().max(500))
    .max(12)
    .optional(),
  amenityIds: z.array(z.string().cuid()).optional(),
  action: z.enum(["draft", "submit"]).default("draft").optional(),
});

export const propertyCreateSchema = propertyMutationSchema.extend({
  titleAr: z.string().trim().min(5).max(300),
  listingType: z.enum(["SALE", "RENT"]),
  categoryId: z.string().cuid(),
  typeId: z.string().cuid(),
});

export const propertySubmitSchema = z.object({
  titleAr: z.string().trim().min(5).max(300),
  titleEn: optionalString(300),
  descriptionAr: z.string().trim().min(20).max(5000),
  descriptionEn: optionalString(5000),
  listingType: z.enum(["SALE", "RENT"]),
  categoryId: z.string().cuid(),
  typeId: z.string().cuid(),
  regionId: z.string().cuid(),
  cityId: z.string().cuid(),
  neighborhoodId: optionalCuid,
  price: z.coerce.number().positive().max(999999999),
  priceNegotiable: z.coerce.boolean().default(false),
  area: z.coerce.number().positive().max(999999),
  areaUnit: z.string().trim().max(10).default("sqm"),
  bedrooms: optionalInt(0, 50),
  bathrooms: optionalInt(0, 30),
  floors: optionalInt(1, 50),
  parkingSpaces: optionalInt(0, 20),
  yearBuilt: optionalInt(1900, new Date().getFullYear() + 1),
  streetWidth: optionalPositiveNumber(100),
  address: optionalString(500),
  street: optionalString(200),
  buildingNumber: optionalString(20),
  apartmentNumber: optionalString(20),
  floorNumber: optionalInt(0, 100),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  virtualTourUrl: z
    .string()
    .trim()
    .url()
    .max(500)
    .optional()
    .or(emptyToUndefined),
  tour360ImageUrls: z
    .array(z.string().trim().url().max(500))
    .max(12)
    .optional(),
  amenityIds: z.array(z.string().cuid()).default([]),
});

export type PropertyMutationInput = z.infer<typeof propertyMutationSchema>;
export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertySubmitInput = z.infer<typeof propertySubmitSchema>;
