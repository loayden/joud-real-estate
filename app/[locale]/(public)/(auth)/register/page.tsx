import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: { title: "إنشاء حساب" },
  en: { title: "Create Account" },
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

export default async function RegisterPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = (await paramsPromise) as { locale: Locale };
  return (
    <AuthShell locale={locale} wide>
      <RegisterForm locale={locale} />
    </AuthShell>
  );
}
