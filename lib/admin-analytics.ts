import type { PropertyStatus } from "@prisma/client";

import { getAnalyticsCacheVersion } from "@/lib/cache-bust";
import { getCached } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

const propertyStatuses: PropertyStatus[] = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "SOLD",
  "RENTED",
  "ARCHIVED",
];

type CountValue = number | bigint | null | undefined;

type DateRangeInput = {
  from?: string | null;
  to?: string | null;
};

type QueryCountRow = {
  count: CountValue;
};

type DailyCountRow = QueryCountRow & {
  date: string;
};

type MonthlyCountRow = QueryCountRow & {
  month: string;
};

function toCount(value: CountValue) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return Number(value ?? 0);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function clampRange(from: Date, to: Date, maxDays = 366) {
  const days = Math.floor((to.getTime() - from.getTime()) / 86_400_000) + 1;

  if (days <= maxDays) {
    return { from, to };
  }

  return {
    from: startOfDay(addDays(to, -(maxDays - 1))),
    to,
  };
}

function resolveRanges(input: DateRangeInput = {}) {
  const hasInput = Boolean(input.from || input.to);
  const now = new Date();
  const defaultDaily = {
    from: startOfDay(addDays(now, -29)),
    to: endOfDay(now),
  };
  const defaultMonthly = {
    from: startOfMonth(addMonths(now, -5)),
    to: endOfDay(now),
  };

  if (!hasInput) {
    return {
      daily: defaultDaily,
      monthly: defaultMonthly,
      filtered: false,
    };
  }

  const parsedFrom = parseDate(input.from) ?? defaultDaily.from;
  const parsedTo = parseDate(input.to) ?? now;
  const from = startOfDay(parsedFrom);
  const to = endOfDay(parsedTo);
  const ordered =
    from <= to ? { from, to } : { from: startOfDay(to), to: endOfDay(from) };
  const clamped = clampRange(ordered.from, ordered.to);

  return {
    daily: clamped,
    monthly: clamped,
    filtered: true,
  };
}

function fillDailySeries(rows: DailyCountRow[], from: Date, to: Date) {
  const counts = new Map(rows.map((row) => [row.date, toCount(row.count)]));
  const series: Array<{ date: string; count: number }> = [];

  for (
    let cursor = startOfDay(from);
    cursor <= to;
    cursor = addDays(cursor, 1)
  ) {
    const key = dateKey(cursor);
    series.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return series;
}

function fillMonthlySeries(rows: MonthlyCountRow[], from: Date, to: Date) {
  const counts = new Map(rows.map((row) => [row.month, toCount(row.count)]));
  const series: Array<{ month: string; count: number }> = [];

  for (
    let cursor = startOfMonth(from);
    cursor <= to;
    cursor = addMonths(cursor, 1)
  ) {
    const key = monthKey(cursor);
    series.push({ month: key, count: counts.get(key) ?? 0 });
  }

  return series;
}

function rangeCacheKey(prefix: string, range: { from: Date; to: Date }) {
  return `${prefix}:${dateKey(range.from)}:${dateKey(range.to)}`;
}

export async function getPropertyStatusDistribution() {
  const version = await getAnalyticsCacheVersion();

  return getCached(
    `admin:analytics:properties-by-status:v${version}`,
    async () => {
      const rows = await prisma.property.groupBy({
        by: ["status"],
        _count: { id: true },
      });
      const counts = new Map(
        rows.map((row) => [row.status, row._count.id] as const),
      );

      return propertyStatuses.map((status) => ({
        status,
        count: counts.get(status) ?? 0,
      }));
    },
    600,
  );
}

export async function getPropertiesByRegion() {
  const version = await getAnalyticsCacheVersion();

  return getCached(
    `admin:analytics:properties-by-region:v${version}`,
    async () => {
      const rows = await prisma.property.groupBy({
        by: ["regionId"],
        where: { status: "APPROVED" },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      });
      const regions = await prisma.region.findMany({
        where: { id: { in: rows.map((row) => row.regionId) } },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          slug: true,
          code: true,
        },
      });
      const regionById = new Map(regions.map((region) => [region.id, region]));

      return rows.map((row) => {
        const region = regionById.get(row.regionId);

        return {
          regionId: row.regionId,
          nameAr: region?.nameAr ?? row.regionId,
          nameEn: region?.nameEn ?? row.regionId,
          slug: region?.slug ?? row.regionId,
          code: region?.code ?? null,
          count: row._count.id,
        };
      });
    },
    600,
  );
}

