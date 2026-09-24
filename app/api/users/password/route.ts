import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, passwordChangeRateLimit } from "@/lib/rate-limit";
import { passwordChangeSchema } from "@/lib/validations/profile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(req: NextRequest) {
  try {
    const session = await requireSession();

    try {
      await rateLimit(
        passwordChangeRateLimit,
        `password-change:${session.user.id}`,
      );
    } catch {
      return apiError(
        "Too many requests. Please try again later.",
        429,
        "RATE_LIMITED",
      );
    }

    const body = await req.json();
    const parsed = passwordChangeSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid password data", 400, "VALIDATION_ERROR");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const passwordMatches = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return apiError("Current password is incorrect", 400, "INVALID_PASSWORD");
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          passwordHash,
          failedLoginCount: 0,
          lockedUntil: null,
        },
      }),
      prisma.userSession.deleteMany({
        where: { userId: session.user.id },
      }),
    ]);

    return apiSuccess({ changed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
