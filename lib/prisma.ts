import { PrismaClient } from "@prisma/client";

// Fail-fast env validation: throws at build time when DATABASE_URL or
// DIRECT_DATABASE_URL is missing/empty, so static generation can never
// silently prerender pages with empty data.
import "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
