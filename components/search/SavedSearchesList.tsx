"use client";

import { Bookmark, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link, type Locale, useRouter } from "@/i18n/routing";
import type { SavedSearchFilters } from "@/lib/saved-searches";
import { apiFetch } from "@/lib/api-client";

export type SavedSearchView = {
  id: string;
  nameAr: string | null;
  filters: SavedSearchFilters;
  createdAt: string;
  summary: string[];
  href: string;
};

const copy = {
  ar: {
    fallbackName: "بحث محفوظ",
    view: "عرض النتائج",
    delete: "حذف",
    deleting: "جار الحذف",
    emptyTitle: "لا توجد بحوث محفوظة",
    emptyDescription: "احفظ بحثك من صفحة البحث للعودة إلى نفس الفلاتر بسرعة.",
    search: "اذهب للبحث",
    confirmDelete: "هل تريد حذف هذا البحث المحفوظ؟",
    genericError: "تعذر حذف البحث المحفوظ. حاول مرة أخرى.",
    created: "تاريخ الحفظ",
    noFilters: "بدون فلاتر",
  },
  en: {
    fallbackName: "Saved search",
    view: "View results",
    delete: "Delete",
    deleting: "Deleting",
    emptyTitle: "No saved searches",
    emptyDescription:
      "Save a search from the search page to return to the same filters quickly.",
    search: "Go to search",
    confirmDelete: "Delete this saved search?",
    genericError: "Could not delete the saved search. Try again.",
    created: "Saved on",
    noFilters: "No filters",
  },
} as const;

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function SavedSearchesList({
  initialSearches,
  locale,
}: {
  initialSearches: SavedSearchView[];
  locale: Locale;
}) {
  const text = copy[locale];
  const router = useRouter();
  const [searches, setSearches] = useState(initialSearches);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function deleteSearch(id: string) {
    if (!window.confirm(text.confirmDelete)) return;

    const previous = searches;
    setPendingId(id);
    setError(null);
    setSearches((current) => current.filter((search) => search.id !== id));

    try {
      const response = await apiFetch(`/api/saved-searches/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? text.genericError);
      }

      router.refresh();
    } catch (deleteError) {
      setSearches(previous);
      setError(
        deleteError instanceof Error ? deleteError.message : text.genericError,
      );
    } finally {
      setPendingId(null);
    }
  }

  if (searches.length === 0) {
    return (
      <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-border bg-background p-8 text-center">
        <div className="grid max-w-md justify-items-center gap-3">
          <Bookmark className="size-11 text-muted-foreground" />
          <h2 className="text-2xl font-bold">{text.emptyTitle}</h2>
          <p className="leading-7 text-muted-foreground">
            {text.emptyDescription}
          </p>
          <Button asChild>
            <Link href="/search">{text.search}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {searches.map((search) => (
          <article
            className="grid gap-4 rounded-lg border border-border bg-card p-5 shadow-subtle"
            key={search.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-foreground">
                  {search.nameAr || text.fallbackName}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {text.created}: {formatDate(search.createdAt, locale)}
                </p>
              </div>
              <Bookmark className="size-5 shrink-0 text-primary" />
            </div>

            <div className="flex flex-wrap gap-2">
              {(search.summary.length > 0
                ? search.summary
                : [text.noFilters]
              ).map((item) => (
                <span
                  className="rounded-md bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={search.href}>
                  <ExternalLink className="size-4" />
                  {text.view}
                </Link>
              </Button>
              <Button
                disabled={pendingId === search.id}
                onClick={() => deleteSearch(search.id)}
                type="button"
                variant="secondary"
              >
                {pendingId === search.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                {pendingId === search.id ? text.deleting : text.delete}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
