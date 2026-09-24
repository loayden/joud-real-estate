import type { NextRequest } from "next/server";
import { z } from "zod";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth-utils";
import {
  bustFeatureFlagCache,
  normalizeFeatureFlagKey,
} from "@/lib/feature-flags";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createFeatureFlagSchema = z.object({
  key: z.string().min(2).max(100),
  isEnabled: z.boolean().default(false),
  description: z.string().max(1000).optional(),
});

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function GET() {
  try {
    await requireRole(["SUPER_ADMIN"]);

    const flags = await prisma.featureFlag.findMany({
      orderBy: { key: "asc" },
    });

    return apiSuccess(flags);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["SUPER_ADMIN"]);
    const parsed = createFeatureFlagSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid feature flag", 400, "VALIDATION_ERROR");
    }

    const key = normalizeFeatureFlagKey(parsed.data.key);
    const flag = await prisma.featureFlag.create({
      data: {
        key,
        isEnabled: parsed.data.isEnabled,
        description: parsed.data.description,
      },
    });

    await Promise.all([
      bustFeatureFlagCache(key),
      logAudit({
        actorId: session.user.id,
        action: "CREATE_FEATURE_FLAG",
        entity: "FeatureFlag",
        entityId: flag.id,
        ipAddress: requestIp(req),
        newValues: flag,
      }),
    ]);

    return apiSuccess(flag, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
