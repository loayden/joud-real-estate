import { Resend } from "resend";

import { getBaseUrl } from "@/lib/base-url";
import { redis } from "@/lib/redis";

export type Locale = "ar" | "en";

export type EmailTemplateKey =
  | "welcome"
  | "verification"
  | "password-reset"
  | "inquiry-notification"
  | "property-approved"
  | "property-rejected";

export type RenderedEmail = {
  subject: string;
  html: string;
};

export type EmailTemplateDefinition = {
  key: EmailTemplateKey;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

type SendEmailInput = RenderedEmail & {
  to: string;
  throttleKey?: string;
};

type WelcomeEmailData = {
  firstName: string;
};

type VerificationEmailData = {
  firstName?: string;
  verifyUrl: string;
};

type PasswordResetEmailData = {
  firstName?: string;
  resetUrl: string;
};

type InquiryNotificationEmailData = {
  ownerName: string;
  inquirerName: string;
  propertyTitle: string;
  propertyUrl: string;
  message: string;
  inquirerPhone?: string | null;
  inquirerEmail?: string | null;
};

type PropertyApprovedEmailData = {
  ownerName: string;
  propertyTitle: string;
  propertyUrl: string;
};

type PropertyRejectedEmailData = {
  ownerName: string;
  propertyTitle: string;
  reason: string;
  editUrl: string;
};

type PriceDropAlertEmailData = {
  firstName?: string | null;
  propertyTitle: string;
  propertyUrl: string;
  previousPrice: number;
  currentPrice: number;
  currency: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const resend =
  resendApiKey && !resendApiKey.includes("xxx")
    ? new Resend(resendApiKey)
    : null;

export const emailTemplateDefinitions: EmailTemplateDefinition[] = [
  {
    key: "welcome",
    labelAr: "رسالة الترحيب",
    labelEn: "Welcome email",
    descriptionAr: "تصل للمستخدم بعد إنشاء الحساب.",
    descriptionEn: "Sent after account registration.",
  },
  {
    key: "verification",
    labelAr: "تفعيل البريد الإلكتروني",
    labelEn: "Email verification",
    descriptionAr: "تحتوي على رابط تفعيل صالح لمدة 24 ساعة.",
    descriptionEn: "Contains a verification link valid for 24 hours.",
  },
  {
    key: "password-reset",
    labelAr: "إعادة تعيين كلمة المرور",
    labelEn: "Password reset",
    descriptionAr: "تحتوي على رابط آمن لإعادة تعيين كلمة المرور.",
    descriptionEn: "Contains a secure password reset link.",
  },
  {
    key: "inquiry-notification",
    labelAr: "تنبيه استفسار جديد",
    labelEn: "New inquiry notification",
    descriptionAr: "تصل إلى مالك العقار عند استلام استفسار.",
    descriptionEn: "Sent to the property owner after receiving an inquiry.",
  },
  {
    key: "property-approved",
    labelAr: "اعتماد الإعلان",
    labelEn: "Property approved",
    descriptionAr: "تصل إلى المالك بعد اعتماد الإعلان ونشره.",
    descriptionEn: "Sent to the owner after a listing is approved.",
  },
  {
    key: "property-rejected",
    labelAr: "رفض الإعلان",
    labelEn: "Property rejected",
    descriptionAr: "تصل إلى المالك مع سبب الرفض وخطوة التعديل التالية.",
    descriptionEn: "Sent to the owner with the rejection reason.",
  },
];

const sampleEmailData = {
  firstName: "عبدالله",
  ownerName: "عبدالله العنزي",
  inquirerName: "سارة الشمري",
  propertyTitle: "فيلا حديثة للبيع في سكاكا",
  propertyUrl: `${getAppUrl()}/ar/property/villa-sakaka-demo`,
  verifyUrl: `${getAppUrl()}/ar/verify-email?token=preview-token`,
  resetUrl: `${getAppUrl()}/ar/reset-password?token=preview-token`,
  editUrl: `${getAppUrl()}/ar/my-listings/preview/edit`,
  message:
    "مرحباً، أود معرفة تفاصيل إضافية عن العقار وإمكانية تحديد موعد للزيارة خلال هذا الأسبوع.",
  reason:
    "يرجى إضافة صور أوضح للواجهة وتحديث وصف العقار ليشمل مساحة الأرض والخدمات القريبة.",
  inquirerPhone: "0551234567",
  inquirerEmail: "buyer@example.com",
};

export function getAppUrl() {
  return getBaseUrl();
}

export function isEmailDeliveryConfigured() {
  return resend !== null;
}

function isLocalAppUrl() {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/.test(
    getAppUrl(),
  );
}

export function shouldExposeDevelopmentEmailLinks() {
  return (
    !isEmailDeliveryConfigured() &&
    (process.env.NODE_ENV !== "production" || isLocalAppUrl())
  );
}

function normalizeLocale(locale: string | undefined | null): Locale {
  return locale === "en" ? "en" : "ar";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

export function buildVerificationUrl(token: string, locale: Locale = "ar") {
  return `${getAppUrl()}/${locale}/verify-email?token=${encodeURIComponent(token)}`;
}

export function buildPasswordResetUrl(token: string, locale: Locale = "ar") {
  return `${getAppUrl()}/${locale}/reset-password?token=${encodeURIComponent(token)}`;
}

function templateShell(locale: Locale, body: string) {
  const isArabic = locale === "ar";
  const direction = isArabic ? "rtl" : "ltr";
  const brand = isArabic ? "جود العقارية" : "Joud Real Estate";
  const footer = isArabic ? "جميع الحقوق محفوظة." : "All rights reserved.";

  return `<!DOCTYPE html>
<html dir="${direction}" lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>${brand}</title>
</head>
<body style="font-family:${isArabic ? "Tahoma,Arial,sans-serif" : "Arial,sans-serif"};background:#f4f6fb;margin:0;padding:20px;color:#0D2444;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5eaf2;">
    <div style="background:#1B4B8A;padding:24px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;line-height:1.4;">${brand}</h1>
    </div>
    <div style="padding:32px;line-height:1.8;font-size:16px;">${body}</div>
    <div style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;">
      © ${new Date().getFullYear()} ${brand}. ${footer}
    </div>
  </div>
</body>
</html>`;
}

function button(label: string, href: string) {
  return `<p style="margin:28px 0;"><a href="${escapeAttribute(href)}" style="display:inline-block;background:#1B4B8A;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:700;">${escapeHtml(label)}</a></p>`;
}

function muted(text: string) {
  return `<p style="margin:16px 0 0;color:#64748b;">${escapeHtml(text)}</p>`;
}

function detailBox(content: string, tone: "neutral" | "warning" = "neutral") {
  const style =
    tone === "warning"
      ? "background:#fff7ed;border:1px solid #fed7aa;"
      : "background:#f8fafc;border:1px solid #e5eaf2;";

  return `<div style="margin:20px 0;padding:16px;border-radius:6px;${style}">${content}</div>`;
}

function makeThrottleKey(action: string, recipient: string, subject: string) {
  return `${action}:${recipient}:${subject}`
    .toLowerCase()
    .replace(/[^a-z0-9@._:-]+/g, "-")
    .slice(0, 220);
}

async function isEmailCooldownActive(throttleKey?: string) {
  if (!throttleKey || !redis) {
    return false;
  }

  const key = `email:cooldown:${throttleKey}`;

  try {
    const existing = await redis.get(key);

    if (existing) {
      return true;
    }

    await redis.set(key, "1", { ex: 300 });
  } catch (error) {
    console.warn(`Email cooldown check failed for ${throttleKey}`, error);
  }

  return false;
}

async function sendEmail({ to, subject, html, throttleKey }: SendEmailInput) {
  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@joud.sa";
  const cooldownActive = await isEmailCooldownActive(throttleKey);

  if (cooldownActive) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`Email cooldown skipped: ${subject} -> ${to}`);
    }
    return;
  }

  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`Email skipped in development: ${subject} -> ${to}`);
    }
    return;
  }

  await resend.emails.send({
    from,
    to,
    subject,
    html,
  });
}

