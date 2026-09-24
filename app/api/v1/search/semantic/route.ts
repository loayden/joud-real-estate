import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { publicSearchCacheKey } from "@/lib/public-properties";
import { normalizeSearchParams, searchProperties } from "@/lib/property-search";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  searchRateLimit,
} from "@/lib/rate-limit";
import { getCached } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ParsedFilters = {
  q?: string;
  listingType?: "SALE" | "RENT";
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  maxArea?: string;
  bedrooms?: string;
  bathrooms?: string;
  citySlug?: string;
  categoryId?: string;
};

const AREA_ALIASES: Record<string, string> = {
  "new cairo": "new-cairo",
  "القاهرة الجديدة": "new-cairo",
  "cairo new": "new-cairo",
  العاصمة: "new-administrative-capital",
  capital: "new-administrative-capital",
  "العاصمة الإدارية": "new-administrative-capital",
  "new capital": "new-administrative-capital",
  "sheikh zayed": "sheikh-zayed",
  "الشيخ زايد": "sheikh-zayed",
  زايد: "sheikh-zayed",
  zayed: "sheikh-zayed",
  october: "6th-october",
  "6 october": "6th-october",
  "6 اكتوبر": "6th-october",
  "6 أكتوبر": "6th-october",
  اكتوبر: "6th-october",
  heliopolis: "heliopolis",
  "مصر الجديدة": "heliopolis",
  maadi: "maadi",
  المعادي: "maadi",
  nasr: "nasr-city",
  "مدينة نصر": "nasr-city",
  "nasr city": "nasr-city",
  "city stars": "nasr-city",
  dokki: "dokki",
  الدقي: "dokki",
  mohandessin: "mohandessin",
  المهندسين: "mohandessin",
  zamalek: "zamalek",
  الزمالك: "zamalek",
  downtown: "downtown-cairo",
  "وسط البلد": "downtown-cairo",
  "north coast": "north-coast",
  الساحل: "north-coast",
  "الساحل الشمالي": "north-coast",
  sahel: "north-coast",
  sokhna: "ain-sokhna",
  "العين السخنة": "ain-sokhna",
  "ain sokhna": "ain-sokhna",
  giza: "giza",
  الجيزة: "giza",
  cairo: "cairo",
  القاهرة: "cairo",
  alexandria: "alexandria",
  الإسكندرية: "alexandria",
  الاسكندرية: "alexandria",
  shubra: "shubra",
  شبرا: "shubra",
  shoubra: "shubra",
  tagamoa: "fifth-settlement",
  التجمع: "fifth-settlement",
  "التجمع الخامس": "fifth-settlement",
  "fifth settlement": "fifth-settlement",
  rehab: "rehab-city",
  ميامى: "miami",
  miami: "miami",
};

const CATEGORY_ALIASES: Record<string, string> = {
  شقة: "apartment",
  شقق: "apartment",
  apartment: "apartment",
  apartments: "apartment",
  فيلا: "villa",
  فلل: "villa",
  villa: "villa",
  villas: "villa",
  دوبلكس: "duplex",
  duplex: "duplex",
  استوديو: "studio",
  studio: "studio",
  بنتهاوس: "penthouse",
  penthouse: "penthouse",
  "تاون هاوس": "townhouse",
  townhouse: "townhouse",
  مكتب: "office",
  office: "office",
  محل: "shop",
  shop: "shop",
  "محل تجاري": "shop",
  أرض: "residential-land",
  ارض: "residential-land",
  land: "residential-land",
  أراضي: "residential-land",
  kompaound: "compound",
  كومباوند: "compound",
  compound: "compound",
  كمبوند: "compound",
};

