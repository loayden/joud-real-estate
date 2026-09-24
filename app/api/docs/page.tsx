import type { Metadata } from "next";
import dynamic from "next/dynamic";

const ApiDocsViewer = dynamic(
  () =>
    import("@/components/shared/ApiDocsViewer").then(
      (module) => module.ApiDocsViewer,
    ),
  {
    loading: () => (
      <div className="rounded-md border border-border bg-card p-6 text-sm font-semibold text-muted-foreground">
        Loading API documentation...
      </div>
    ),
    ssr: false,
  },
);

export const metadata: Metadata = {
  title: "API Documentation | Joud Real Estate",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-primary px-4 py-5 text-primary-foreground">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold opacity-80">Joud Real Estate</p>
          <h1 className="mt-1 text-2xl font-bold">API Documentation</h1>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <ApiDocsViewer />
      </div>
    </main>
  );
}
