"use client";

import { Loader2, Mail, MessageCircle, Phone, UserRound } from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { CaptchaWidget } from "@/components/shared/HCaptcha";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/routing";
import { apiFetch } from "@/lib/api-client";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

type Owner = {
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
};

const copy = {
  ar: {
    owner: "مالك العقار",
    ownerDescription: "تواصل مباشرة مع صاحب الإعلان.",
    revealPhone: "إظهار الرقم",
    whatsapp: "واتساب",
    noPhone: "لم يضف المالك رقم تواصل بعد.",
    inquiry: "إرسال استفسار",
    inquiryDescription: "اكتب رسالتك وسيصل التنبيه إلى مالك العقار.",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "رقم الجوال",
    message: "رسالتك",
    messagePlaceholder: "أرغب في الاستفسار عن هذا العقار...",
    submit: "إرسال الاستفسار",
    submitting: "جار الإرسال",
    success: "تم إرسال الاستفسار بنجاح.",
    genericError: "تعذر إرسال الاستفسار. حاول مرة أخرى.",
    captchaRequired: "يرجى إكمال التحقق الأمني.",
  },
  en: {
    owner: "Property owner",
    ownerDescription: "Contact the listing owner directly.",
    revealPhone: "Show phone",
    whatsapp: "WhatsApp",
    noPhone: "The owner has not added a contact number yet.",
    inquiry: "Send inquiry",
    inquiryDescription: "Write your message and the owner will be notified.",
    name: "Name",
    email: "Email",
    phone: "Phone",
    message: "Message",
    messagePlaceholder: "I would like to ask about this property...",
    submit: "Send inquiry",
    submitting: "Sending",
    success: "Inquiry sent successfully.",
    genericError: "Could not send inquiry. Please try again.",
    captchaRequired: "Complete the security verification.",
  },
} as const;

function normalizeEgyptianWhatsapp(value: string | null) {
  if (!value) return null;

  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0020")) return digits.slice(2);
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  if (digits.length <= 10) return `20${digits}`;
  return digits;
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const tail = digits.slice(-4);
  return `••• ••• ${tail}`;
}

export function PropertyContactPanel({
  locale,
  owner,
  propertyId,
  propertyTitle,
  propertyUrl,
}: {
  locale: Locale;
  owner: Owner;
  propertyId: string;
  propertyTitle: string;
  propertyUrl: string;
}) {
  const text = copy[locale];
  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const isUsableKey = (value: string | undefined) =>
    Boolean(value && !value.includes("xxx") && !value.includes("test"));
  const shouldUseCaptcha =
    isUsableKey(hcaptchaSiteKey) || isUsableKey(turnstileSiteKey);
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (result?.type === "success") {
      const timer = setTimeout(() => setResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [result]);
  const contactPhone = owner.whatsapp ?? owner.phone;
  const whatsappNumber = normalizeEgyptianWhatsapp(contactPhone);
  const whatsappHref = useMemo(() => {
    if (!whatsappNumber) return null;

    const message =
      locale === "ar"
        ? `أهلاً، أريد الاستفسار عن عقارك على جود العقارية: ${propertyUrl}`
        : `Hello, I would like to ask about your listing on Joud Real Estate: ${propertyUrl}`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }, [locale, propertyUrl, whatsappNumber]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (shouldUseCaptcha && !captchaToken) {
      setResult({ message: text.captchaRequired, type: "error" });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiFetch("/api/inquiries", {
        body: JSON.stringify({
          propertyId,
          locale,
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          message: formData.get("message"),
          ...(captchaToken ? { hcaptchaToken: captchaToken } : {}),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as ApiResponse<{ id: string }>;

      if (!response.ok || !payload || !payload.success) {
        setResult({
          message:
            payload && "error" in payload ? payload.error : text.genericError,
          type: "error",
        });
        setCaptchaToken(null);
        setCaptchaResetSignal((value) => value + 1);
        return;
      }

      form.reset();
      setCaptchaToken(null);
      setCaptchaResetSignal((value) => value + 1);
      setResult({ message: text.success, type: "success" });
    } catch {
      setResult({ message: text.genericError, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{text.owner}</CardTitle>
          <CardDescription>{text.ownerDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-3">
            <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-50 text-primary">
              {owner.avatarUrl ? (
                <Image
                  alt={owner.name}
                  className="object-cover"
                  fill
                  sizes="56px"
                  src={owner.avatarUrl}
                />
              ) : (
                <UserRound className="size-6" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-foreground">{owner.name}</p>
              {owner.phone ? (
                <p className="text-sm font-semibold text-muted-foreground">
                  {isPhoneVisible ? owner.phone : maskPhone(owner.phone)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{text.noPhone}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {owner.phone ? (
              <Button
                onClick={() => setIsPhoneVisible(true)}
                type="button"
                variant="secondary"
              >
                <Phone className="size-4" />
                {text.revealPhone}
              </Button>
            ) : null}
            {whatsappHref ? (
              <Button asChild>
                <a href={whatsappHref} rel="noreferrer" target="_blank">
                  <MessageCircle className="size-4" />
                  {text.whatsapp}
                </a>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{text.inquiry}</CardTitle>
          <CardDescription>{text.inquiryDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            {result ? (
              <Alert
                variant={result.type === "success" ? "success" : "destructive"}
              >
                {result.message}
              </Alert>
            ) : null}
            <input name="propertyTitle" type="hidden" value={propertyTitle} />
            <div className="grid gap-2">
              <Label htmlFor="inquiry-name">{text.name}</Label>
              <Input
                autoComplete="name"
                id="inquiry-name"
                name="name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inquiry-email">{text.email}</Label>
              <Input
                autoComplete="email"
                id="inquiry-email"
                inputMode="email"
                name="email"
                required
                type="email"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inquiry-phone">{text.phone}</Label>
              <Input
                autoComplete="tel"
                id="inquiry-phone"
                inputMode="tel"
                name="phone"
                pattern="[0-9+\s()-]{7,20}"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inquiry-message">{text.message}</Label>
              <Textarea
                id="inquiry-message"
                minLength={10}
                name="message"
                placeholder={text.messagePlaceholder}
                required
                rows={5}
              />
            </div>
            {shouldUseCaptcha ? (
              <CaptchaWidget
                locale={locale}
                onExpire={() => setCaptchaToken(null)}
                onVerify={setCaptchaToken}
                resetSignal={captchaResetSignal}
              />
            ) : null}
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {text.submitting}
                </>
              ) : (
                <>
                  <Mail className="size-4" />
                  {text.submit}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
