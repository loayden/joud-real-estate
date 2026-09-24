import { Home, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

const copy = {
  ar: {
    title: "لا يوجد اتصال بالإنترنت",
    description: "تحقق من اتصالك بالشبكة وحاول مرة أخرى.",
    home: "الرئيسية",
  },
  en: {
    title: "You are offline",
    description: "Check your connection and try again.",
    home: "Home",
  },
} as const;

export default function OfflinePage() {
  const text = copy.ar;

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-muted">
        <WifiOff className="size-8 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">{text.title}</h1>
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
