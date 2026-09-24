export default function DashboardLoading() {
  return (
    <div className="animate-pulse p-6 lg:p-8">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-48 rounded-md bg-muted" />
        <div className="h-5 w-72 rounded-md bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg bg-muted/50" />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-lg bg-muted/50" />
        <div className="h-64 rounded-lg bg-muted/50" />
      </div>
    </div>
  );
}
