import { NextRequest } from "next/server";

import {
  clearRegionCache,
  getAdminGeography,
  regionSchema,
} from "@/lib/admin-cms";
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
    return apiSuccess(await getAdminGeography());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    const parsed = regionSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid region data", 400, "VALIDATION_ERROR");
    }

    const region = await prisma.region.create({ data: parsed.data });
    await clearRegionCache(region.slug);
    await logAudit({
      actorId: session.user.id,
      action: "CREATE_REGION",
      entity: "Region",
      entityId: region.id,
      newValues: region,
      ipAddress: requestIp(req),
    });

    return apiSuccess(region, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
