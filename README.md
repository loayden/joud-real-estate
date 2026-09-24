# جود العقارية — Developer Documentation

Arabic-first real estate platform for Egypt, built on Next.js, PostgreSQL, Supabase-ready Prisma, Cloudflare R2, Upstash Redis, and Vercel.

## Quick Start (< 15 minutes)

```bash
npm install
cp .env.example .env.local
docker compose -f infrastructure/docker/docker-compose.yml up -d
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000/ar](http://localhost:3000/ar).

Default local admin after seed:

- Email: `admin@joud.sa`
- Password: `JoudAdmin@2024!`

Rotate this password before any shared or production environment.

## Common Commands

```bash
npm run dev
npm run lint
npm run type-check
npm run format:check
npm run build
npm run analyze
npx prisma validate
npx prisma generate
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill provider credentials as needed.

| Variable              | Purpose                                |
| --------------------- | -------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | Public app origin                      |
| `DATABASE_URL`        | Runtime pooled PostgreSQL URL          |
| `DIRECT_DATABASE_URL` | Direct PostgreSQL URL for migrations   |
| `AUTH_SECRET`         | Auth.js session encryption secret      |
| `RESEND_API_KEY`      | Transactional email                    |
| `R2_*`                | Cloudflare R2 image and backup storage |
| `UPSTASH_REDIS_*`     | Cache and rate limiting                |
| `HCAPTCHA_*`          | Bot protection                         |
| `SENTRY_*`            | Error monitoring and source maps       |
| `CRON_SECRET`         | Vercel cron route protection           |
| `REVALIDATE_SECRET`   | On-demand ISR protection               |
| `VAPID_*`             | Web Push notifications                 |

## Architecture Overview

See [ARCHITECTURE.md](./ARCHITECTURE.md).

## API Documentation

- Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/docs/openapi.json`
- Versioned public API base: `/api/v1`

Auth for v1 endpoints supports both:

- Web cookie session
- `Authorization: Bearer <authjs-session-token>`

## Production Readiness

- Health check: `/api/health`
- Protected cron routes: `/api/cron/expire-listings` and `/api/cron/backup-notification`
- Daily backup workflow: `.github/workflows/backup.yml`
- Pre-launch checklist: `docs/PRELAUNCH_CHECKLIST.md`

Do not run production migrations, seed production, or configure live provider resources without an explicit launch plan and approval.

## Phase Completion Tracker

- [x] Phase 1 — Foundation & dev environment
- [x] Phase 2 — Database foundation & ORM
- [x] Phase 3 — Authentication system
- [x] Phase 4 — User profile system
- [x] Phase 5 — Regions & geographic API
- [x] Phase 6 — Property categories & types
- [x] Phase 7 — Property listing creation
- [x] Phase 8 — Image upload system
- [x] Phase 9 — Property browsing pages
- [x] Phase 10 — Search & filtering system
- [x] Phase 11 — Property details page
- [x] Phase 12 — Admin dashboard foundation
- [x] Phase 13 — Admin property management
- [x] Phase 14 — Admin user management
- [x] Phase 15 — Admin regions & categories CMS
- [x] Phase 16 — Favorites & saved searches
- [x] Phase 17 — Contact & inquiry system
- [x] Phase 18 — Email notification system
- [x] Phase 19 — SEO & Core Web Vitals
- [x] Phase 20 — Security hardening
- [x] Phase 21 — Admin analytics & reporting
- [x] Phase 22 — Performance & caching layer
- [x] Phase 23 — Production deployment & monitoring scaffolding
- [x] Phase 24 — Mobile, API docs, feature flags, push, AI/payment scaffolds

## Known Production Follow-Ups

- Resolve dependency audit findings. Current automated remediation requires breaking upgrades for Next.js, next-intl, and next-pwa.
- Replace Auth.js JWT sessions with a true revocation strategy if immediate logout/session invalidation is required across all devices.
- Run restore drills for database backups before launch.
- Add real AI search only after pgvector/embedding infrastructure is designed and cost-controlled.
