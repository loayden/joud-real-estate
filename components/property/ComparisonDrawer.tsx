"use client";

import { GitCompare, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type ComparedProperty = {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
};

const STORAGE_KEY = "joud:comparison:v1";

const copy = {
  ar: {
    compare: "قارن",
    remove: "إزالة من المقارنة",
    drawer: "قارن العقارات",
    open: "فتح المقارنة",
    clear: "مسح",
    limit: "يمكنك مقارنة 4 عقارات كحد أقصى.",
  },
  en: {
    compare: "Compare",
    remove: "Remove from comparison",
    drawer: "Compare properties",
    open: "Open comparison",
    clear: "Clear",
    limit: "You can compare up to 4 properties.",
  },
} as const;

function readComparison(): ComparedProperty[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ComparedProperty[]) : [];
  } catch {
    return [];
  }
}

function writeComparison(items: ComparedProperty[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 4)));
  window.dispatchEvent(new Event("joud:comparison-changed"));
}

export function ComparisonToggleButton({
  property,
  locale,
}: {
  property: ComparedProperty;
  locale: Locale;
}) {
  const text = copy[locale];
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    function sync() {
      setActive(readComparison().some((item) => item.id === property.id));
    }

    sync();
    window.addEventListener("joud:comparison-changed", sync);
    return () => window.removeEventListener("joud:comparison-changed", sync);
  }, [property.id]);

  function toggle() {
    const current = readComparison();
    const exists = current.some((item) => item.id === property.id);

    if (exists) {
      writeComparison(current.filter((item) => item.id !== property.id));
      setMessage(null);
      return;
    }

    if (current.length >= 4) {
      setMessage(text.limit);
      return;
    }

    writeComparison([...current, property]);
    setMessage(null);
  }

  return (
    <div className="grid gap-1">
      <Button
        className={cn(active && "border-primary bg-primary-50 text-primary")}
        onClick={toggle}
        size="sm"
        type="button"
        variant="secondary"
      >
        <GitCompare className="size-4" />
        {active ? text.remove : text.compare}
      </Button>
      {message ? (
        <span className="text-xs font-semibold text-destructive" role="status">
          {message}
        </span>
      ) : null}
    </div>
  );
}

export function ComparisonDrawer({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const pathname = usePathname();
  const [items, setItems] = useState<ComparedProperty[]>([]);
  const ids = useMemo(() => items.map((item) => item.id).join(","), [items]);
  const normalizedPath = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  const hidden =
    normalizedPath.startsWith("/admin") ||
    normalizedPath.startsWith("/dashboard");

  useEffect(() => {
    function sync() {
      setItems(readComparison());
    }

    sync();
    window.addEventListener("joud:comparison-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("joud:comparison-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (hidden || items.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-3 bottom-[4.75rem] z-40 mx-auto max-w-3xl animate-slide-up rounded-2xl border border-border/70 bg-background/95 p-3 shadow-lift backdrop-blur-md lg:bottom-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">
            {text.drawer} ({items.length}/4)
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {items.map((item) => item.title).join(" · ")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href={`/compare?ids=${ids}`}>
              <GitCompare className="size-4" />
              {text.open}
            </Link>
          </Button>
          <Button
            onClick={() => writeComparison([])}
            size="sm"
            type="button"
            variant="ghost"
          >
            <X className="size-4" />
            {text.clear}
          </Button>
        </div>
      </div>
    </div>
  );
}
