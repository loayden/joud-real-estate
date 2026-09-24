import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { rateLimit, verifyEmailRateLimit } from "@/lib/rate-limit";
import { verifyEmailSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid verification token", 400, "INVALID_TOKEN");
    }

    try {
      await rateLimit(verifyEmailRateLimit, `verify-email:${body.token}`);
    } catch {
      return apiError(
        "Too many requests. Please try again later.",
        429,
        "RATE_LIMITED",
      );
    }

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token: parsed.data.token,
        type: "email_verification",
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (
      !verificationToken ||
      verificationToken.usedAt ||
      verificationToken.expiresAt < new Date()
    ) {
      return apiError(
        "Verification token is invalid or expired",
        400,
        "INVALID_TOKEN",
      );
    }

    await prisma.$transaction([
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: {
          emailVerified: new Date(),
          status: "ACTIVE",
        },
      }),
    ]);

    return apiSuccess({ verified: true });
  } catch (error) {
    return handleApiError(error);
  }
}
