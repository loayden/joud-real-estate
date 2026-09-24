export default function PropertyDetailLoading() {
  return (
    <div className="animate-pulse bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-5 w-64 rounded-md bg-muted" />

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="aspect-[16/9] w-full rounded-lg bg-muted/50" />

            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-md bg-muted/50" />
              ))}
            </div>

            <div className="space-y-3">
              <div className="h-8 w-64 rounded-md bg-muted" />
              <div className="flex gap-3">
                <div className="h-6 w-24 rounded-md bg-muted" />
                <div className="h-6 w-24 rounded-md bg-muted" />
                <div className="h-6 w-32 rounded-md bg-muted" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-5 w-full rounded-md bg-muted" />
              <div className="h-5 w-full rounded-md bg-muted" />
              <div className="h-5 w-3/4 rounded-md bg-muted" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-muted/50" />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-48 rounded-lg bg-muted/50" />
            <div className="h-32 rounded-lg bg-muted/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
