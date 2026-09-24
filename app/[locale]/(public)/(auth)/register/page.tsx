import type { Metadata } from "next";

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
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-lg items-center px-4 py-12">
      <RegisterForm locale={locale} />
    </section>
  );
}
