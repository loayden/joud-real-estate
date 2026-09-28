import * as Sentry from "@sentry/nextjs";

import { getSentryTraceSampleRate, scrubSentryEvent } from "@/lib/sentry-utils";

import { getSafeSentryDsn } from "@/lib/app-url";

const dsn = getSafeSentryDsn();

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
