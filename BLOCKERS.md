# Environment Blockers (dev/sandbox only — no prod secrets touched)

Checked 2026-09-24 via placeholder scan of `.env` / `.env.local` (values never printed).

## Missing / placeholder credentials (mock behind env flag, keep going)

- `AUTH_SECRET` — placeholder in dev. Risk: JWT/session signing insecure. Mock: dev-only default; MUST be real random 32-byte in staging/prod.
- `RESEND_API_KEY` — placeholder (`re_xxx`-style). Email sending disabled/mocked in dev. Verify-email and inquiry-notification flows must be tested with mocked mailer + dev verification URL.
- `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` — placeholders. Uploads likely local/mock. Test with local path; do NOT test against prod bucket.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — placeholders. Rate limiting falls back to in-memory; cache (`getCached`) falls back to direct fetch. OK for dev; staging needs real Redis.
- `HCAPTCHA_SECRET` / `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` — absent from `.env.local`. Captcha likely disabled in dev (`xxx`/`test` bypass). Must verify enforcement in staging.
- `REVALIDATE_SECRET`, `CRON_SECRET` — absent. Revalidate/cron endpoints must be tested with mock secret.
- `SENTRY_*` — absent. Error tracking disabled in dev; verify in staging.
- `VAPID_*` (web-push) — absent. Push subscription flow must be mocked.
- `PEXELS_API_KEY` — absent. Hero/category/placeholder images fall back to local `/images/joud-hero.jpg` + placeholder API.
- `MOYASAR_*` — absent entirely. No payments flow present in repo to test. If payments are required for launch, this is a launch blocker (needs sandbox keys + full flow test).

## Decisions

- All tests use fake data + local dev DB (`joud_dev`) only.
- Personas: guest (no auth), registered user (`qa-user@joud.test`), admin (`admin@joud.sa` seeded).