export function renderWelcomeEmail(
  data: WelcomeEmailData,
  locale: Locale = "ar",
): RenderedEmail {
  const isArabic = locale === "ar";
  const homeUrl = `${getAppUrl()}/${locale}`;
  const subject = isArabic
    ? "مرحباً بك في جود العقارية"
    : "Welcome to Joud Real Estate";
  const firstName = escapeHtml(data.firstName);
  const body = isArabic
    ? `<p style="margin:0 0 16px;">مرحباً ${firstName}،</p>
       <p style="margin:0 0 16px;">يسعدنا انضمامك إلى جود العقارية، منصة عقارية مصرية مصممة لمصر.</p>
       <p style="margin:0;">يمكنك الآن حفظ العقارات، إدارة إعلاناتك، واستقبال الاستفسارات من لوحة التحكم.</p>
       ${button("زيارة المنصة", homeUrl)}`
    : `<p style="margin:0 0 16px;">Hello ${firstName},</p>
       <p style="margin:0 0 16px;">Welcome to Joud Real Estate, an Egyptian real estate platform focused on Egypt.</p>
       <p style="margin:0;">You can now save properties, manage listings, and receive inquiries from your dashboard.</p>
       ${button("Visit platform", homeUrl)}`;

  return { subject, html: templateShell(locale, body) };
}