export async function getRegistrationSeries(input: DateRangeInput = {}) {
  const { daily } = resolveRanges(input);
  const version = await getAnalyticsCacheVersion();

  return getCached(
    rangeCacheKey(`admin:analytics:registrations:v${version}`, daily),
    async () => {
      const rows = await prisma.$queryRaw<DailyCountRow[]>`
        SELECT DATE(created_at)::text AS date, COUNT(*)::int AS count
        FROM users
        WHERE created_at >= ${daily.from} AND created_at <= ${daily.to}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      return {
        range: {
          from: dateKey(daily.from),
          to: dateKey(daily.to),
        },
        data: fillDailySeries(rows, daily.from, daily.to),
      };
    },
    600,
  );
}

export async function getAdminAnalyticsOverview(input: DateRangeInput = {}) {
  const ranges = resolveRanges(input);
  const version = await getAnalyticsCacheVersion();
  const cacheKey = [
    "admin:analytics:overview",
    `v${version}`,
    dateKey(ranges.daily.from),
    dateKey(ranges.daily.to),
    dateKey(ranges.monthly.from),
    dateKey(ranges.monthly.to),
  ].join(":");

  return getCached(
    cacheKey,
    async () => {
      const [
        statusDistribution,
        byRegion,
        totalProperties,
        totalUsers,
        totalInquiries,
        totalViews,
        periodProperties,
        periodUsers,
        periodInquiries,
        topViewed,
        topCitiesRows,
        registrationRows,
        inquiryRows,
      ] = await Promise.all([
        getPropertyStatusDistribution(),
        getPropertiesByRegion(),
        prisma.property.count(),
        prisma.user.count(),
        prisma.inquiry.count(),
        prisma.property.aggregate({ _sum: { viewCount: true } }),
        prisma.property.count({
          where: {
            createdAt: { gte: ranges.daily.from, lte: ranges.daily.to },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: ranges.daily.from, lte: ranges.daily.to },
          },
        }),
        prisma.inquiry.count({
          where: {
            createdAt: { gte: ranges.daily.from, lte: ranges.daily.to },
          },
        }),
        prisma.property.findMany({
          where: { status: "APPROVED" },
          orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
          take: 5,
          select: {
            id: true,
            slug: true,
            titleAr: true,
            titleEn: true,
            viewCount: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: {
                thumbnailUrl: true,
                url: true,
              },
            },
          },
        }),
        prisma.property.groupBy({
          by: ["cityId"],
          where: { status: "APPROVED" },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 10,
        }),
        prisma.$queryRaw<DailyCountRow[]>`
          SELECT DATE(created_at)::text AS date, COUNT(*)::int AS count
          FROM users
          WHERE created_at >= ${ranges.daily.from}
            AND created_at <= ${ranges.daily.to}
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `,
        prisma.$queryRaw<MonthlyCountRow[]>`
          SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
          FROM inquiries
          WHERE created_at >= ${ranges.monthly.from}
            AND created_at <= ${ranges.monthly.to}
          GROUP BY month
          ORDER BY month ASC
        `,
      ]);

      const cities = await prisma.city.findMany({
        where: { id: { in: topCitiesRows.map((row) => row.cityId) } },
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          slug: true,
          region: {
            select: {
              nameAr: true,
              nameEn: true,
            },
          },
        },
      });
      const cityById = new Map(cities.map((city) => [city.id, city]));

      return {
        range: {
          filtered: ranges.filtered,
          daily: {
            from: dateKey(ranges.daily.from),
            to: dateKey(ranges.daily.to),
          },
          monthly: {
            from: monthKey(ranges.monthly.from),
            to: monthKey(ranges.monthly.to),
          },
        },
        totals: {
          properties: totalProperties,
          users: totalUsers,
          inquiries: totalInquiries,
          views: totalViews._sum.viewCount ?? 0,
        },
        period: {
          properties: periodProperties,
          users: periodUsers,
          inquiries: periodInquiries,
        },
        statusDistribution,
        byRegion,
        registrations: fillDailySeries(
          registrationRows,
          ranges.daily.from,
          ranges.daily.to,
        ),
        inquiriesByMonth: fillMonthlySeries(
          inquiryRows,
          ranges.monthly.from,
          ranges.monthly.to,
        ),
        topViewed: topViewed.map((property) => ({
          id: property.id,
          slug: property.slug,
          titleAr: property.titleAr,
          titleEn: property.titleEn,
          viewCount: property.viewCount,
          thumbnailUrl:
            property.images[0]?.thumbnailUrl ?? property.images[0]?.url ?? null,
        })),
        topCities: topCitiesRows.map((row) => {
          const city = cityById.get(row.cityId);

          return {
            cityId: row.cityId,
            nameAr: city?.nameAr ?? row.cityId,
            nameEn: city?.nameEn ?? row.cityId,
            slug: city?.slug ?? row.cityId,
            regionAr: city?.region.nameAr ?? null,
            regionEn: city?.region.nameEn ?? null,
            count: row._count.id,
          };
        }),
      };
    },
    600,
  );
}

export type AdminAnalyticsOverview = Awaited<
  ReturnType<typeof getAdminAnalyticsOverview>
>;
