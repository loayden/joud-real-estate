import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: { title: "إنشاء حساب" },
  en: { title: "Create Account" },
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

export default function RegisterPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  return (
    <AuthShell locale={locale} wide>
      <RegisterForm locale={locale} />
    </AuthShell>
  );
}
