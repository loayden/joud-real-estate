import type { Prisma, UserRole, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const userRoles = [
  "USER",
  "AGENT",
  "ADMIN",
  "SUPER_ADMIN",
] as const satisfies readonly UserRole[];
const editableUserRoles = [
  "USER",
  "AGENT",
  "ADMIN",
] as const satisfies readonly UserRole[];
const userStatuses = [
  "ACTIVE",
  "INACTIVE",
  "BANNED",
  "PENDING_VERIFICATION",
] as const satisfies readonly UserStatus[];

const adminUserListInclude = {
  profile: {
    select: {
      firstName: true,
      lastName: true,
      avatarUrl: true,
      preferredLocale: true,
    },
  },
  _count: {
    select: {
      properties: true,
      sentInquiries: true,
      sessions: true,
    },
  },
} satisfies Prisma.UserInclude;

const userPropertyInclude = {
  images: {
    where: { isPrimary: true },
    take: 1,
    select: { thumbnailUrl: true, url: true },
  },
  city: { select: { nameAr: true, nameEn: true, slug: true } },
  category: { select: { nameAr: true, nameEn: true, slug: true } },
} satisfies Prisma.PropertyInclude;

const adminUserDetailInclude = {
  profile: {
    include: {
      city: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          slug: true,
          region: { select: { nameAr: true, nameEn: true, slug: true } },
        },
      },
    },
  },
  properties: {
    take: 10,
    orderBy: { createdAt: "desc" },
    include: userPropertyInclude,
  },
  sentInquiries: {
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { id: true, titleAr: true, slug: true } },
    },
  },
  _count: {
    select: {
      properties: true,
      sentInquiries: true,
      sessions: true,
    },
  },
} satisfies Prisma.UserInclude;

type AdminUserListRecord = Prisma.UserGetPayload<{
  include: typeof adminUserListInclude;
}>;

type AdminUserDetailRecord = Prisma.UserGetPayload<{
  include: typeof adminUserDetailInclude;
}>;

function decimalToNumber(value: unknown) {
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return typeof value === "number" ? value : Number(value);
}

function dateToIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export function parseUserRole(value: string | null | undefined) {
  return userRoles.find((role) => role === value);
}

export function parseEditableUserRole(value: string | null | undefined) {
  return editableUserRoles.find((role) => role === value);
}

export function parseUserStatus(value: string | null | undefined) {
  return userStatuses.find((status) => status === value);
}

export function serializeAdminUserListItem(user: AdminUserListRecord) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    emailVerified: dateToIso(user.emailVerified),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: dateToIso(user.lastLoginAt),
    lockedUntil: dateToIso(user.lockedUntil),
    failedLoginCount: user.failedLoginCount,
    profile: {
      firstName: user.profile?.firstName ?? null,
      lastName: user.profile?.lastName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      preferredLocale: user.profile?.preferredLocale ?? "ar",
    },
    counts: {
      properties: user._count.properties,
      sentInquiries: user._count.sentInquiries,
      sessions: user._count.sessions,
    },
  };
}

function serializeProperty(
  property: AdminUserDetailRecord["properties"][number],
) {
  return {
    id: property.id,
    slug: property.slug,
    titleAr: property.titleAr,
    titleEn: property.titleEn,
    status: property.status,
    listingType: property.listingType,
    price: decimalToNumber(property.price),
    currency: property.currency,
    area: decimalToNumber(property.area),
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
    primaryImageUrl:
      property.images[0]?.thumbnailUrl ?? property.images[0]?.url ?? null,
    city: property.city,
    category: property.category,
  };
}

function serializeJson(value: Prisma.JsonValue | null) {
  if (value === null) return null;
  return JSON.parse(JSON.stringify(value)) as unknown;
}

