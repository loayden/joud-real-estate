import { Building2 } from "lucide-react";
import type { ReactNode } from "react";

import { Link, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function AuthShell({
  children,
  locale,
  wide = false,
}: {
  children: ReactNode;
  locale: Locale;
  wide?: boolean;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Ambient background — direction agnostic */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(27,75,138,0.10),transparent_70%)]"
      />
      <div
        className={cn(
          "mx-auto flex min-h-[calc(100dvh-16rem)] w-full items-center px-4 py-12 sm:px-6",
          wide ? "max-w-lg" : "max-w-md",
        )}
      >
        <div className="grid w-full gap-6">
          <Link
            href="/"
            className="mx-auto flex items-center gap-2.5 rounded-xl text-lg font-bold text-foreground"
            aria-label={locale === "ar" ? "جود العقارية" : "Joud Real Estate"}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-primary-foreground shadow-sm">
              <Building2 className="size-5" />
            </span>
            {locale === "ar" ? "جود العقارية" : "Joud Real Estate"}
          </Link>
          <div className="animate-slide-up">{children}</div>
        </div>
      </div>
    </section>
  );
}
