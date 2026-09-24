import type { InquiryStatus, Prisma } from "@prisma/client";
import { z } from "zod";

import { HttpError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const inquiryStatusSchema = z.object({
  status: z.enum(["NEW", "READ", "REPLIED", "CLOSED"]),
});

export const inquiryListInclude = {
  property: {
    select: {
      id: true,
      slug: true,
      titleAr: true,
      titleEn: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { thumbnailUrl: true, url: true },
      },
      user: {
        select: {
          email: true,
          phone: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              whatsapp: true,
            },
          },
        },
      },
    },
  },
  sender: {
    select: {
      id: true,
      email: true,
      phone: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          whatsapp: true,
          avatarUrl: true,
        },
      },
    },
  },
} satisfies Prisma.InquiryInclude;

export type InquiryListRecord = Prisma.InquiryGetPayload<{
  include: typeof inquiryListInclude;
}>;

export type InquiryListItem = ReturnType<typeof serializeInquiry>;

function fullName(
  profile?: { firstName: string | null; lastName: string | null } | null,
) {
  return [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
}

function contactName(inquiry: InquiryListRecord) {
  return (
    fullName(inquiry.sender?.profile) ||
    inquiry.guestName ||
    inquiry.guestEmail ||
    inquiry.guestPhone ||
    "Guest"
  );
}

function contactEmail(inquiry: InquiryListRecord) {
  return inquiry.sender?.email ?? inquiry.guestEmail ?? null;
}

function contactPhone(inquiry: InquiryListRecord) {
  return (
    inquiry.sender?.phone ??
    inquiry.sender?.profile?.whatsapp ??
    inquiry.guestPhone ??
    null
  );
}

function ownerName(inquiry: InquiryListRecord) {
  return fullName(inquiry.property.user.profile) || inquiry.property.user.email;
}

export function serializeInquiry(inquiry: InquiryListRecord) {
  const propertyImage = inquiry.property.images[0];

  return {
    id: inquiry.id,
    propertyId: inquiry.propertyId,
    senderId: inquiry.senderId,
    ownerUserId: inquiry.ownerUserId,
    message: inquiry.message,
    status: inquiry.status,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
    contact: {
      name: contactName(inquiry),
      email: contactEmail(inquiry),
      phone: contactPhone(inquiry),
      avatarUrl: inquiry.sender?.profile?.avatarUrl ?? null,
      isRegisteredUser: Boolean(inquiry.senderId),
    },
    owner: {
      name: ownerName(inquiry),
      email: inquiry.property.user.email,
      phone: inquiry.property.user.phone,
      whatsapp: inquiry.property.user.profile?.whatsapp ?? null,
    },
    property: {
      id: inquiry.property.id,
      slug: inquiry.property.slug,
      titleAr: inquiry.property.titleAr,
      titleEn: inquiry.property.titleEn,
      thumbnailUrl:
        propertyImage?.thumbnailUrl ??
        propertyImage?.url ??
        "/images/property-placeholder.jpg",
    },
  };
}

export async function getUnreadInquiryCount(userId: string) {
  return prisma.inquiry.count({
    where: { ownerUserId: userId, status: "NEW" },
  });
}

export function parseInquiryStatus(
  value: string | null | undefined,
): InquiryStatus | undefined {
  if (
    value === "NEW" ||
    value === "READ" ||
    value === "REPLIED" ||
    value === "CLOSED"
  ) {
    return value;
  }

  return undefined;
}

export async function getReceivedInquiries({
  userId,
  status,
}: {
  userId: string;
  status?: InquiryStatus;
}) {
  const inquiries = await prisma.inquiry.findMany({
    where: {
      ownerUserId: userId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: inquiryListInclude,
  });

  return inquiries.map(serializeInquiry);
}

export async function getSentInquiries(userId: string) {
  const inquiries = await prisma.inquiry.findMany({
    where: { senderId: userId },
    orderBy: { createdAt: "desc" },
    include: inquiryListInclude,
  });

  return inquiries.map(serializeInquiry);
}

export async function updateInquiryStatus({
  inquiryId,
  userId,
  status,
}: {
  inquiryId: string;
  userId: string;
  status: InquiryStatus;
}) {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true, ownerUserId: true, senderId: true, status: true },
  });

  if (!inquiry) {
    throw new HttpError("Inquiry not found", 404, "NOT_FOUND");
  }

  const isOwner = inquiry.ownerUserId === userId;
  const isSender = inquiry.senderId === userId;

  if (!isOwner && !isSender) {
    throw new HttpError("Forbidden", 403, "FORBIDDEN");
  }

  if (!isOwner && status !== "CLOSED") {
    throw new HttpError("Forbidden", 403, "FORBIDDEN");
  }

  const updated = await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { status },
    include: inquiryListInclude,
  });

  return serializeInquiry(updated);
}

export async function getAdminInquiries({
  status,
  search,
  page = 1,
  limit = 20,
}: {
  status?: InquiryStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const trimmedSearch = search?.trim();
  const where: Prisma.InquiryWhereInput = {
    ...(status ? { status } : {}),
    ...(trimmedSearch
      ? {
          OR: [
            { guestName: { contains: trimmedSearch, mode: "insensitive" } },
            { guestEmail: { contains: trimmedSearch, mode: "insensitive" } },
            { guestPhone: { contains: trimmedSearch, mode: "insensitive" } },
            {
              message: { contains: trimmedSearch, mode: "insensitive" },
            },
            {
              property: {
                OR: [
                  {
                    titleAr: {
                      contains: trimmedSearch,
                      mode: "insensitive",
                    },
                  },
                  {
                    titleEn: {
                      contains: trimmedSearch,
                      mode: "insensitive",
                    },
                  },
                  {
                    user: {
                      email: {
                        contains: trimmedSearch,
                        mode: "insensitive",
                      },
                    },
                  },
                ],
              },
            },
            {
              sender: {
                OR: [
                  {
                    email: {
                      contains: trimmedSearch,
                      mode: "insensitive",
                    },
                  },
                  {
                    phone: {
                      contains: trimmedSearch,
                      mode: "insensitive",
                    },
                  },
                ],
              },
            },
          ],
        }
      : {}),
  };
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      include: inquiryListInclude,
    }),
    prisma.inquiry.count({ where }),
  ]);

  return {
    data: inquiries.map(serializeInquiry),
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export type AdminInquiryResults = Awaited<ReturnType<typeof getAdminInquiries>>;
