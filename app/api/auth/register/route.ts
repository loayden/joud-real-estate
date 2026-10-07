import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { generateToken } from "@/lib/auth-utils";
import {
  buildVerificationUrl,
  sendVerificationEmail,
  sendWelcomeEmail,
  shouldExposeDevelopmentEmailLinks,
} from "@/lib/email";
import { verifyCaptchaToken } from "@/lib/captcha";
import { prisma } from "@/lib/prisma";
import {
  authRateLimit,
  checkRateLimit,
  getRateLimitIdentifier,
} from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  try {
    const identifier = getRateLimitIdentifier(req);
    const limit = await checkRateLimit(authRateLimit, `register:${identifier}`);

    if (!limit.success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid registration data", 400, "VALIDATION_ERROR");
    }

    await verifyCaptchaToken(parsed.data.hcaptchaToken, identifier);

    const { email, password, firstName, lastName, phone, locale } = parsed.data;
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])],
      },
      select: { email: true, phone: true },
    });

    if (existingUser?.email === email) {
      return apiError("Email is already registered", 409, "EMAIL_EXISTS");
    }

    if (phone && existingUser?.phone === phone) {
      return apiError("Phone is already registered", 409, "PHONE_EXISTS");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const token = generateToken(32);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          phone,
          passwordHash,
          status: "PENDING_VERIFICATION",
          profile: {
            create: {
              firstName,
              lastName,
              preferredLocale: locale,
            },
          },
        },
        select: { id: true },
      });

      await tx.verificationToken.create({
        data: {
          userId: user.id,
          token,
          type: "email_verification",
          expiresAt: addHours(new Date(), 24),
        },
      });
    });

    // Email delivery must never fail registration: the account and token
    // are already committed above, and the user can resend the link.
    try {
      await Promise.all([
        sendVerificationEmail(email, token, locale, firstName),
        sendWelcomeEmail(email, firstName, locale),
      ]);
    } catch (emailError) {
      console.error("Registration email delivery failed", {
        email,
        error: emailError instanceof Error ? emailError.message : emailError,
      });
    }

    return apiSuccess(
      {
        message:
          locale === "ar"
            ? "تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتفعيل الحساب"
            : "Account created. Check your email to verify your account",
        ...(shouldExposeDevelopmentEmailLinks()
          ? { devVerificationUrl: buildVerificationUrl(token, locale) }
          : {}),
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
