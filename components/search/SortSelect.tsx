"use client";

import { Grid2X2, List } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const copy = {
  ar: {
    sortLabel: "ترتيب النتائج",
    newest: "الأحدث",
    priceAsc: "السعر: الأقل أولاً",
    priceDesc: "السعر: الأعلى أولاً",
    areaAsc: "المساحة: الأصغر أولاً",
    grid: "عرض شبكي",
    list: "عرض قائمة",
  },
  en: {
    sortLabel: "Sort results",
    newest: "Newest",
    priceAsc: "Price: low to high",
    priceDesc: "Price: high to low",
    areaAsc: "Area: smallest first",
    grid: "Grid view",
    list: "List view",
  },
} as const;

export function SortSelect({
  locale,
  currentSort,
  currentView,
}: {
  locale: "ar" | "en";
  currentSort: string;
  currentView: "grid" | "list";
}) {
  const text = copy[locale];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function pushParam(key: "sort" | "view", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    params.delete("page");
    const query = params.toString();

    startTransition(() => {
      router.push((query ? `${pathname}?${query}` : pathname) as never);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="sort">
        {text.sortLabel}
      </label>
      <Select
        className="w-52"
        disabled={isPending}
        id="sort"
        onChange={(event) => pushParam("sort", event.target.value)}
        value={currentSort}
      >
        <option value="newest">{text.newest}</option>
        <option value="price_asc">{text.priceAsc}</option>
        <option value="price_desc">{text.priceDesc}</option>
        <option value="area_asc">{text.areaAsc}</option>
      </Select>
      <div className="inline-flex rounded-md border border-border bg-background p-1">
        <Button
          aria-label={text.grid}
          className={cn(
            currentView === "grid" && "bg-primary text-primary-foreground",
          )}
          onClick={() => pushParam("view", "grid")}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Grid2X2 className="size-4" />
        </Button>
        <Button
          aria-label={text.list}
          className={cn(
            currentView === "list" && "bg-primary text-primary-foreground",
          )}
          onClick={() => pushParam("view", "list")}
          size="icon"
          type="button"
          variant="ghost"
        >
          <List className="size-4" />
        </Button>
      </div>
    </div>
  );
}
