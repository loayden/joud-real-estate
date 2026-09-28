import * as Sentry from "@sentry/nextjs";

import { getSentryTraceSampleRate, scrubSentryEvent } from "@/lib/sentry-utils";

const rawDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
const dsn = rawDsn && !rawDsn.includes("xxx") ? rawDsn : undefined;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  sendDefaultPii: false,
  tracesSampleRate:
    process.env.NODE_ENV === "development"
      ? 1
      : getSentryTraceSampleRate(
          process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
        ),
  beforeSend(event) {
    return scrubSentryEvent(event);
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
