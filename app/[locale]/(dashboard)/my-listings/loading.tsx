export default function MyListingsLoading() {
  return (
    <div className="animate-pulse p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-md bg-muted" />
          <div className="h-5 w-72 rounded-md bg-muted" />
        </div>
        <div className="h-10 w-36 rounded-md bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-12 w-full rounded-md bg-muted/50" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 w-full rounded-md bg-muted/30" />
        ))}
      </div>
    </div>
  );
}
