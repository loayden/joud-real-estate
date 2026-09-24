import type { MetadataRoute } from "next";

import { locales } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { alternateLanguages, localizedUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, categories] = await Promise.all([
    prisma.property.findMany({
      where: { status: "APPROVED" },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, updatedAt: true },
      take: 5000,
    }),
    prisma.propertyCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, updatedAt: true },
    }),
  ]);

  const staticUrls = [
    "",
    "/properties",
    "/search",
    "/about",
    "/contact",
    "/mortgage",
    "/compounds",
    "/agents",
    "/developers",
    "/compare",
  ].flatMap((path) =>
    locales.map((locale) => ({
      url: localizedUrl(locale, path),
      changeFrequency: "daily" as const,
      priority: path === "" ? 1 : 0.8,
      alternates: {
        languages: alternateLanguages(path),
      },
    })),
  );

  const categoryUrls = categories.flatMap((category) => {
    const path = `/search?categoryId=${encodeURIComponent(category.id)}`;

    return locales.map((locale) => ({
      url: localizedUrl(locale, path),
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: {
        languages: alternateLanguages(path),
      },
    }));
  });

  const propertyUrls = properties.flatMap((property) => {
    const path = `/property/${property.slug}`;

    return locales.map((locale) => ({
      url: localizedUrl(locale, path),
      lastModified: property.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.9,
      alternates: {
        languages: alternateLanguages(path),
      },
    }));
  });

  return [...staticUrls, ...categoryUrls, ...propertyUrls];
}
