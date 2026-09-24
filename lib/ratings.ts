import { Prisma, type ReviewStatus } from "@prisma/client";

import { HttpError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { sanitizeOptionalPlainText, sanitizePlainText } from "@/lib/sanitize";
import type { ratingSubmitSchema } from "@/lib/validations/phase25";
import type { z } from "zod";

type RatingInput = z.infer<typeof ratingSubmitSchema>;
type TransactionClient = Prisma.TransactionClient;

const ratingInclude = {
  user: {
    select: {
      id: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  },
  property: {
    select: {
      id: true,
      slug: true,
      titleAr: true,
      titleEn: true,
      userId: true,
    },
  },
} satisfies Prisma.PropertyRatingInclude;

function decimalToNumber(value: unknown) {
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return typeof value === "number" ? value : Number(value);
}

function serializeRating(
  rating: Prisma.PropertyRatingGetPayload<{ include: typeof ratingInclude }>,
) {
  const profile = rating.user.profile;
  const reviewerName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    "مستخدم جود";

  return {
    id: rating.id,
    propertyId: rating.propertyId,
    userId: rating.userId,
    overallScore: rating.overallScore,
    accuracyScore: rating.accuracyScore,
    valueScore: rating.valueScore,
    locationScore: rating.locationScore,
    commScore: rating.commScore,
    reviewTitle: rating.reviewTitle,
    reviewBody: rating.reviewBody,
    ownerResponse: rating.ownerResponse,
    isApproved: rating.isApproved,
    helpfulCount: rating.helpfulCount,
    status: rating.status,
    createdAt: rating.createdAt.toISOString(),
    updatedAt: rating.updatedAt.toISOString(),
    reviewer: {
      id: rating.user.id,
      name: reviewerName,
      avatarUrl: profile?.avatarUrl ?? null,
    },
    property: rating.property,
  };
}

async function getSellerUserId(
  tx: TransactionClient,
  propertyId: string,
): Promise<string | null> {
  const property = await tx.property.findUnique({
    where: { id: propertyId },
    select: { userId: true },
  });

  return property?.userId ?? null;
}

export async function recalculateSellerScore(
  tx: TransactionClient,
  sellerUserId: string,
) {
  const aggregate = await tx.propertyRating.aggregate({
    where: {
      status: "APPROVED",
      property: { userId: sellerUserId },
    },
    _avg: { overallScore: true },
    _count: { id: true },
  });

  await tx.user.update({
    where: { id: sellerUserId },
    data: {
      sellerScore: aggregate._avg.overallScore,
      sellerRatingCount: aggregate._count.id,
    },
  });
}

export async function recalculatePropertyRating(
  tx: TransactionClient,
  propertyId: string,
) {
  const [aggregate, sellerUserId] = await Promise.all([
    tx.propertyRating.aggregate({
      where: { propertyId, status: "APPROVED" },
      _avg: { overallScore: true },
      _count: { id: true },
    }),
    getSellerUserId(tx, propertyId),
  ]);

  await tx.property.update({
    where: { id: propertyId },
    data: {
      avgRating: aggregate._avg.overallScore,
      ratingCount: aggregate._count.id,
    },
  });

  if (sellerUserId) {
    await recalculateSellerScore(tx, sellerUserId);
  }
}

export async function submitPropertyRating(userId: string, input: RatingInput) {
  const inquiryCount = await prisma.inquiry.count({
    where: {
      propertyId: input.propertyId,
      senderId: userId,
    },
  });

  if (inquiryCount === 0) {
    throw new HttpError(
      "You can review a property only after submitting an inquiry",
      403,
      "RATING_REQUIRES_INQUIRY",
    );
  }

  const property = await prisma.property.findUnique({
    where: { id: input.propertyId },
    select: { id: true, status: true, userId: true },
  });

  if (!property || property.status !== "APPROVED") {
    throw new HttpError("Property not found", 404, "NOT_FOUND");
  }

  if (property.userId === userId) {
    throw new HttpError(
      "Owners cannot review their own property",
      400,
      "SELF_REVIEW",
    );
  }

  try {
    const rating = await prisma.propertyRating.create({
      data: {
        propertyId: input.propertyId,
        userId,
        overallScore: input.overallScore,
        accuracyScore: input.accuracyScore,
        valueScore: input.valueScore,
        locationScore: input.locationScore,
        commScore: input.commScore,
        reviewTitle: sanitizeOptionalPlainText(input.reviewTitle),
        reviewBody: sanitizeOptionalPlainText(input.reviewBody),
        status: "PENDING",
        isApproved: false,
      },
      include: ratingInclude,
    });

    return serializeRating(rating);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new HttpError(
        "You have already reviewed this property",
        409,
        "RATING_ALREADY_EXISTS",
      );
    }

    throw error;
  }
}

export async function getApprovedPropertyRatings(propertyId: string) {
  const ratings = await prisma.propertyRating.findMany({
    where: { propertyId, status: "APPROVED" },
    orderBy: [{ helpfulCount: "desc" }, { createdAt: "desc" }],
    include: ratingInclude,
  });

  const breakdown = await prisma.propertyRating.aggregate({
    where: { propertyId, status: "APPROVED" },
    _avg: {
      overallScore: true,
      accuracyScore: true,
      valueScore: true,
      locationScore: true,
      commScore: true,
    },
    _count: { id: true },
  });

  return {
    ratings: ratings.map(serializeRating),
    summary: {
      count: breakdown._count.id,
      overall: breakdown._avg.overallScore,
      accuracy: breakdown._avg.accuracyScore,
      value: breakdown._avg.valueScore,
      location: breakdown._avg.locationScore,
      communication: breakdown._avg.commScore,
    },
  };
}

export async function getSellerRatings(userId: string) {
  const [seller, ratings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        sellerScore: true,
        sellerRatingCount: true,
        profile: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
      },
    }),
    prisma.propertyRating.findMany({
      where: {
        status: "APPROVED",
        property: { userId },
      },
      include: ratingInclude,
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  if (!seller) {
    throw new HttpError("Seller not found", 404, "NOT_FOUND");
  }

  return {
    seller,
    ratings: ratings.map(serializeRating),
  };
}

export async function respondToRating({
  ratingId,
  ownerUserId,
  response,
}: {
  ratingId: string;
  ownerUserId: string;
  response: string;
}) {
  const rating = await prisma.propertyRating.findUnique({
    where: { id: ratingId },
    include: { property: { select: { userId: true } } },
  });

  if (!rating) {
    throw new HttpError("Rating not found", 404, "NOT_FOUND");
  }

  if (rating.property.userId !== ownerUserId) {
    throw new HttpError("Forbidden", 403, "FORBIDDEN");
  }

  if (rating.ownerResponse) {
    throw new HttpError("A response already exists", 409, "RESPONSE_EXISTS");
  }

  return prisma.propertyRating.update({
    where: { id: ratingId },
    data: { ownerResponse: sanitizePlainText(response) },
    include: ratingInclude,
  });
}

export async function voteRatingHelpful({
  ratingId,
  userId,
  isHelpful,
}: {
  ratingId: string;
  userId: string;
  isHelpful: boolean;
}) {
  const rating = await prisma.propertyRating.findUnique({
    where: { id: ratingId },
    select: { id: true, userId: true, status: true },
  });

  if (!rating || rating.status !== "APPROVED") {
    throw new HttpError("Rating not found", 404, "NOT_FOUND");
  }

  if (rating.userId === userId) {
    throw new HttpError("You cannot vote on your own review", 400, "SELF_VOTE");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.reviewHelpfulVote.upsert({
      where: { ratingId_userId: { ratingId, userId } },
      update: { isHelpful },
      create: { ratingId, userId, isHelpful },
    });

    const helpfulCount = await tx.reviewHelpfulVote.count({
      where: { ratingId, isHelpful: true },
    });

    return tx.propertyRating.update({
      where: { id: ratingId },
      data: { helpfulCount },
      select: { id: true, helpfulCount: true },
    });
  });

  return { ...updated, isHelpful };
}

