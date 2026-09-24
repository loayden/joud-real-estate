"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

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
import { emailSchema } from "@/lib/validations/auth";

type ForgotPasswordInput = z.input<typeof emailSchema>;

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

const copy = {
  ar: {
    title: "استعادة كلمة المرور",
    description: "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.",
    email: "البريد الإلكتروني",
    submit: "إرسال رابط الاستعادة",
    loading: "جار الإرسال",
    success:
      "إذا كان البريد مسجلاً لدينا، ستصلك تعليمات إعادة التعيين خلال دقائق.",
    login: "العودة لتسجيل الدخول",
    genericError: "تعذر إرسال الطلب. حاول مرة أخرى.",
  },
  en: {
    title: "Reset Password",
    description:
      "Enter your email and we will send password reset instructions.",
    email: "Email",
    submit: "Send reset link",
    loading: "Sending",
    success:
      "If this email is registered, reset instructions will arrive shortly.",
    login: "Back to login",
    genericError: "Could not send the request. Please try again.",
  },
} as const;

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const [serverError, setServerError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "", locale },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, locale }),
    });
    const payload = (await response.json()) as ApiResponse<{
      message: string;
    }>;

    if (!response.ok || !payload.success) {
      setServerError(payload.success ? text.genericError : payload.error);
      return;
    }

    setIsComplete(true);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
          {serverError ? (
            <Alert variant="destructive">{serverError}</Alert>
          ) : null}
          {isComplete ? <Alert variant="success">{text.success}</Alert> : null}

          <div className="grid gap-2">
            <Label htmlFor="email">{text.email}</Label>
            <Input
              autoComplete="email"
              disabled={isComplete}
              id="email"
              inputMode="email"
              type="email"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-red-700">{errors.email.message}</p>
            ) : null}
          </div>

          <Button
            className="w-full"
            disabled={isSubmitting || isComplete}
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

          <Button asChild className="w-full" variant="secondary">
            <Link href="/login">{text.login}</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
