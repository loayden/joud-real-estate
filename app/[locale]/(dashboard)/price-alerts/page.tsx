import { BellRing } from "lucide-react";

import { PriceAlertsList } from "@/components/property/PriceAlertsList";
import { Button } from "@/components/ui/button";
import { Link, type Locale } from "@/i18n/routing";
import { requireSession } from "@/lib/auth-utils";
import { getUserPriceAlerts } from "@/lib/market-features";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const copy = {
  ar: {
    title: "تنبيهات انخفاض السعر",
    description: "تابع العقارات التي تريد معرفة انخفاض أسعارها.",
    empty: "لا توجد تنبيهات مفعّلة بعد.",
    browse: "تصفح العقارات",
  },
  en: {
    title: "Price drop alerts",
    description: "Track properties you want price-drop notifications for.",
    empty: "No active alerts yet.",
    browse: "Browse properties",
  },
} as const;

export default async function PriceAlertsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const text = copy[locale];
  const session = await requireSession();
  const alerts = await getUserPriceAlerts(session.user.id);

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <div className="inline-flex w-fit items-center gap-2 rounded-md bg-primary-50 px-3 py-2 text-sm font-bold text-primary">
          <BellRing className="size-4" />
          {alerts.length}
        </div>
        <h1 className="text-3xl font-bold tracking-normal">{text.title}</h1>
        <p className="text-muted-foreground">{text.description}</p>
      </div>

      {alerts.length > 0 ? (
        <PriceAlertsList alerts={alerts} locale={locale} />
      ) : (
        <div className="grid place-items-center rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-muted-foreground">
              {text.empty}
            </p>
            <Button asChild>
              <Link href="/properties">{text.browse}</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
