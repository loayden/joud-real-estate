import { NextRequest } from "next/server";

import { amenitySchema, clearAmenityCache } from "@/lib/admin-cms";
import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const amenities = await prisma.amenity.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { nameAr: "asc" }],
      include: { _count: { select: { properties: true } } },
    });

    return apiSuccess(amenities);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const parsed = amenitySchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid amenity data", 400, "VALIDATION_ERROR");
    }

    const amenity = await prisma.amenity.create({ data: parsed.data });
    await clearAmenityCache();
    await logAudit({
      actorId: session.user.id,
      action: "CREATE_AMENITY",
      entity: "Amenity",
      entityId: amenity.id,
      newValues: amenity,
      ipAddress: requestIp(req),
    });

    return apiSuccess(amenity, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