function parseNaturalLanguage(query: string): ParsedFilters {
  const lower = query.toLowerCase().trim();
  const filters: ParsedFilters = {};

  if (
    lower.includes("بيع") ||
    lower.includes("للبيع") ||
    lower.includes("for sale") ||
    lower.includes("يشتري")
  ) {
    filters.listingType = "SALE";
  } else if (
    lower.includes("ايجار") ||
    lower.includes("إيجار") ||
    lower.includes("for rent") ||
    lower.includes("يستأجر") ||
    lower.includes("rent")
  ) {
    filters.listingType = "RENT";
  }

  const bedroomPatterns = [
    /(\d+)\s*(?:room|غرف|غفة|bedroom|br|bed|房间)/i,
    /(?:بـ|في)\s*(\d+)\s*(?:room|غرف)/i,
    /(\d+)\s*(?:اوض|أوض)/i,
  ];
  for (const pattern of bedroomPatterns) {
    const match = lower.match(pattern);
    if (match) {
      filters.bedrooms = match[1];
      break;
    }
  }

  const pricePatterns = [
    /(?:أقل من|under|less than|below|تحت)\s*(\d[\d,.]*)\s*(?:جنيه|ج\.م|egp|pound|égyptien)?/i,
    /(?: أكثر من|over|more than|above|فوق|أعلى من)\s*(\d[\d,.]*)\s*(?:جنيه|ج\.م|egp|pound)?/i,
    /(?:بين|between)\s*(\d[\d,.]*)\s*(?:و|and|-)\s*(\d[\d,.]*)\s*(?:جنيه|ج\.م|egp|pound)?/i,
    /(\d[\d,.]*)\s*(?:جنيه|ج\.م|egp)/i,
    /(?:price|سعر)\s*(?:أقل|under|below)\s*(\d[\d,.]*)/i,
    /(?:price|سعر)\s*(?:أكثر|over|above)\s*(\d[\d,.]*)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = lower.match(pattern);
    if (match) {
      if (
        pattern.source.includes("أقل") ||
        pattern.source.includes("under") ||
        pattern.source.includes("less") ||
        pattern.source.includes("below") ||
        pattern.source.includes("تحت")
      ) {
        filters.maxPrice = match[1].replace(/[,\.]/g, "");
      } else if (
        pattern.source.includes("أكثر") ||
        pattern.source.includes("over") ||
        pattern.source.includes("more") ||
        pattern.source.includes("above") ||
        pattern.source.includes("فوق") ||
        pattern.source.includes("أعلى")
      ) {
        filters.minPrice = match[1].replace(/[,\.]/g, "");
      } else if (match[2]) {
        filters.minPrice = match[1].replace(/[,\.]/g, "");
        filters.maxPrice = match[2].replace(/[,\.]/g, "");
      } else {
        const val = match[1].replace(/[,\.]/g, "");
        if (Number(val) < 5000000) {
          filters.maxPrice = val;
        } else {
          filters.minPrice = val;
        }
      }
      break;
    }
  }

  const areaPatterns = [
    /(\d+)\s*(?:م\.?|sqm|متر|meter|m²)/i,
    /(?:مساحة|area)\s*(\d+)/i,
    /(?:أقل من|under|less than)\s*(\d+)\s*(?:م\.?|sqm|متر)/i,
    /(?:أكثر من|over|more than)\s*(\d+)\s*(?:م\.?|sqm|متر)/i,
  ];

  for (const pattern of areaPatterns) {
    const match = lower.match(pattern);
    if (match) {
      const val = match[1];
      if (
        pattern.source.includes("أقل") ||
        pattern.source.includes("under") ||
        pattern.source.includes("less")
      ) {
        filters.maxArea = val;
      } else if (
        pattern.source.includes("أكثر") ||
        pattern.source.includes("over") ||
        pattern.source.includes("more")
      ) {
        filters.minArea = val;
      } else {
        filters.minArea = val;
      }
      break;
    }
  }

  for (const [alias, slug] of Object.entries(AREA_ALIASES)) {
    if (lower.includes(alias)) {
      filters.citySlug = slug;
      break;
    }
  }

  for (const alias of Object.keys(CATEGORY_ALIASES)) {
    if (lower.includes(alias)) {
      filters.q = alias;
      break;
    }
  }

  const stopWords = new Set([
    "في",
    "احدث",
    "أحدث",
    "عقارات",
    "-property",
    "properties",
    "أفضل",
    "best",
    "找",
    "个",
    "的",
    "我想",
    "i want",
    "i need",
    "looking for",
    "بتدور",
    "بتبحث",
    "عايز",
    "al",
  ]);
  const words = lower
    .split(/\s+/)
    .filter((w) => !stopWords.has(w) && w.length > 1 && !/^\d+$/.test(w));

  if (!filters.q && words.length > 0 && !filters.citySlug) {
    filters.q = words.join(" ");
  }

  return filters;
}

export async function GET(req: NextRequest) {
  try {
    const identifier = getRateLimitIdentifier(req);
    const { success } = await checkRateLimit(searchRateLimit, identifier);

    if (!success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const url = new URL(req.url);
    const query =
      url.searchParams.get("q") ?? url.searchParams.get("query") ?? "";

    if (!query.trim()) {
      return apiError("Please provide a search query", 400, "VALIDATION_ERROR");
    }

    const parsed = parseNaturalLanguage(query);

    const searchParamsObj: Record<string, string> = {};
    if (parsed.q) searchParamsObj.q = parsed.q;
    if (parsed.listingType) searchParamsObj.listingType = parsed.listingType;
    if (parsed.minPrice) searchParamsObj.minPrice = parsed.minPrice;
    if (parsed.maxPrice) searchParamsObj.maxPrice = parsed.maxPrice;
    if (parsed.minArea) searchParamsObj.minArea = parsed.minArea;
    if (parsed.maxArea) searchParamsObj.maxArea = parsed.maxArea;
    if (parsed.bedrooms) searchParamsObj.bedrooms = parsed.bedrooms;
    if (parsed.bathrooms) searchParamsObj.bathrooms = parsed.bathrooms;
    if (parsed.citySlug) searchParamsObj.citySlug = parsed.citySlug;

    searchParamsObj.page = "1";
    searchParamsObj.limit = "20";

    const params = normalizeSearchParams(searchParamsObj);

    if (!params) {
      return apiError("Could not parse search query", 400, "VALIDATION_ERROR");
    }

    const results = await getCached(
      await publicSearchCacheKey(params),
      () => searchProperties(params),
      300,
    );

    return apiSuccess({
      query,
      parsedFilters: parsed,
      ...results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
