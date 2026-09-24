export default function PropertiesLoading() {
  return (
    <div className="animate-pulse bg-muted/25">
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="space-y-3">
              <div className="h-8 w-48 rounded-md bg-muted" />
              <div className="h-10 w-64 rounded-md bg-muted" />
              <div className="h-5 w-96 rounded-md bg-muted" />
            </div>
            <div className="h-10 w-40 rounded-md bg-muted" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 w-24 rounded-md bg-muted" />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 rounded-lg bg-muted/50" />
          ))}
        </div>
      </section>
    </div>
  );
}
