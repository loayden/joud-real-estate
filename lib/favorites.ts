import type { Prisma } from "@prisma/client";

import { HttpError } from "@/lib/api-response";
import {
  propertyListInclude,
  serializePropertyListItem,
} from "@/lib/property-listing";
import { prisma } from "@/lib/prisma";

export const favoriteInclude = {
  property: {
    include: propertyListInclude,
  },
} satisfies Prisma.FavoriteInclude;

export type FavoriteRecord = Prisma.FavoriteGetPayload<{
  include: typeof favoriteInclude;
}>;

export type FavoriteListItem = ReturnType<typeof serializeFavorite>;

export function serializeFavorite(favorite: FavoriteRecord) {
  return {
    id: favorite.id,
    propertyId: favorite.propertyId,
    createdAt: favorite.createdAt.toISOString(),
    property: serializePropertyListItem(favorite.property),
  };
}

export async function getFavoritePropertyIds(
  userId: string | undefined | null,
  propertyIds: string[],
) {
  if (!userId || propertyIds.length === 0) return [];
  if (!process.env.DATABASE_URL?.trim()) return [];

  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
        propertyId: { in: propertyIds },
        property: { status: "APPROVED" },
      },
      select: { propertyId: true },
    });

    return favorites.map((favorite) => favorite.propertyId);
  } catch (error) {
    console.error("Favorite IDs lookup failed", error);
    return [];
  }
}

export async function getUserFavorites(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: {
      userId,
      property: { status: "APPROVED" },
    },
    include: favoriteInclude,
    orderBy: { createdAt: "desc" },
  });

  return favorites.map(serializeFavorite);
}

export async function toggleFavorite(userId: string, propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, status: true },
  });

  if (!property || property.status !== "APPROVED") {
    throw new HttpError("Property not found", 404, "PROPERTY_NOT_FOUND");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
      select: { id: true },
    });

    if (existing) {
      await tx.favorite.delete({ where: { id: existing.id } });
      await tx.property.updateMany({
        where: { id: propertyId, favoriteCount: { gt: 0 } },
        data: { favoriteCount: { decrement: 1 } },
      });

      return { favorited: false };
    }

    try {
      await tx.favorite.create({
        data: { userId, propertyId },
      });
    } catch (error) {
      const existing = await tx.favorite.findUnique({
        where: { userId_propertyId: { userId, propertyId } },
        select: { id: true },
      });
      if (existing) {
        await tx.favorite.delete({ where: { id: existing.id } });
        await tx.property.updateMany({
          where: { id: propertyId, favoriteCount: { gt: 0 } },
          data: { favoriteCount: { decrement: 1 } },
        });
        return { favorited: false };
      }
      throw error;
    }

    await tx.property.update({
      where: { id: propertyId },
      data: { favoriteCount: { increment: 1 } },
    });

    return { favorited: true };
  });
}
