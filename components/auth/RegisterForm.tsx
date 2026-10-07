"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

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
import { Link, type Locale } from "@/i18n/routing";
import { registerSchema } from "@/lib/validations/auth";
import { useCsrfToken } from "@/hooks/useCsrfToken";

type RegisterFormValues = z.input<typeof registerSchema>;

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

const copy = {
  ar: {
    title: "إنشاء حساب جديد",
    description: "سجل حسابك لبدء إضافة العقارات وإدارة الاستفسارات.",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    phone: "رقم الجوال",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    submit: "إنشاء الحساب",
    loading: "جار إنشاء الحساب",
    hasAccount: "لديك حساب بالفعل؟",
    login: "تسجيل الدخول",
    verifyNow: "تفعيل البريد الآن",
    developmentLink:
      "رابط التفعيل ظاهر هنا لأن إرسال البريد غير مفعّل في بيئة التطوير.",
    success:
      "تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتفعيل الحساب قبل تسجيل الدخول.",
    emailUnavailable:
      "تم إنشاء الحساب، لكن تعذّر إرسال بريد التفعيل. يمكنك طلب رابط جديد من صفحة تسجيل الدخول.",
    genericError: "تعذر إنشاء الحساب. حاول مرة أخرى.",
    captchaRequired: "يرجى إكمال التحقق الأمني.",
  },
  en: {
    title: "Create Account",
    description: "Create your account to list properties and manage inquiries.",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    email: "Email",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submit: "Create account",
    loading: "Creating account",
    hasAccount: "Already have an account?",
    login: "Login",
    verifyNow: "Verify email now",
    developmentLink:
      "This verification link is shown because email delivery is disabled in development.",
    success:
      "Account created. Check your email to verify the account before logging in.",
    emailUnavailable:
      "Account created, but the verification email could not be sent. You can request a new link from the login page.",
    genericError: "Could not create the account. Please try again.",
    captchaRequired: "Complete the security verification.",
  },
} as const;

export function RegisterForm({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const hcaptchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const isUsableKey = (value: string | undefined) =>
    Boolean(value && !value.includes("xxx") && !value.includes("test"));
  const shouldUseCaptcha =
    isUsableKey(hcaptchaSiteKey) || isUsableKey(turnstileSiteKey);
  const { token: csrfToken } = useCsrfToken();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [devVerificationUrl, setDevVerificationUrl] = useState<string | null>(
    null,
  );
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      locale,
      hcaptchaToken: undefined,
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    setDevVerificationUrl(null);

    if (shouldUseCaptcha && !captchaToken) {
      setServerError(text.captchaRequired);
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken || "",
      },
      body: JSON.stringify({
        ...values,
        hcaptchaToken: captchaToken ?? values.hcaptchaToken,
        locale,
      }),
    });
    const payload = (await response.json()) as ApiResponse<{
      message: string;
      emailSent?: boolean;
      devVerificationUrl?: string;
    }>;

    if (!response.ok || !payload.success) {
      setServerError(payload.success ? text.genericError : payload.error);
      setCaptchaToken(null);
      setCaptchaResetSignal((value) => value + 1);
      setValue("hcaptchaToken", undefined);
      return;
    }

    setDevVerificationUrl(payload.data.devVerificationUrl ?? null);
    setEmailSent(payload.data.emailSent ?? false);
    setIsComplete(true);
    window.dispatchEvent(new CustomEvent("joud:session-changed"));
  }

  if (isComplete) {
    return (
      <Card className="w-full rounded-2xl shadow-lift">
        <CardHeader>
          <CardTitle>{text.title}</CardTitle>
          <CardDescription>{text.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <Alert variant={emailSent ? "success" : "warning"}>
            <div className="grid gap-3">
              <p>{emailSent ? text.success : text.emailUnavailable}</p>
              {devVerificationUrl ? (
                <div className="grid gap-2">
                  <p className="text-xs opacity-80">{text.developmentLink}</p>
                  <Button
                    asChild
                    className="w-full"
                    size="sm"
                    variant="secondary"
                  >
                    <a href={devVerificationUrl}>{text.verifyNow}</a>
                  </Button>
                </div>
              ) : null}
            </div>
          </Alert>
          <Button asChild className="w-full">
            <Link href="/login">{text.login}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full rounded-2xl shadow-lift">
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5"
          method="post"
          onSubmit={handleSubmit(onSubmit)}
        >
          {serverError ? (
            <Alert variant="destructive">{serverError}</Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">{text.firstName}</Label>
              <Input
                autoComplete="given-name"
                id="firstName"
                {...register("firstName")}
              />
              {errors.firstName ? (
                <p className="text-sm font-medium text-destructive">
                  {errors.firstName.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lastName">{text.lastName}</Label>
              <Input
                autoComplete="family-name"
                id="lastName"
                {...register("lastName")}
              />
              {errors.lastName ? (
                <p className="text-sm font-medium text-destructive">
                  {errors.lastName.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">{text.phone}</Label>
            <Input
              autoComplete="tel"
              id="phone"
              inputMode="tel"
              {...register("phone")}
            />
            {errors.phone ? (
              <p className="text-sm font-medium text-destructive">
                {errors.phone.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">{text.email}</Label>
            <Input
              autoComplete="email"
              id="email"
              inputMode="email"
              type="email"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm font-medium text-destructive">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">{text.password}</Label>
            <div className="relative">
              <Input
                autoComplete="new-password"
                id="password"
                type={showPassword ? "text" : "password"}
                className="pe-12"
                {...register("password")}
              />
              <button
                type="button"
                aria-label={
                  showPassword ? text.hidePassword : text.showPassword
                }
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute end-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p className="text-sm font-medium text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {shouldUseCaptcha ? (
            <CaptchaWidget
              locale={locale}
              onExpire={() => {
                setCaptchaToken(null);
                setValue("hcaptchaToken", undefined);
              }}
              onVerify={(token) => {
                setCaptchaToken(token);
                setValue("hcaptchaToken", token, { shouldValidate: true });
              }}
              resetSignal={captchaResetSignal}
            />
          ) : null}

          <Button
            className="h-12 w-full rounded-xl"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {text.loading}
              </>
            ) : (
              text.submit
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {text.hasAccount}{" "}
            <Link
              className="font-semibold text-primary hover:text-primary-700"
              href="/login"
            >
              {text.login}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
