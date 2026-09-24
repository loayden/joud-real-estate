import { Home } from "lucide-react";
import { getLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

const copy = {
  ar: {
    code: "٤٠٤",
    title: "الصفحة غير موجودة",
    description: "قد يكون الرابط غير صحيح أو أن الصفحة لم تعد متاحة.",
    home: "الرئيسية",
  },
  en: {
    code: "404",
    title: "Page not found",
    description:
      "The link may be incorrect, or the page is no longer available.",
    home: "Home",
  },
} as const;

export default async function NotFound() {
  const locale = (await getLocale()) === "en" ? "en" : "ar";
  const text = copy[locale];

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-bold text-gold">{text.code}</p>
      <h1 className="mt-3 text-3xl font-bold text-primary sm:text-4xl">
        {text.title}
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">{text.description}</p>
      <Button asChild className="mt-8">
        <Link href="/">
          <Home className="h-4 w-4" />
          {text.home}
        </Link>
      </Button>
    </section>
  );
}
