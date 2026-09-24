"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, type Locale } from "@/i18n/routing";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

const copy = {
  ar: {
    title: "تفعيل البريد الإلكتروني",
    description: "نقوم بالتحقق من رابط التفعيل.",
    loading: "جار التفعيل",
    success: "تم تفعيل بريدك الإلكتروني بنجاح.",
    error: "رابط التفعيل غير صحيح أو منتهي الصلاحية.",
    login: "تسجيل الدخول",
  },
  en: {
    title: "Verify Email",
    description: "We are checking your verification link.",
    loading: "Verifying",
    success: "Your email address has been verified.",
    error: "The verification link is invalid or expired.",
    login: "Login",
  },
} as const;

export function VerifyEmailStatus({
  locale,
  token,
}: {
  locale: Locale;
  token?: string;
}) {
  const text = copy[locale];
  const didRun = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || didRun.current) return;
    didRun.current = true;

    async function verify() {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const payload = (await response.json()) as ApiResponse<{
        verified: boolean;
      }>;

      if (!response.ok || !payload.success) {
        setError(payload.success ? text.error : payload.error);
        setStatus("error");
        return;
      }

      setStatus("success");
    }

    verify().catch(() => {
      setError(text.error);
      setStatus("error");
    });
  }, [text.error, token]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {status === "loading" ? (
          <Alert>
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {text.loading}
            </span>
          </Alert>
        ) : null}
        {status === "success" ? (
          <Alert variant="success">{text.success}</Alert>
        ) : null}
        {status === "error" ? (
          <Alert variant="destructive">{error ?? text.error}</Alert>
        ) : null}

        <Button asChild className="w-full">
          <Link href="/login">{text.login}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
