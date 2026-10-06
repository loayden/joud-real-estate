import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: { title: "تسجيل الدخول" },
  en: { title: "Login" },
} as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Metadata {
  return {
    title: copy[locale].title,
    robots: { index: false, follow: false },
  };
}

export default function LoginPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { callbackUrl?: string | string[] };
}) {
  const callbackUrl =
    typeof searchParams.callbackUrl === "string"
      ? searchParams.callbackUrl
      : undefined;

  return (
    <AuthShell locale={locale}>
      <LoginForm callbackUrl={callbackUrl} locale={locale} />
    </AuthShell>
  );
}
