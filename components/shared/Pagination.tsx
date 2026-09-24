import { ChevronLeft, ChevronRight } from "lucide-react";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

function getPages(page: number, totalPages: number) {
  const pages: Array<number | "ellipsis"> = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("ellipsis");
  }

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return pages;
}

export function Pagination({
  page,
  totalPages,
  buildUrl,
  labels = { previous: "Previous", next: "Next" },
}: {
  page: number;
  totalPages: number;
  buildUrl: (page: number) => string;
  labels?: { previous: string; next: string };
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <Link
        aria-disabled={page <= 1}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold",
          page <= 1 && "pointer-events-none opacity-45",
        )}
        href={buildUrl(Math.max(1, page - 1))}
      >
        <ChevronRight className="size-4 rtl:hidden" />
        <ChevronLeft className="hidden size-4 rtl:block" />
        {labels.previous}
      </Link>

      {getPages(page, totalPages).map((item, index) =>
        item === "ellipsis" ? (
          <span
            className="grid size-10 place-items-center text-muted-foreground"
            key={`ellipsis-${index}`}
          >
            ...
          </span>
        ) : (
          <Link
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "grid size-10 place-items-center rounded-md border border-border text-sm font-bold",
              item === page
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted",
            )}
            href={buildUrl(item)}
            key={item}
          >
            {item}
          </Link>
        ),
      )}

      <Link
        aria-disabled={page >= totalPages}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold",
          page >= totalPages && "pointer-events-none opacity-45",
        )}
        href={buildUrl(Math.min(totalPages, page + 1))}
      >
        {labels.next}
        <ChevronLeft className="size-4 rtl:hidden" />
        <ChevronRight className="hidden size-4 rtl:block" />
      </Link>
    </nav>
  );
}
