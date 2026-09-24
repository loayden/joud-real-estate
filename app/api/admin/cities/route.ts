import { NextRequest } from "next/server";

import { citySchema, clearRegionCache, serializeCity } from "@/lib/admin-cms";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const regionId = new URL(req.url).searchParams.get("regionId") ?? undefined;
    const cities = await prisma.city.findMany({
      where: regionId ? { regionId } : undefined,
      orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
      include: {
        _count: { select: { neighborhoods: true, properties: true } },
      },
    });

    return apiSuccess(cities.map(serializeCity));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const parsed = citySchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid city data", 400, "VALIDATION_ERROR");
    }

    const region = await prisma.region.findUnique({
      where: { id: parsed.data.regionId },
      select: { slug: true },
    });

    if (!region) {
      return apiError("Region not found", 404, "REGION_NOT_FOUND");
    }

    const city = await prisma.city.create({ data: parsed.data });
    await clearRegionCache(region.slug);
    await logAudit({
      actorId: session.user.id,
      action: "CREATE_CITY",
      entity: "City",
      entityId: city.id,
      newValues: city,
      ipAddress: requestIp(req),
    });

    return apiSuccess(city, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
