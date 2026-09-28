// Fail-fast environment validation (server-only: imports zod).
//
// Imported by `lib/prisma.ts`, so every static-generation pass that touches
// the database throws a clear error at build time instead of prerendering
// pages with empty data. Do NOT import this module from middleware (Edge)
// or client components.

import { z } from "zod";

const postgresUrl = z
  .string()
  .trim()
  .min(1, "must not be empty")
  .refine(
    (value) =>
      value.startsWith("postgresql://") || value.startsWith("postgres://"),
    "must be a postgres connection string starting with postgresql:// or postgres://",
  );

const envSchema = z.object({
  DATABASE_URL: postgresUrl,
  DIRECT_DATABASE_URL: postgresUrl,
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `[env] Missing or invalid required environment variables:\n${details}\n` +
      "Set DATABASE_URL (pooled, e.g. Supabase PgBouncer :6543) and " +
      "DIRECT_DATABASE_URL (direct, :5432) in the Vercel dashboard for " +
      "Production and Preview, exposed at build time. " +
      "See .env.example.",
  );
}

export const env = parsed.data;
