import type { Metadata } from "next";

import "../globals.css";

export const metadata: Metadata = {
  title: "لا يوجد اتصال بالإنترنت | جود العقارية",
};

export default function OfflineLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html dir="rtl" lang="ar">
      <body className="min-h-screen bg-background font-arabic text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
