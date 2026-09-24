import { NextRequest } from "next/server";

import { clearCityCache, neighborhoodSchema } from "@/lib/admin-cms";
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
    const cityId = new URL(req.url).searchParams.get("cityId") ?? undefined;
    const neighborhoods = await prisma.neighborhood.findMany({
      where: cityId ? { cityId } : undefined,
      orderBy: [{ nameAr: "asc" }],
      include: { _count: { select: { properties: true } } },
    });

    return apiSuccess(neighborhoods);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const parsed = neighborhoodSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid neighborhood data", 400, "VALIDATION_ERROR");
    }

    const city = await prisma.city.findUnique({
      where: { id: parsed.data.cityId },
      select: { slug: true },
    });

    if (!city) {
      return apiError("City not found", 404, "CITY_NOT_FOUND");
    }

    const neighborhood = await prisma.neighborhood.create({
      data: parsed.data,
    });
    await clearCityCache(city.slug);
    await logAudit({
      actorId: session.user.id,
      action: "CREATE_NEIGHBORHOOD",
      entity: "Neighborhood",
      entityId: neighborhood.id,
      newValues: neighborhood,
      ipAddress: requestIp(req),
    });

    return apiSuccess(neighborhood, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
