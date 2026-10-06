import { Compass, Home, Search } from "lucide-react";
import { getLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

const copy = {
  ar: {
    code: "٤٠٤",
    title: "الصفحة غير موجودة",
    description: "قد يكون الرابط غير صحيح أو أن الصفحة لم تعد متاحة.",
    home: "الرئيسية",
    search: "البحث عن عقار",
  },
  en: {
    code: "404",
    title: "Page not found",
    description:
      "The link may be incorrect, or the page is no longer available.",
    home: "Home",
    search: "Search properties",
  },
} as const;

export default async function NotFound() {
  const locale = (await getLocale()) === "en" ? "en" : "ar";
  const text = copy[locale];

  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_20%,rgba(27,75,138,0.10),transparent_70%)]"
      />
      <div className="mx-auto flex min-h-[70dvh] w-full max-w-3xl animate-slide-up flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <span className="grid size-16 place-items-center rounded-3xl bg-primary-50 text-primary">
          <Compass className="size-8" />
        </span>
        <p className="tnum mt-6 text-sm font-bold tracking-widest text-gold-700">
          {text.code}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {text.title}
        </h1>
        <p className="mt-4 max-w-xl text-body text-muted-foreground">
          {text.description}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="h-11 rounded-xl px-6">
            <Link href="/">
              <Home className="size-4" />
              {text.home}
            </Link>
          </Button>
          <Button asChild variant="secondary" className="h-11 rounded-xl px-6">
            <Link href="/search">
              <Search className="size-4" />
              {text.search}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
