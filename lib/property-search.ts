import { Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { z } from "zod";

import {
  getPropertyOrderBy,
  parseListingType,
  type PropertyListItem,
} from "@/lib/property-listing";
import { prisma } from "@/lib/prisma";

export const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  regionId: z.string().cuid().optional(),
  region: z.string().trim().max(100).optional(),
  cityId: z.string().cuid().optional(),
  city: z.string().trim().max(100).optional(),
  categoryId: z.string().cuid().optional(),
  typeId: z.string().cuid().optional(),
  listingType: z.enum(["SALE", "RENT"]).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minArea: z.coerce.number().nonnegative().optional(),
  maxArea: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).max(50).optional(),
  bathrooms: z.coerce.number().int().min(0).max(30).optional(),
  sort: z
    .enum([
      "newest",
      "price_asc",
      "price_desc",
      "area_asc",
      "price-asc",
      "price-desc",
    ])
    .default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SearchParams = z.infer<typeof searchQuerySchema>;

type SearchRow = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  listingType: "SALE" | "RENT";
  price: number | string;
  currency: string;
  area: number | string;
  bedrooms: number | null;
  bathrooms: number | null;
  status: "APPROVED";
  isFeatured: boolean;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  primaryImageUrl: string | null;
  cityNameAr: string;
  cityNameEn: string;
  citySlug: string;
  regionNameAr: string;
  regionNameEn: string;
  regionSlug: string;
  categoryNameAr: string;
  categoryNameEn: string;
  categorySlug: string;
  typeNameAr: string | null;
  typeNameEn: string | null;
  typeSlug: string | null;
};

function dateToIso(value: Date | string | null) {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeSearchRow(row: SearchRow): PropertyListItem {
  return {
    id: row.id,
    slug: row.slug,
    titleAr: row.titleAr,
    titleEn: row.titleEn,
    listingType: row.listingType,
    price: Number(row.price),
    currency: row.currency,
    area: Number(row.area),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    status: row.status,
    isFeatured: row.isFeatured,
    publishedAt: dateToIso(row.publishedAt),
    createdAt: dateToIso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: dateToIso(row.updatedAt) ?? new Date().toISOString(),
    primaryImageUrl: row.primaryImageUrl ?? "/images/property-placeholder.jpg",
    city: {
      nameAr: row.cityNameAr,
      nameEn: row.cityNameEn,
      slug: row.citySlug,
    },
    region: {
      nameAr: row.regionNameAr,
      nameEn: row.regionNameEn,
      slug: row.regionSlug,
    },
    category: {
      nameAr: row.categoryNameAr,
      nameEn: row.categoryNameEn,
      slug: row.categorySlug,
    },
    type: row.typeNameAr
      ? {
          nameAr: row.typeNameAr,
          nameEn: row.typeNameEn ?? row.typeNameAr,
          slug: row.typeSlug ?? "",
        }
      : { nameAr: "", nameEn: "", slug: "" },
  };
}

function buildWhereSql(params: SearchParams) {
  const q = params.q?.trim();
  const listingType = parseListingType(params.listingType);

  return Prisma.sql`
    p.status = 'APPROVED'::property_status
    ${
      q
        ? Prisma.sql`AND p.search_vector @@ (plainto_tsquery('arabic', ${q}) || plainto_tsquery('simple', ${q}))`
        : Prisma.empty
    }
    ${
      params.regionId
        ? Prisma.sql`AND p.region_id = ${params.regionId}`
        : Prisma.empty
    }
    ${
      params.region && !params.regionId
        ? Prisma.sql`AND r.slug = ${params.region}`
        : Prisma.empty
    }
    ${
      params.cityId
        ? Prisma.sql`AND p.city_id = ${params.cityId}`
        : Prisma.empty
    }
    ${
      params.city && !params.cityId
        ? Prisma.sql`AND c.slug = ${params.city}`
        : Prisma.empty
    }
    ${
      params.categoryId
        ? Prisma.sql`AND p.category_id = ${params.categoryId}`
        : Prisma.empty
    }
    ${
      params.typeId
        ? Prisma.sql`AND p.type_id = ${params.typeId}`
        : Prisma.empty
    }
    ${
      listingType
        ? Prisma.sql`AND p.listing_type = ${listingType}::listing_type`
        : Prisma.empty
    }
    ${
      params.minPrice !== undefined
        ? Prisma.sql`AND p.price >= ${params.minPrice}`
        : Prisma.empty
    }
    ${
      params.maxPrice !== undefined
        ? Prisma.sql`AND p.price <= ${params.maxPrice}`
        : Prisma.empty
    }
    ${
      params.minArea !== undefined
        ? Prisma.sql`AND p.area >= ${params.minArea}`
        : Prisma.empty
    }
    ${
      params.maxArea !== undefined
        ? Prisma.sql`AND p.area <= ${params.maxArea}`
        : Prisma.empty
    }
    ${
      params.bedrooms !== undefined
        ? Prisma.sql`AND p.bedrooms >= ${params.bedrooms}`
        : Prisma.empty
    }
    ${
      params.bathrooms !== undefined
        ? Prisma.sql`AND p.bathrooms >= ${params.bathrooms}`
        : Prisma.empty
    }
  `;
}

function buildOrderSql(params: SearchParams) {
  if (params.q?.trim()) {
    return Prisma.sql`
      ts_rank(
        p.search_vector,
        plainto_tsquery('arabic', ${params.q}) || plainto_tsquery('simple', ${params.q})
      ) DESC,
      p.published_at DESC NULLS LAST,
      p.created_at DESC
    `;
  }

  const order = getPropertyOrderBy(params.sort);
  const first = order[0];

  if ("price" in first && first.price === "asc") {
    return Prisma.sql`p.price ASC, p.published_at DESC NULLS LAST`;
  }
  if ("price" in first && first.price === "desc") {
    return Prisma.sql`p.price DESC, p.published_at DESC NULLS LAST`;
  }
  if ("area" in first) {
    return Prisma.sql`p.area ASC, p.published_at DESC NULLS LAST`;
  }

  return Prisma.sql`p.published_at DESC NULLS LAST, p.created_at DESC`;
}

export function normalizeSearchParams(
  input: Record<string, string | string[] | undefined>,
) {
  const raw = Object.fromEntries(
    Object.entries(input)
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      .filter(([, value]) => value !== undefined && value !== ""),
  );
  const parsed = searchQuerySchema.safeParse(raw);

  if (!parsed.success) {
    return null;
  }

  if (
    parsed.data.minPrice !== undefined &&
    parsed.data.maxPrice !== undefined &&
    parsed.data.minPrice > parsed.data.maxPrice
  ) {
    return null;
  }

  if (
    parsed.data.minArea !== undefined &&
    parsed.data.maxArea !== undefined &&
    parsed.data.minArea > parsed.data.maxArea
  ) {
    return null;
  }

  return parsed.data;
}

export function searchCacheKey(params: SearchParams) {
  const stable = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));

  return `search:${createHash("md5").update(JSON.stringify(stable)).digest("hex")}`;
}

