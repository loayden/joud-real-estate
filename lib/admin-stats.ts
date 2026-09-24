import { prisma } from "@/lib/prisma";

function subDays(date: Date, days: number) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

function toNumber(value: unknown) {
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return typeof value === "number" ? value : Number(value);
}

export async function getAdminStats() {
  const weekStart = subDays(new Date(), 7);
  const [
    totalApproved,
    totalPending,
    totalRejected,
    totalDraft,
    totalUsers,
    newUsersThisWeek,
    totalInquiries,
    recentProperties,
    recentActivity,
  ] = await Promise.all([
    prisma.property.count({ where: { status: "APPROVED" } }),
    prisma.property.count({ where: { status: "PENDING" } }),
    prisma.property.count({ where: { status: "REJECTED" } }),
    prisma.property.count({ where: { status: "DRAFT" } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.inquiry.count(),
    prisma.property.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        city: { select: { nameAr: true, nameEn: true } },
        user: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    totals: {
      properties: {
        approved: totalApproved,
        pending: totalPending,
        rejected: totalRejected,
        draft: totalDraft,
        all: totalApproved + totalPending + totalRejected + totalDraft,
      },
      users: totalUsers,
      newUsersThisWeek,
      inquiries: totalInquiries,
    },
    recentProperties: recentProperties.map((property) => ({
      id: property.id,
      slug: property.slug,
      titleAr: property.titleAr,
      titleEn: property.titleEn,
      price: toNumber(property.price),
      currency: property.currency,
      createdAt: property.createdAt.toISOString(),
      city: property.city,
      owner: {
        email: property.user.email,
        firstName: property.user.profile?.firstName ?? null,
        lastName: property.user.profile?.lastName ?? null,
      },
    })),
    recentActivity: recentActivity.map((activity) => ({
      id: activity.id,
      action: activity.action,
      entity: activity.entity,
      entityId: activity.entityId,
      createdAt: activity.createdAt.toISOString(),
      actor: activity.actor
        ? {
            email: activity.actor.email,
            firstName: activity.actor.profile?.firstName ?? null,
            lastName: activity.actor.profile?.lastName ?? null,
          }
        : null,
    })),
  };
}

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;
