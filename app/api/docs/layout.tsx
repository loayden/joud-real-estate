import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "../../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
});

export const metadata: Metadata = {
  title: "API Documentation | Joud Real Estate",
};

export default function ApiDocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={inter.variable} dir="ltr" lang="en">
      <body className="min-h-screen bg-background font-latin text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