export async function searchProperties(params: SearchParams) {
  const whereSql = buildWhereSql(params);
  const orderSql = buildOrderSql(params);
  const offset = (params.page - 1) * params.limit;

  const [countRows, rows] = await Promise.all([
    prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COUNT(*)::int AS total
      FROM properties p
      JOIN cities c ON c.id = p.city_id
      JOIN regions r ON r.id = p.region_id
      JOIN property_categories pc ON pc.id = p.category_id
      WHERE ${whereSql}
    `,
    prisma.$queryRaw<SearchRow[]>`
      SELECT
        p.id,
        p.slug,
        p.title_ar AS "titleAr",
        p.title_en AS "titleEn",
        p.listing_type AS "listingType",
        p.price::float8 AS price,
        p.currency,
        p.area::float8 AS area,
        p.bedrooms,
        p.bathrooms,
        p.status,
        p.is_featured AS "isFeatured",
        p.published_at AS "publishedAt",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        COALESCE(pi.thumbnail_url, pi.url) AS "primaryImageUrl",
        c.name_ar AS "cityNameAr",
        c.name_en AS "cityNameEn",
        c.slug AS "citySlug",
        r.name_ar AS "regionNameAr",
        r.name_en AS "regionNameEn",
        r.slug AS "regionSlug",
        pc.name_ar AS "categoryNameAr",
        pc.name_en AS "categoryNameEn",
        pc.slug AS "categorySlug",
        pt.name_ar AS "typeNameAr",
        pt.name_en AS "typeNameEn",
        pt.slug AS "typeSlug"
      FROM properties p
      JOIN cities c ON c.id = p.city_id
      JOIN regions r ON r.id = p.region_id
      JOIN property_categories pc ON pc.id = p.category_id
      LEFT JOIN property_types pt ON pt.id = p.type_id
      LEFT JOIN LATERAL (
        SELECT thumbnail_url, url
        FROM property_images
        WHERE property_id = p.id AND is_primary = true
        ORDER BY sort_order ASC
        LIMIT 1
      ) pi ON true
      WHERE ${whereSql}
      ORDER BY ${orderSql}
      LIMIT ${params.limit}
      OFFSET ${offset}
    `,
  ]);

  const total = countRows[0]?.total ?? 0;

  return {
    data: rows.map(normalizeSearchRow),
    total,
    page: params.page,
    totalPages: Math.ceil(total / params.limit),
  };
}
