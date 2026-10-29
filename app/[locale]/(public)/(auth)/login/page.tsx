import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: { title: "تسجيل الدخول" },
  en: { title: "Login" },
} as const;

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = (await paramsPromise) as { locale: Locale };
  return {
    title: copy[locale].title,
    robots: { index: false, follow: false },
  };
}

export default async function LoginPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const { locale } = (await paramsPromise) as { locale: Locale };
  const searchParams = await searchParamsPromise;
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
