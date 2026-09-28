import { Home, WifiOff } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { RetryButton } from "./RetryButton";

const copy = {
  ar: {
    title: "لا يوجد اتصال بالإنترنت",
    description: "تحقق من اتصالك بالشبكة وحاول مرة أخرى.",
    home: "الرئيسية",
    retry: "إعادة المحاولة",
  },
  en: {
    title: "You are offline",
    description: "Check your connection and try again.",
    home: "Home",
    retry: "Retry",
  },
} as const;

// Locale-less fallback route (outside [locale]): must stay free of
// next-intl navigation helpers, database access, and auth so the service
// worker can precache and serve it fully offline.
export const dynamic = "force-static";

export default function OfflinePage() {
  const text = copy.ar;

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-muted">
        <WifiOff className="size-8 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{text.title}</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">{text.description}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <RetryButton label={text.retry} />
        <Button asChild variant="secondary">
          <Link href="/">
            <Home className="h-4 w-4" />
            {text.home}
          </Link>
        </Button>
      </div>
    </section>
  );
}
