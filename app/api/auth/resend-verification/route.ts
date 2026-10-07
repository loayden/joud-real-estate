import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { generateToken } from "@/lib/auth-utils";
import {
  buildVerificationUrl,
  sendVerificationEmail,
  shouldExposeDevelopmentEmailLinks,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";
import {
  authRateLimit,
  checkRateLimit,
  getRateLimitIdentifier,
} from "@/lib/rate-limit";
import { emailSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  try {
    const identifier = getRateLimitIdentifier(req);
    const limit = await checkRateLimit(
      authRateLimit,
      `resend-verification:${identifier}`,
    );

    if (!limit.success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const body = await req.json();
    const parsed = emailSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid email address", 400, "VALIDATION_ERROR");
    }

    const { email, locale } = parsed.data;
    // Generic response either way so accounts cannot be enumerated.
    const genericMessage =
      locale === "ar"
        ? "إذا كان هذا البريد مسجلاً وغير مفعّل، أرسلنا رابط تفعيل جديد"
        : "If this email is registered and unverified, a new link was sent";

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        status: true,
        emailVerified: true,
        profile: { select: { firstName: true } },
      },
    });

    if (!user || user.emailVerified || user.status === "ACTIVE") {
      return apiSuccess({ message: genericMessage });
    }

    const existingToken = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        type: "email_verification",
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: { token: true },
    });

    let token = existingToken?.token;

    if (!token) {
      token = generateToken(32);
      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          token,
          type: "email_verification",
          expiresAt: addHours(new Date(), 24),
        },
      });
    }

    try {
      await sendVerificationEmail(
        email,
        token,
        locale,
        user.profile?.firstName ?? undefined,
      );
    } catch (emailError) {
      console.error("Resend verification email failed", {
        email,
        error: emailError instanceof Error ? emailError.message : emailError,
      });
    }

    return apiSuccess({
      message: genericMessage,
      ...(shouldExposeDevelopmentEmailLinks()
        ? { devVerificationUrl: buildVerificationUrl(token, locale) }
        : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
