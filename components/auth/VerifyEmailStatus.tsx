"use client";

import { Loader2, Send } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    resendTitle: "انتهت صلاحية الرابط؟",
    resendDescription: "أدخل بريدك وسنرسل لك رابط تفعيل جديد.",
    email: "البريد الإلكتروني",
    resend: "إرسال رابط جديد",
    resending: "جار إرسال الرابط",
    resent: "أرسلنا رابط تفعيل جديد إلى بريدك.",
    resendError: "تعذر إرسال الرابط. حاول مرة أخرى.",
  },
  en: {
    title: "Verify Email",
    description: "We are checking your verification link.",
    loading: "Verifying",
    success: "Your email address has been verified.",
    error: "The verification link is invalid or expired.",
    login: "Login",
    resendTitle: "Link expired?",
    resendDescription: "Enter your email and we will send a new link.",
    email: "Email",
    resend: "Send a new link",
    resending: "Sending link",
    resent: "A new verification link was sent to your email.",
    resendError: "Could not send the link. Please try again.",
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
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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

  async function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || isResending) return;
    setIsResending(true);
    setResendNotice(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, locale }),
      });
      const payload = (await response.json()) as ApiResponse<{
        message: string;
        emailSent?: boolean;
      }>;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? text.resendError : payload.error);
      }

      if (payload.data.emailSent === false) {
        setResendNotice({ type: "error", message: text.resendError });
        return;
      }

      setResendNotice({ type: "success", message: text.resent });
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

        {status === "error" ? (
          <form
            className="grid gap-3 rounded-2xl border border-border bg-muted/30 p-4"
            onSubmit={handleResend}
          >
            <div>
              <p className="text-small font-bold text-foreground">
                {text.resendTitle}
              </p>
              <p className="mt-1 text-small text-muted-foreground">
                {text.resendDescription}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resend-email">{text.email}</Label>
              <Input
                autoComplete="email"
                id="resend-email"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
                required
              />
            </div>
            {resendNotice ? (
              <p
                role="status"
                className={
                  resendNotice.type === "success"
                    ? "text-sm font-medium text-success"
                    : "text-sm font-medium text-destructive"
                }
              >
                {resendNotice.message}
              </p>
            ) : null}
            <Button
              className="h-11 w-full rounded-xl"
              disabled={isResending}
              type="submit"
              variant="secondary"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {text.resending}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {text.resend}
                </>
              )}
            </Button>
          </form>
        ) : null}

        <Button asChild className="h-12 w-full rounded-xl">
          <Link href="/login">{text.login}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
