"use client";

import { useLocale } from "next-intl";

import { usePathname, useRouter, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const localeOptions: Array<{ locale: Locale; label: string }> = [
  { locale: "ar", label: "AR" },
  { locale: "en", label: "EN" },
];

export function LocaleSwitcher() {
  const activeLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      aria-label="Language selector"
      className="inline-flex rounded-md border border-border bg-background p-1"
    >
      {localeOptions.map((option) => (
        <button
          aria-pressed={activeLocale === option.locale}
          className={cn(
            "h-8 rounded px-3 text-xs font-bold transition-colors",
            activeLocale === option.locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          key={option.locale}
          onClick={() => router.replace(pathname, { locale: option.locale })}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
