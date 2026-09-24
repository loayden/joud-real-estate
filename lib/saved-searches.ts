import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { HttpError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const RESERVED_FILTER_KEYS = new Set(["page", "limit"]);
const MAX_SAVED_SEARCHES = 50;

export const savedSearchFiltersSchema = z
  .record(z.string().trim().min(1).max(50), z.string().trim().max(300))
  .transform((filters) =>
    Object.fromEntries(
      Object.entries(filters)
        .map(([key, value]) => [key.trim(), value.trim()])
        .filter(
          ([key, value]) =>
            key.length > 0 &&
            value.length > 0 &&
            !RESERVED_FILTER_KEYS.has(key),
        ),
    ),
  )
  .refine((filters) => Object.keys(filters).length <= 30, {
    message: "Too many filters",
  });

export const savedSearchCreateSchema = z.object({
  nameAr: z.string().trim().min(1).max(200),
  filters: savedSearchFiltersSchema,
  alertEnabled: z.coerce.boolean().default(false),
});

export type SavedSearchFilters = Record<string, string>;

export type SavedSearchListItem = ReturnType<typeof serializeSavedSearch>;

function normalizeFilters(value: Prisma.JsonValue): SavedSearchFilters {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [key, typeof item === "string" ? item : ""])
      .filter(([, item]) => item.length > 0),
  );
}

export function serializeSavedSearch(search: {
  id: string;
  nameAr: string | null;
  filters: Prisma.JsonValue;
  alertEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: search.id,
    nameAr: search.nameAr,
    filters: normalizeFilters(search.filters),
    alertEnabled: search.alertEnabled,
    createdAt: search.createdAt.toISOString(),
    updatedAt: search.updatedAt.toISOString(),
  };
}

export async function getUserSavedSearches(userId: string) {
  const searches = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return searches.map(serializeSavedSearch);
}

export async function createSavedSearch(
  userId: string,
  input: z.infer<typeof savedSearchCreateSchema>,
) {
  const count = await prisma.savedSearch.count({ where: { userId } });

  if (count >= MAX_SAVED_SEARCHES) {
    throw new HttpError("Saved search limit reached", 400, "LIMIT_REACHED");
  }

  const search = await prisma.savedSearch.create({
    data: {
      userId,
      nameAr: input.nameAr,
      filters: input.filters,
      alertEnabled: input.alertEnabled,
    },
  });

  return serializeSavedSearch(search);
}

export async function deleteSavedSearch(userId: string, id: string) {
  const existing = await prisma.savedSearch.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!existing) {
    throw new HttpError("Saved search not found", 404, "NOT_FOUND");
  }

  if (existing.userId !== userId) {
    throw new HttpError("Forbidden", 403, "FORBIDDEN");
  }

  await prisma.savedSearch.delete({ where: { id } });

  return { deleted: true };
}