export function renderVerificationEmail(
  data: VerificationEmailData,
  locale: Locale = "ar",
): RenderedEmail {
  const isArabic = locale === "ar";
  const subject = isArabic
    ? "تفعيل بريدك الإلكتروني"
    : "Verify your email address";
  const greeting = data.firstName
    ? isArabic
      ? `مرحباً ${escapeHtml(data.firstName)}،`
      : `Hello ${escapeHtml(data.firstName)},`
    : isArabic
      ? "مرحباً،"
      : "Hello,";
  const body = isArabic
    ? `<p style="margin:0 0 16px;">${greeting}</p>
       <p style="margin:0;">اضغط على الزر التالي لتفعيل بريدك الإلكتروني في جود العقارية.</p>
       ${button("تفعيل البريد الإلكتروني", data.verifyUrl)}
       ${muted("هذا الرابط صالح لمدة 24 ساعة.")}`
    : `<p style="margin:0 0 16px;">${greeting}</p>
       <p style="margin:0;">Click the button below to verify your email address for Joud Real Estate.</p>
       ${button("Verify email", data.verifyUrl)}
       ${muted("This link expires in 24 hours.")}`;

  return { subject, html: templateShell(locale, body) };
}

export function renderPasswordResetEmail(
  data: PasswordResetEmailData,
  locale: Locale = "ar",
): RenderedEmail {
  const isArabic = locale === "ar";
  const subject = isArabic ? "إعادة تعيين كلمة المرور" : "Reset your password";
  const greeting = data.firstName
    ? isArabic
      ? `مرحباً ${escapeHtml(data.firstName)}،`
      : `Hello ${escapeHtml(data.firstName)},`
    : isArabic
      ? "مرحباً،"
      : "Hello,";
  const body = isArabic
    ? `<p style="margin:0 0 16px;">${greeting}</p>
       <p style="margin:0;">وصلنا طلب لإعادة تعيين كلمة مرور حسابك.</p>
       ${button("إعادة تعيين كلمة المرور", data.resetUrl)}
       ${muted("إذا لم تطلب ذلك، تجاهل هذا البريد.")}`
    : `<p style="margin:0 0 16px;">${greeting}</p>
       <p style="margin:0;">We received a request to reset your account password.</p>
       ${button("Reset password", data.resetUrl)}
       ${muted("If you did not request this, you can ignore this email.")}`;

  return { subject, html: templateShell(locale, body) };
}

export function renderInquiryNotificationEmail(
  data: InquiryNotificationEmailData,
  locale: Locale = "ar",
): RenderedEmail {
  const isArabic = locale === "ar";
  const subject = isArabic
    ? "استفسار جديد على عقارك"
    : "New inquiry on your property";
  const contactRows = [
    data.inquirerEmail
      ? `<p style="margin:0 0 8px;"><strong>${isArabic ? "البريد:" : "Email:"}</strong> ${escapeHtml(data.inquirerEmail)}</p>`
      : "",
    data.inquirerPhone
      ? `<p style="margin:0;"><strong>${isArabic ? "الجوال:" : "Phone:"}</strong> ${escapeHtml(data.inquirerPhone)}</p>`
      : "",
  ].join("");
  const messageBox = detailBox(escapeHtml(data.message));
  const body = isArabic
    ? `<p style="margin:0 0 16px;">مرحباً ${escapeHtml(data.ownerName)}،</p>
       <p style="margin:0 0 16px;">وصلك استفسار جديد على العقار: <strong>${escapeHtml(data.propertyTitle)}</strong></p>
       <p style="margin:0 0 8px;"><strong>المرسل:</strong> ${escapeHtml(data.inquirerName)}</p>
       ${contactRows}
       ${messageBox}
       ${button("عرض العقار", data.propertyUrl)}`
    : `<p style="margin:0 0 16px;">Hello ${escapeHtml(data.ownerName)},</p>
       <p style="margin:0 0 16px;">You received a new inquiry on: <strong>${escapeHtml(data.propertyTitle)}</strong></p>
       <p style="margin:0 0 8px;"><strong>Sender:</strong> ${escapeHtml(data.inquirerName)}</p>
       ${contactRows}
       ${messageBox}
       ${button("View property", data.propertyUrl)}`;

  return { subject, html: templateShell(locale, body) };
}