export async function listAdminRatings(status?: ReviewStatus) {
  const ratings = await prisma.propertyRating.findMany({
    where: status ? { status } : undefined,
    include: ratingInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return ratings.map(serializeRating);
}

export async function moderateRating({
  ratingId,
  actorId,
  status,
  reason,
}: {
  ratingId: string;
  actorId: string;
  status: Extract<ReviewStatus, "APPROVED" | "REJECTED" | "FLAGGED">;
  reason?: string;
}) {
  const existing = await prisma.propertyRating.findUnique({
    where: { id: ratingId },
    select: {
      id: true,
      propertyId: true,
      status: true,
      isApproved: true,
      reviewTitle: true,
      reviewBody: true,
    },
  });

  if (!existing) {
    throw new HttpError("Rating not found", 404, "NOT_FOUND");
  }

  const rating = await prisma.$transaction(async (tx) => {
    const updated = await tx.propertyRating.update({
      where: { id: ratingId },
      data: {
        status,
        isApproved: status === "APPROVED",
      },
      include: ratingInclude,
    });

    await recalculatePropertyRating(tx, existing.propertyId);

    await tx.auditLog.create({
      data: {
        actorId,
        action: `REVIEW_${status}`,
        entity: "PropertyRating",
        entityId: ratingId,
        oldValues: existing as Prisma.InputJsonValue,
        newValues: { status, reason: reason ?? null },
      },
    });

    return updated;
  });

  return serializeRating(rating);
}

export { decimalToNumber, serializeRating };
