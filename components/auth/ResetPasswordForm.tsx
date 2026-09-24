"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { resetPasswordSchema } from "@/lib/validations/auth";

type ResetPasswordInput = {
  token: string;
  password: string;
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

const copy = {
  ar: {
    title: "تعيين كلمة مرور جديدة",
    description: "اختر كلمة مرور قوية لحسابك.",
    password: "كلمة المرور الجديدة",
    submit: "تحديث كلمة المرور",
    loading: "جار التحديث",
    missingToken: "رابط إعادة التعيين غير صحيح أو ناقص.",
    success: "تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.",
    login: "تسجيل الدخول",
    genericError: "تعذر تحديث كلمة المرور. حاول مرة أخرى.",
  },
  en: {
    title: "Set New Password",
    description: "Choose a strong new password for your account.",
    password: "New password",
    submit: "Update password",
    loading: "Updating",
    missingToken: "The password reset link is invalid or incomplete.",
    success: "Password updated. You can log in now.",
    login: "Login",
    genericError: "Could not update the password. Please try again.",
  },
} as const;

export function ResetPasswordForm({
  locale,
  token,
}: {
  locale: Locale;
  token?: string;
}) {
  const text = copy[locale];
  const [serverError, setServerError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: token ?? "", password: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const payload = (await response.json()) as ApiResponse<{ reset: boolean }>;

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
          {!token ? (
            <Alert variant="destructive">{text.missingToken}</Alert>
          ) : null}
          {serverError ? (
            <Alert variant="destructive">{serverError}</Alert>
          ) : null}
          {isComplete ? <Alert variant="success">{text.success}</Alert> : null}

          <input type="hidden" {...register("token")} />

          <div className="grid gap-2">
            <Label htmlFor="password">{text.password}</Label>
            <Input
              autoComplete="new-password"
              disabled={!token || isComplete}
              id="password"
              type="password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-red-700">{errors.password.message}</p>
            ) : null}
          </div>

          <Button
            className="w-full"
            disabled={!token || isSubmitting || isComplete}
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