export function renderPropertyApprovedEmail(
  data: PropertyApprovedEmailData,
  locale: Locale = "ar",
): RenderedEmail {
  const isArabic = locale === "ar";
  const subject = isArabic
    ? "تم اعتماد إعلانك العقاري"
    : "Your property listing was approved";
  const body = isArabic
    ? `<p style="margin:0 0 16px;">مرحباً ${escapeHtml(data.ownerName)}،</p>
       <p style="margin:0 0 16px;">تم اعتماد إعلانك <strong>${escapeHtml(data.propertyTitle)}</strong> وأصبح ظاهراً للباحثين عن العقارات.</p>
       ${muted("يمكنك متابعة المشاهدات والاستفسارات من لوحة التحكم.")}
       ${button("عرض الإعلان", data.propertyUrl)}`
    : `<p style="margin:0 0 16px;">Hello ${escapeHtml(data.ownerName)},</p>
       <p style="margin:0 0 16px;">Your listing <strong>${escapeHtml(data.propertyTitle)}</strong> has been approved and is now visible to property seekers.</p>
       ${muted("You can track views and inquiries from your dashboard.")}
       ${button("View listing", data.propertyUrl)}`;

  return { subject, html: templateShell(locale, body) };
}

export function renderPropertyRejectedEmail(
  data: PropertyRejectedEmailData,
  locale: Locale = "ar",
): RenderedEmail {
  const isArabic = locale === "ar";
  const subject = isArabic
    ? "يحتاج إعلانك العقاري إلى تعديل"
    : "Your property listing needs changes";
  const reason = escapeHtml(data.reason);
  const reasonBox = detailBox(
    isArabic
      ? `<strong>سبب الرفض:</strong><br />${reason}`
      : `<strong>Rejection reason:</strong><br />${reason}`,
    "warning",
  );
  const body = isArabic
    ? `<p style="margin:0 0 16px;">مرحباً ${escapeHtml(data.ownerName)}،</p>
       <p style="margin:0;">راجعنا إعلانك <strong>${escapeHtml(data.propertyTitle)}</strong> ويحتاج إلى تعديل قبل النشر.</p>
       ${reasonBox}
       ${button("تعديل الإعلان وإرساله مجدداً", data.editUrl)}`
    : `<p style="margin:0 0 16px;">Hello ${escapeHtml(data.ownerName)},</p>
       <p style="margin:0;">We reviewed your listing <strong>${escapeHtml(data.propertyTitle)}</strong> and it needs changes before publishing.</p>
       ${reasonBox}
       ${button("Edit and resubmit", data.editUrl)}`;

  return { subject, html: templateShell(locale, body) };
}

export function isEmailTemplateKey(value: string): value is EmailTemplateKey {
  return emailTemplateDefinitions.some((template) => template.key === value);
}

export function renderEmailTemplatePreview(
  template: EmailTemplateKey,
  localeInput: string | undefined | null = "ar",
): RenderedEmail {
  const locale = normalizeLocale(localeInput);
  const localizedSample = {
    ...sampleEmailData,
    propertyUrl: `${getAppUrl()}/${locale}/property/villa-sakaka-demo`,
    verifyUrl: `${getAppUrl()}/${locale}/verify-email?token=preview-token`,
    resetUrl: `${getAppUrl()}/${locale}/reset-password?token=preview-token`,
    editUrl: `${getAppUrl()}/${locale}/my-listings/preview/edit`,
  };

  switch (template) {
    case "welcome":
      return renderWelcomeEmail(localizedSample, locale);
    case "verification":
      return renderVerificationEmail(localizedSample, locale);
    case "password-reset":
      return renderPasswordResetEmail(localizedSample, locale);
    case "inquiry-notification":
      return renderInquiryNotificationEmail(localizedSample, locale);
    case "property-approved":
      return renderPropertyApprovedEmail(localizedSample, locale);
    case "property-rejected":
      return renderPropertyRejectedEmail(localizedSample, locale);
  }
}

