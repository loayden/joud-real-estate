import { NextRequest } from "next/server";

import { apiError, apiSuccess, handleApiError } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/auth-utils";
import { sendInquiryNotificationEmail } from "@/lib/email";
import { verifyHcaptchaToken } from "@/lib/hcaptcha";
import { getReceivedInquiries, parseInquiryStatus } from "@/lib/inquiries";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  inquiryRateLimit,
} from "@/lib/rate-limit";
import { sanitizeOptionalPlainText, sanitizePlainText } from "@/lib/sanitize";
import { inquiryCreateSchema } from "@/lib/validations/inquiry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function fullName(profile?: { firstName: string; lastName: string } | null) {
  return [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
}

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const status = parseInquiryStatus(
      new URL(req.url).searchParams.get("status"),
    );
    const inquiries = await getReceivedInquiries({
      userId: session.user.id,
      status,
    });

    return apiSuccess(inquiries);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const identifier = getRateLimitIdentifier(req);
    const limit = await checkRateLimit(inquiryRateLimit, identifier);

    if (!limit.success) {
      return apiError("Too many requests", 429, "RATE_LIMITED");
    }

    const body = await req.json();
    const parsed = inquiryCreateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid inquiry data", 400, "VALIDATION_ERROR");
    }

    await verifyHcaptchaToken(parsed.data.hcaptchaToken, identifier);

    const sanitized = {
      ...parsed.data,
      message: sanitizePlainText(parsed.data.message),
      name: sanitizeOptionalPlainText(parsed.data.name),
      phone: sanitizeOptionalPlainText(parsed.data.phone),
    };
    const sanitizedParsed = inquiryCreateSchema.safeParse(sanitized);

    if (!sanitizedParsed.success) {
      return apiError("Invalid inquiry data", 400, "VALIDATION_ERROR");
    }

    const input = sanitizedParsed.data;
    const session = await auth();
    const senderPromise = session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            id: true,
            email: true,
            phone: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                whatsapp: true,
              },
            },
          },
        })
      : Promise.resolve(null);
    const propertyPromise = prisma.property.findUnique({
      where: { id: input.propertyId },
      select: {
        id: true,
        slug: true,
        titleAr: true,
        titleEn: true,
        status: true,
        userId: true,
        user: {
          select: {
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                preferredLocale: true,
              },
            },
          },
        },
      },
    });

    const [sender, property] = await Promise.all([
      senderPromise,
      propertyPromise,
    ]);

    if (!property || property.status !== "APPROVED") {
      return apiError("Property not found", 404, "NOT_FOUND");
    }

    if (sender?.id === property.userId) {
      return apiError(
        "Property owners cannot inquire about their own listing",
        400,
        "OWNER_INQUIRY_NOT_ALLOWED",
      );
    }

    if (!sender && !input.name && !input.email && !input.phone) {
      return apiError(
        "Guest inquiries require a name, email, or phone number",
        400,
        "CONTACT_REQUIRED",
      );
    }

    const inquiry = await prisma.$transaction(async (tx) => {
      const created = await tx.inquiry.create({
        data: {
          propertyId: property.id,
          senderId: sender?.id,
          ownerUserId: property.userId,
          guestName: sender ? null : input.name,
          guestEmail: sender ? null : input.email,
          guestPhone: sender ? null : input.phone,
          message: input.message,
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      });

      await tx.property.update({
        where: { id: property.id },
        data: { inquiryCount: { increment: 1 } },
      });

      return created;
    });

    const ownerName = fullName(property.user.profile) || "جود العقارية";
    const inquirerName =
      fullName(sender?.profile) ||
      input.name ||
      (input.locale === "ar" ? "زائر" : "Guest");
    const inquirerEmail = sender?.email ?? input.email ?? null;
    const inquirerPhone =
      sender?.phone ?? sender?.profile?.whatsapp ?? input.phone ?? null;
    const propertyTitle =
      input.locale === "ar" || !property.titleEn
        ? property.titleAr
        : property.titleEn;

    try {
      await sendInquiryNotificationEmail(
        property.user.email,
        {
          ownerName,
          inquirerName,
          propertyTitle,
          propertyUrl: `${getAppUrl()}/${input.locale}/property/${property.slug}`,
          message: input.message,
          inquirerEmail,
          inquirerPhone,
        },
        property.user.profile?.preferredLocale === "en" ? "en" : "ar",
      );
    } catch (emailError) {
      console.warn("Inquiry notification email failed", emailError);
    }

    return apiSuccess(
      {
        id: inquiry.id,
        status: inquiry.status,
        createdAt: inquiry.createdAt.toISOString(),
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
