import * as Sentry from "@sentry/nextjs";

import { getSentryTraceSampleRate, scrubSentryEvent } from "@/lib/sentry-utils";

// Empty-string env vars count as missing (`??` would keep "").
const rawDsn = (
  process.env.SENTRY_DSN ||
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  ""
).trim();
const dsn = rawDsn && !rawDsn.includes("xxx") ? rawDsn : undefined;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  sendDefaultPii: false,
  tracesSampleRate:
    process.env.NODE_ENV === "development"
      ? 1
      : getSentryTraceSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
  beforeSend(event) {
    return scrubSentryEvent(event);
  },
});
