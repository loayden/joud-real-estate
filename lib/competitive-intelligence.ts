import { getCached } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export const competitorMatrix = [
  {
    platform: "Aqar عقار",
    uiUx: 6,
    arabic: 9,
    search: 7,
    mobile: 7,
    alJoufCoverage: 4,
    freeListings: true,
    trustLayer: false,
    ratingTool: false,
    priceTools: false,
    overall: 6.1,
  },
  {
    platform: "Bayut بيوت",
    uiUx: 8,
    arabic: 7,
    search: 8,
    mobile: 9,
    alJoufCoverage: 3,
    freeListings: false,
    trustLayer: true,
    ratingTool: false,
    priceTools: true,
    overall: 6.8,
  },
  {
    platform: "Property Finder",
    uiUx: 8,
    arabic: 6,
    search: 8,
    mobile: 9,
    alJoufCoverage: 2,
    freeListings: false,
    trustLayer: true,
    ratingTool: false,
    priceTools: true,
    overall: 6.4,
  },
  {
    platform: "Wasalt وصلت",
    uiUx: 7,
    arabic: 8,
    search: 7,
    mobile: 8,
    alJoufCoverage: 5,
    freeListings: true,
    trustLayer: false,
    ratingTool: false,
    priceTools: false,
    overall: 6.5,
  },
  {
    platform: "Haraj حراج",
    uiUx: 5,
    arabic: 9,
    search: 5,
    mobile: 7,
    alJoufCoverage: 6,
    freeListings: true,
    trustLayer: false,
    ratingTool: false,
    priceTools: false,
    overall: 5.7,
  },
  {
    platform: "Sakani سكني",
    uiUx: 7,
    arabic: 10,
    search: 6,
    mobile: 8,
    alJoufCoverage: 3,
    freeListings: false,
    trustLayer: true,
    ratingTool: false,
    priceTools: true,
    overall: 6.2,
  },
  {
    platform: "جود العقارية",
    uiUx: 10,
    arabic: 10,
    search: 10,
    mobile: 10,
    alJoufCoverage: 10,
    freeListings: true,
    trustLayer: true,
    ratingTool: true,
    priceTools: true,
    overall: 10,
  },
] as const;

export const featureMatrix = [
  "Egypt market specialization",
  "Arabic-first RTL",
  "Free individual listings",
  "Verified reviews",
  "Seller reputation",
  "Mortgage calculator",
  "Comparison tool",
  "Price alerts",
  "Property reports",
  "Price history",
  "Market estimate",
] as const;

function scorePercent(value: number, max = 10) {
  return Math.round((value / max) * 100);
}

export async function getCompetitiveScore() {
  return getCached(
    "admin:competitive-score:v1",
    async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [
        totalProperties,
        approvedProperties,
        pendingProperties,
        totalRatings,
        ratingAggregate,
        totalInquiries,
        repliedInquiries,
        activeUsers30d,
        priceAlertCount,
        openReports,
      ] = await Promise.all([
        prisma.property.count(),
        prisma.property.count({ where: { status: "APPROVED" } }),
        prisma.property.count({ where: { status: "PENDING" } }),
        prisma.propertyRating.count({ where: { status: "APPROVED" } }),
        prisma.propertyRating.aggregate({
          where: { status: "APPROVED" },
          _avg: { overallScore: true },
        }),
        prisma.inquiry.count(),
        prisma.inquiry.count({
          where: { status: { in: ["REPLIED", "CLOSED"] } },
        }),
        prisma.user.count({ where: { lastLoginAt: { gte: since } } }),
        prisma.priceAlert.count({ where: { isActive: true } }),
        prisma.propertyReport.count({
          where: { status: { in: ["OPEN", "REVIEWING"] } },
        }),
      ]);

      const activeRatio =
        totalProperties > 0 ? approvedProperties / totalProperties : 0;
      const responseRate =
        totalInquiries > 0 ? repliedInquiries / totalInquiries : 1;
      const ratingScore = scorePercent(
        ratingAggregate._avg.overallScore ?? 5,
        5,
      );
      const activeListingScore = Math.round(activeRatio * 100);
      const responseScore = Math.round(responseRate * 100);
      const moderationScore = Math.max(0, 100 - pendingProperties * 2);
      const trustScore = Math.min(100, 70 + totalRatings * 3 - openReports * 2);
      const platformHealthScore = Math.round(
        ratingScore * 0.25 +
          activeListingScore * 0.2 +
          responseScore * 0.2 +
          moderationScore * 0.2 +
          trustScore * 0.15,
      );

      return {
        platformHealthScore,
        metrics: {
          totalProperties,
          approvedProperties,
          pendingProperties,
          averageRating: ratingAggregate._avg.overallScore ?? null,
          totalRatings,
          responseRate: Math.round(responseRate * 100),
          activeUsers30d,
          priceAlertCount,
          openReports,
        },
        competitorMatrix,
        featureMatrix,
      };
    },
    600,
  );
}

export async function getMarketInsights() {
  return getCached(
    "admin:market-insights:v1",
    async () => {
      const [byRegion, topCities, priceAlerts, reports] = await Promise.all([
        prisma.property.groupBy({
          by: ["regionId"],
          where: { status: "APPROVED" },
          _count: { id: true },
          _avg: { price: true, area: true },
          orderBy: { _count: { id: "desc" } },
          take: 10,
        }),
        prisma.property.groupBy({
          by: ["cityId"],
          where: { status: "APPROVED" },
          _count: { id: true },
          _avg: { price: true },
          orderBy: { _count: { id: "desc" } },
          take: 10,
        }),
        prisma.priceAlert.groupBy({
          by: ["propertyId"],
          where: { isActive: true },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 10,
        }),
        prisma.propertyReport.groupBy({
          by: ["reason"],
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
        }),
      ]);

      return { byRegion, topCities, priceAlerts, reports };
    },
    600,
  );
}
