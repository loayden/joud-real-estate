export default function SearchLoading() {
  return (
    <div className="animate-pulse bg-muted/25">
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
          <div className="space-y-3">
            <div className="h-10 w-64 rounded-md bg-muted" />
            <div className="h-5 w-96 rounded-md bg-muted" />
          </div>
          <div className="h-12 w-full rounded-md bg-muted" />
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className="h-8 w-32 rounded-md bg-muted" />
              <div className="h-8 w-8 rounded-md bg-muted" />
            </div>
            <div className="flex gap-3">
              <div className="h-9 w-28 rounded-md bg-muted" />
              <div className="h-9 w-28 rounded-md bg-muted" />
              <div className="h-9 w-36 rounded-md bg-muted" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <div className="space-y-4">
            <div className="h-8 w-32 rounded-md bg-muted" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-muted/50" />
            ))}
          </div>
        </aside>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-lg bg-muted/50" />
          ))}
        </div>
      </section>
    </div>
  );
}