export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  locale: Locale = "ar",
) {
  const rendered = renderWelcomeEmail({ firstName }, locale);

  await sendEmail({
    to: email,
    ...rendered,
    throttleKey: makeThrottleKey("welcome", email, rendered.subject),
  });
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  locale: Locale = "ar",
) {
  const rendered = renderVerificationEmail(
    { verifyUrl: buildVerificationUrl(token, locale) },
    locale,
  );

  await sendEmail({
    to: email,
    ...rendered,
    throttleKey: makeThrottleKey("email-verification", email, rendered.subject),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  locale: Locale = "ar",
) {
  const rendered = renderPasswordResetEmail(
    { resetUrl: buildPasswordResetUrl(token, locale) },
    locale,
  );

  await sendEmail({
    to: email,
    ...rendered,
    throttleKey: makeThrottleKey("password-reset", email, rendered.subject),
  });
}

export async function sendInquiryNotificationEmail(
  email: string,
  data: InquiryNotificationEmailData,
  locale: Locale = "ar",
) {
  const rendered = renderInquiryNotificationEmail(data, locale);

  await sendEmail({
    to: email,
    ...rendered,
    throttleKey: makeThrottleKey(
      "inquiry-notification",
      email,
      data.propertyUrl,
    ),
  });
}

export async function sendPropertyApprovedEmail(
  email: string,
  data: PropertyApprovedEmailData,
  locale: Locale = "ar",
) {
  const rendered = renderPropertyApprovedEmail(data, locale);

  await sendEmail({
    to: email,
    ...rendered,
    throttleKey: makeThrottleKey("property-approved", email, data.propertyUrl),
  });
}

export async function sendPropertyRejectedEmail(
  email: string,
  data: PropertyRejectedEmailData,
  locale: Locale = "ar",
) {
  const rendered = renderPropertyRejectedEmail(data, locale);

  await sendEmail({
    to: email,
    ...rendered,
    throttleKey: makeThrottleKey("property-rejected", email, data.editUrl),
  });
}

export async function sendPriceDropAlertEmail(
  email: string,
  data: PriceDropAlertEmailData,
  locale: Locale = "ar",
) {
  const isArabic = locale === "ar";
  const formatter = new Intl.NumberFormat(isArabic ? "ar-EG" : "en-US", {
    currency: data.currency,
    maximumFractionDigits: 0,
    style: "currency",
  });
  const subject = isArabic
    ? "انخفض سعر عقار تتابعه"
    : "A tracked property dropped in price";
  const greeting = data.firstName
    ? isArabic
      ? `مرحباً ${escapeHtml(data.firstName)}،`
      : `Hello ${escapeHtml(data.firstName)},`
    : isArabic
      ? "مرحباً،"
      : "Hello,";
  const body = isArabic
    ? `<p style="margin:0 0 16px;">${greeting}</p>
       <p style="margin:0 0 16px;">انخفض سعر العقار <strong>${escapeHtml(data.propertyTitle)}</strong>.</p>
       ${detailBox(
         `<strong>السعر السابق:</strong> ${escapeHtml(formatter.format(data.previousPrice))}<br /><strong>السعر الحالي:</strong> ${escapeHtml(formatter.format(data.currentPrice))}`,
       )}
       ${button("عرض العقار", data.propertyUrl)}`
    : `<p style="margin:0 0 16px;">${greeting}</p>
       <p style="margin:0 0 16px;">The price dropped for <strong>${escapeHtml(data.propertyTitle)}</strong>.</p>
       ${detailBox(
         `<strong>Previous price:</strong> ${escapeHtml(formatter.format(data.previousPrice))}<br /><strong>Current price:</strong> ${escapeHtml(formatter.format(data.currentPrice))}`,
       )}
       ${button("View property", data.propertyUrl)}`;
  const rendered = { subject, html: templateShell(locale, body) };

  await sendEmail({
    to: email,
    ...rendered,
    throttleKey: makeThrottleKey("price-drop-alert", email, data.propertyUrl),
  });
}
