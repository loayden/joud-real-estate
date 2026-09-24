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

const updateFeatureFlagSchema = z.object({
  key: z.string().min(2).max(100).optional(),
  isEnabled: z.boolean().optional(),
  description: z.string().max(1000).nullable().optional(),
});

function requestIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireRole(["SUPER_ADMIN"]);
    const existing = await prisma.featureFlag.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return apiError("Feature flag not found", 404, "NOT_FOUND");
    }

    const parsed = updateFeatureFlagSchema.safeParse(await req.json());

    if (!parsed.success) {
      return apiError("Invalid feature flag", 400, "VALIDATION_ERROR");
    }

    const nextKey = parsed.data.key
      ? normalizeFeatureFlagKey(parsed.data.key)
      : undefined;
    const flag = await prisma.featureFlag.update({
      where: { id: params.id },
      data: {
        ...(nextKey ? { key: nextKey } : {}),
        ...(parsed.data.isEnabled === undefined
          ? {}
          : { isEnabled: parsed.data.isEnabled }),
        ...(parsed.data.description === undefined
          ? {}
          : { description: parsed.data.description }),
      },
    });

    await Promise.all([
      bustFeatureFlagCache(existing.key),
      bustFeatureFlagCache(flag.key),
      logAudit({
        actorId: session.user.id,
        action: "UPDATE_FEATURE_FLAG",
        entity: "FeatureFlag",
        entityId: flag.id,
        ipAddress: requestIp(req),
        oldValues: existing,
        newValues: flag,
      }),
    ]);

    return apiSuccess(flag);
  } catch (error) {
    return handleApiError(error);
  }
}
