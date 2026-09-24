"use client";

import { Calculator } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n/routing";

const copy = {
  ar: {
    title: "حاسبة التمويل العقاري",
    price: "سعر العقار",
    downPayment: "الدفعة الأولى",
    years: "مدة التمويل",
    annualRate: "نسبة الربح السنوية",
    support: "دعم شهري تقديري",
    monthly: "القسط الشهري التقريبي",
    principal: "مبلغ التمويل",
    yearsSuffix: "سنة",
  },
  en: {
    title: "Mortgage calculator",
    price: "Property price",
    downPayment: "Down payment",
    years: "Financing term",
    annualRate: "Annual rate",
    support: "Estimated monthly support",
    monthly: "Estimated monthly payment",
    principal: "Financed amount",
    yearsSuffix: "years",
  },
} as const;

function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    currency: "EGP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function MortgageCalculator({
  locale,
  defaultPrice,
}: {
  locale: Locale;
  defaultPrice: number;
}) {
  const text = copy[locale];
  const [price, setPrice] = useState(defaultPrice);
  const [downPayment, setDownPayment] = useState(
    Math.round(defaultPrice * 0.1),
  );
  const [years, setYears] = useState(25);
  const [annualRate, setAnnualRate] = useState(18);
  const [monthlySupport, setMonthlySupport] = useState(0);

  const result = useMemo(() => {
    const principal = Math.max(price - downPayment, 0);
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    const gross =
      monthlyRate > 0
        ? (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months))
        : principal / Math.max(months, 1);

    return {
      principal,
      monthly: Math.max(gross - monthlySupport, 0),
    };
  }, [annualRate, downPayment, monthlySupport, price, years]);

  return (
    <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-10 place-items-center rounded-md bg-primary-50 text-primary">
          <Calculator className="size-5" />
        </span>
        <h2 className="text-xl font-bold">{text.title}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold">
          {text.price}
          <Input
            min={0}
            onChange={(event) =>
              setPrice(Math.max(0, Number(event.target.value)))
            }
            type="number"
            value={price}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          {text.downPayment}
          <Input
            min={0}
            onChange={(event) =>
              setDownPayment(Math.max(0, Number(event.target.value)))
            }
            type="number"
            value={downPayment}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          {text.years}
          <Input
            max={30}
            min={1}
            onChange={(event) =>
              setYears(Math.max(1, Math.min(30, Number(event.target.value))))
            }
            type="number"
            value={years}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          {text.annualRate}
          <Input
            max={20}
            min={0}
            onChange={(event) =>
              setAnnualRate(
                Math.max(0, Math.min(20, Number(event.target.value))),
              )
            }
            step="0.05"
            type="number"
            value={annualRate}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold sm:col-span-2">
          {text.support}
          <Input
            min={0}
            onChange={(event) =>
              setMonthlySupport(Math.max(0, Number(event.target.value)))
            }
            type="number"
            value={monthlySupport}
          />
        </label>
      </div>

      <div className="grid gap-3 rounded-md bg-primary-50 p-4 text-primary sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold opacity-80">{text.principal}</p>
          <p className="text-xl font-bold">
            {formatCurrency(result.principal, locale)}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold opacity-80">{text.monthly}</p>
          <p className="text-2xl font-bold">
            {formatCurrency(result.monthly, locale)}
          </p>
        </div>
      </div>
    </section>
  );
}