export function serializeAdminUserDetail({
  user,
  propertyStatusCounts,
  receivedInquiries,
  auditLogs,
}: {
  user: AdminUserDetailRecord;
  propertyStatusCounts: Array<{ status: string; count: number }>;
  receivedInquiries: Array<{
    id: string;
    status: string;
    message: string;
    createdAt: Date;
    guestName: string | null;
    guestEmail: string | null;
    guestPhone: string | null;
    property: { id: string; titleAr: string; slug: string };
    sender: {
      email: string;
      profile: { firstName: string; lastName: string } | null;
    } | null;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    oldValues: Prisma.JsonValue | null;
    newValues: Prisma.JsonValue | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    actor: {
      email: string;
      profile: { firstName: string; lastName: string } | null;
    } | null;
  }>;
}) {
  return {
    ...serializeAdminUserListItem(user),
    profile: {
      ...serializeAdminUserListItem(user).profile,
      bio: user.profile?.bio ?? null,
      whatsapp: user.profile?.whatsapp ?? null,
      city: user.profile?.city
        ? {
            id: user.profile.city.id,
            nameAr: user.profile.city.nameAr,
            nameEn: user.profile.city.nameEn,
            slug: user.profile.city.slug,
            region: user.profile.city.region,
          }
        : null,
    },
    properties: user.properties.map(serializeProperty),
    sentInquiries: user.sentInquiries.map((inquiry) => ({
      id: inquiry.id,
      status: inquiry.status,
      message: inquiry.message,
      createdAt: inquiry.createdAt.toISOString(),
      property: inquiry.property,
    })),
    receivedInquiries: receivedInquiries.map((inquiry) => ({
      id: inquiry.id,
      status: inquiry.status,
      message: inquiry.message,
      createdAt: inquiry.createdAt.toISOString(),
      guestName: inquiry.guestName,
      guestEmail: inquiry.guestEmail,
      guestPhone: inquiry.guestPhone,
      property: inquiry.property,
      sender: inquiry.sender
        ? {
            email: inquiry.sender.email,
            firstName: inquiry.sender.profile?.firstName ?? null,
            lastName: inquiry.sender.profile?.lastName ?? null,
          }
        : null,
    })),
    propertyStatusCounts,
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      oldValues: serializeJson(log.oldValues),
      newValues: serializeJson(log.newValues),
      metadata: serializeJson(log.metadata),
      createdAt: log.createdAt.toISOString(),
      actor: log.actor
        ? {
            email: log.actor.email,
            firstName: log.actor.profile?.firstName ?? null,
            lastName: log.actor.profile?.lastName ?? null,
          }
        : null,
    })),
  };
}

function buildWhere({
  search,
  role,
  status,
}: {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}): Prisma.UserWhereInput {
  const trimmedSearch = search?.trim();

  return {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(trimmedSearch
      ? {
          OR: [
            { email: { contains: trimmedSearch, mode: "insensitive" } },
            { phone: { contains: trimmedSearch, mode: "insensitive" } },
            {
              profile: {
                is: {
                  firstName: { contains: trimmedSearch, mode: "insensitive" },
                },
              },
            },
            {
              profile: {
                is: {
                  lastName: { contains: trimmedSearch, mode: "insensitive" },
                },
              },
            },
          ],
        }
      : {}),
  };
}

export async function getAdminUsers({
  search,
  role,
  status,
  page = 1,
  limit = 20,
}: {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
}) {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const where = buildWhere({ search, role, status });
  const skip = (safePage - 1) * safeLimit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: adminUserListInclude,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: safeLimit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users.map(serializeAdminUserListItem),
    total,
    page: safePage,
    totalPages: Math.max(Math.ceil(total / safeLimit), 1),
  };
}

export async function getAdminUserDetail(id: string) {
  const [user, propertyStatusGroups, receivedInquiries, auditLogs] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id },
        include: adminUserDetailInclude,
      }),
      prisma.property.groupBy({
        by: ["status"],
        where: { userId: id },
        _count: { id: true },
      }),
      prisma.inquiry.findMany({
        where: { ownerUserId: id },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          property: { select: { id: true, titleAr: true, slug: true } },
          sender: {
            select: {
              email: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.auditLog.findMany({
        where: {
          OR: [
            { actorId: id },
            { entity: "User", entityId: id },
            { entity: "UserRole", entityId: id },
          ],
        },
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: {
              email: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    ]);

  if (!user) return null;

  return serializeAdminUserDetail({
    user,
    propertyStatusCounts: propertyStatusGroups.map((group) => ({
      status: group.status,
      count: group._count.id,
    })),
    receivedInquiries,
    auditLogs,
  });
}

export function snapshotUserForAudit(user: {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: Date | null;
  failedLoginCount: number;
  lockedUntil: Date | null;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    emailVerified: dateToIso(user.emailVerified),
    failedLoginCount: user.failedLoginCount,
    lockedUntil: dateToIso(user.lockedUntil),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export type AdminUserListItem = Awaited<
  ReturnType<typeof getAdminUsers>
>["data"][number];

export type AdminUserDetail = NonNullable<
  Awaited<ReturnType<typeof getAdminUserDetail>>
>;
