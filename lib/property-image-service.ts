import type { Prisma } from "@prisma/client";

import { HttpError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export function isAdminRole(role?: string | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function requirePropertyImageAccess({
  propertyId,
  userId,
  role,
}: {
  propertyId: string;
  userId: string;
  role?: string | null;
}) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, slug: true, status: true, userId: true },
  });

  if (!property) {
    throw new HttpError("Property not found", 404, "PROPERTY_NOT_FOUND");
  }

  if (property.userId !== userId && !isAdminRole(role)) {
    throw new HttpError("Forbidden", 403, "FORBIDDEN");
  }

  return property;
}

export function serializePropertyImage(image: {
  id: string;
  propertyId: string;
  storageKey: string;
  url: string;
  thumbnailKey: string | null;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
}) {
  return {
    ...image,
    createdAt: image.createdAt.toISOString(),
  };
}

export async function getNextPrimaryImage(
  tx: Prisma.TransactionClient,
  propertyId: string,
  excludeId: string,
) {
  return tx.propertyImage.findFirst({
    where: { propertyId, NOT: { id: excludeId } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}
