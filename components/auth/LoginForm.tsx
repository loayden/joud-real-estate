"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
    submit: "تسجيل الدخول",
    loading: "جار تسجيل الدخول",
    forgot: "نسيت كلمة المرور؟",
    noAccount: "ليس لديك حساب؟",
    register: "إنشاء حساب",
    verifyNow: "تفعيل البريد الآن",
    developmentLink:
      "رابط التفعيل ظاهر هنا لأن إرسال البريد غير مفعّل في بيئة التطوير.",
    genericError: "تعذر تسجيل الدخول. حاول مرة أخرى.",
  },
  en: {
    title: "Login",
    description: "Access your account to manage listings and inquiries.",
    email: "Email",
    password: "Password",
    submit: "Login",
    loading: "Logging in",
    forgot: "Forgot password?",
    noAccount: "No account?",
    register: "Create account",
    verifyNow: "Verify email now",
    developmentLink:
      "This verification link is shown because email delivery is disabled in development.",
    genericError: "Could not log in. Please try again.",
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
  const [devVerificationUrl, setDevVerificationUrl] = useState<string | null>(
    null,
  );
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
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
      setDevVerificationUrl(
        payload.success ? null : (payload.details?.devVerificationUrl ?? null),
      );
      return;
    }

    router.push(payload.data.redirectTo ?? `/${locale}/dashboard`);
    router.refresh();
    window.dispatchEvent(new CustomEvent("joud:session-changed"));
  }

  return (
    <Card className="w-full">
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
            <Alert variant="destructive">
              <div className="grid gap-3">
                <p>{serverError}</p>
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
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-red-700">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="password">{text.password}</Label>
              <Link
                className="text-sm font-semibold text-primary hover:text-primary-700"
                href="/forgot-password"
              >
                {text.forgot}
              </Link>
            </div>
            <Input
              autoComplete="current-password"
              id="password"
              type="password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-red-700">{errors.password.message}</p>
            ) : null}
          </div>

          <Button className="w-full" disabled={isSubmitting} type="submit">
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
