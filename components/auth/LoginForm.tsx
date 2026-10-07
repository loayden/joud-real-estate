"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useCsrfToken } from "@/hooks/useCsrfToken";

type ApiResponse<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      code?: string;
      details?: { devVerificationUrl?: string };
    };

const copy = {
  ar: {
    title: "تسجيل الدخول",
    description: "ادخل إلى حسابك لإدارة عقاراتك واستفساراتك.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    submit: "تسجيل الدخول",
    loading: "جار تسجيل الدخول",
    forgot: "نسيت كلمة المرور؟",
    noAccount: "ليس لديك حساب؟",
    register: "إنشاء حساب",
    verifyNow: "تفعيل البريد الآن",
    developmentLink:
      "رابط التفعيل ظاهر هنا لأن إرسال البريد غير مفعّل في بيئة التطوير.",
    genericError: "تعذر تسجيل الدخول. حاول مرة أخرى.",
    resend: "إرسال رابط تفعيل جديد",
    resending: "جار إرسال الرابط",
    resent: "أرسلنا رابط تفعيل جديد إلى بريدك.",
    resendError: "تعذر إرسال الرابط. حاول مرة أخرى.",
  },
  en: {
    title: "Login",
    description: "Access your account to manage listings and inquiries.",
    email: "Email",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submit: "Login",
    loading: "Logging in",
    forgot: "Forgot password?",
    noAccount: "No account?",
    register: "Create account",
    verifyNow: "Verify email now",
    developmentLink:
      "This verification link is shown because email delivery is disabled in development.",
    genericError: "Could not log in. Please try again.",
    resend: "Send a new verification link",
    resending: "Sending link",
    resent: "A new verification link was sent to your email.",
    resendError: "Could not send the link. Please try again.",
  },
} as const;

export function LoginForm({
  locale,
  callbackUrl,
}: {
  locale: Locale;
  callbackUrl?: string;
}) {
  const text = copy[locale];
  const router = useRouter();
  const { token: csrfToken } = useCsrfToken();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverCode, setServerCode] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [devVerificationUrl, setDevVerificationUrl] = useState<string | null>(
    null,
  );
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    getValues,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    setServerCode(null);
    setResendNotice(null);
    setDevVerificationUrl(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken || "",
      },
      body: JSON.stringify({ ...values, callbackUrl, locale }),
    });
    const payload = (await response.json()) as ApiResponse<{
      redirectTo?: string;
    }>;

    if (!response.ok || !payload.success) {
      setServerError(payload.success ? text.genericError : payload.error);
      setServerCode(payload.success ? null : (payload.code ?? null));
      setDevVerificationUrl(
        payload.success ? null : (payload.details?.devVerificationUrl ?? null),
      );
      return;
    }

    router.push(payload.data.redirectTo ?? `/${locale}/dashboard`);
    router.refresh();
    window.dispatchEvent(new CustomEvent("joud:session-changed"));
  }

  async function handleResend() {
    const email = getValues("email").trim();
    if (!email || isResending) return;
    setIsResending(true);
    setResendNotice(null);
    setDevVerificationUrl(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const payload = (await response.json()) as ApiResponse<{
        message: string;
      }> & { details?: { devVerificationUrl?: string } };

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? text.resendError : payload.error);
      }

      setResendNotice({ type: "success", message: text.resent });
      const devUrl =
        "details" in payload
          ? (payload.details?.devVerificationUrl ?? null)
          : null;
      setDevVerificationUrl(devUrl);
    } catch (resendError) {
      setResendNotice({
        type: "error",
        message:
          resendError instanceof Error ? resendError.message : text.resendError,
      });
    } finally {
      setIsResending(false);
    }
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
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          {serverError ? (
            <Alert variant="destructive">
              <div className="grid gap-3">
                <p>{serverError}</p>
                {serverCode === "email_unverified" ? (
                  <div className="grid gap-2">
                    <Button
                      className="h-11 w-full rounded-xl"
                      disabled={isResending}
                      onClick={handleResend}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {text.resending}
                        </>
                      ) : (
                        text.resend
                      )}
                    </Button>
                    {resendNotice ? (
                      <p
                        role="status"
                        className={
                          resendNotice.type === "success"
                            ? "text-sm font-medium text-success"
                            : "text-sm font-medium"
                        }
                      >
                        {resendNotice.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
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
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="email">{text.email}</Label>
            <Input
              autoComplete="email"
              id="email"
              inputMode="email"
              type="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email ? (
              <p
                id="email-error"
                role="alert"
                className="text-sm font-medium text-destructive"
              >
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="password">{text.password}</Label>
              <Link
                className="rounded text-sm font-semibold text-primary hover:text-primary-700"
                href="/forgot-password"
              >
                {text.forgot}
              </Link>
            </div>
            <div className="relative">
              <Input
                autoComplete="current-password"
                id="password"
                type={showPassword ? "text" : "password"}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "password-error" : undefined
                }
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
              <p
                id="password-error"
                role="alert"
                className="text-sm font-medium text-destructive"
              >
                {errors.password.message}
              </p>
            ) : null}
          </div>

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
            {text.noAccount}{" "}
            <Link
              className="font-semibold text-primary hover:text-primary-700"
              href="/register"
            >
              {text.register}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
