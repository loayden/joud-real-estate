export default function HomeLoading() {
  return (
    <div className="animate-pulse bg-background">
      <div className="relative h-[560px] bg-primary-900/20">
        <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="h-8 w-64 rounded-md bg-white/10" />
            <div className="h-12 w-80 rounded-md bg-white/10" />
            <div className="h-6 w-96 rounded-md bg-white/10" />
            <div className="mt-8 flex max-w-2xl gap-3 rounded-lg bg-white p-2">
              <div className="h-10 flex-1 rounded bg-muted" />
              <div className="h-10 w-28 rounded bg-primary/20" />
            </div>
            <div className="flex gap-3">
              <div className="h-9 w-36 rounded-md bg-white/10" />
              <div className="h-9 w-36 rounded-md bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-muted/50" />
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/35">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="h-8 w-40 rounded-md bg-muted" />
            <div className="h-9 w-36 rounded-md bg-muted" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 rounded-lg bg-muted/50" />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 rounded-md bg-muted" />
          <div className="h-9 w-36 rounded-md bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-muted/50" />
          ))}
        </div>
      </section>
    </div>
  );
}
