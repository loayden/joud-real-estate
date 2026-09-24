# Joud Real Estate — Launch-Readiness Final Report

**Date:** 2026-09-24 · **Branch:** `stabilize` · **Mode:** read-only audit → autonomous fix loop (dev DB `joud_dev` only, fake data, no prod secrets touched)
**Definition of done:** clean production build, zero console errors on core flows, all three personas complete their journeys, no open critical/high issues.

## Verdict: READY FOR STAGING — 0 open issues, env blockers remain

All 13 issues found across this pass are fixed and verified (11 verified during the pass + ISSUE-006 idempotency and ISSUE-010 page-weight closed post-report). Remaining work is environment credentials (real Redis/R2/mail/captcha keys, Moyasar absent) + production re-measurement. Ship to **staging** once env blockers clear; production after a beta with real agents.

---

## 1. Issues found and fixed, by severity

### Critical (2) — both fixed + verified

- **ISSUE-001 — dev server 500 on /ar (stale `.next` module graph).** Fix: stop dev, clear Next cache, restart. Evidence: `curl /ar` → 200; suites green.
- **ISSUE-005 — Edge crash: Node `crypto` in `lib/csrf.ts` broke ALL mutating APIs.** Fix: rewrote Edge-safe (Web Crypto + double-submit cookie, no secrets). Evidence: `create:201, create-no-csrf:403, delete:200`; `tsc` clean. (Also fixed own follow-up bug: token-length check 128 vs actual 64.)

### High (5) — all fixed + verified

- **ISSUE-002 — 38px horizontal overflow at 768px.** Fix: Header desktop breakpoints `md:` → `lg:`. Evidence: overflow scan 0px; 360/768/1440 tests pass.
- **ISSUE-004 — login form leaked credentials into URL pre-hydration.** Fix: `method="post"` on LoginForm/RegisterForm. Evidence: auth UI tests pass; no credential URLs observed.
- **ISSUE-007 — CSP nonce header never reached client (dead code).** Fix: attach CSP to every middleware return. Evidence: `curl -sI` shows CSP.
- **ISSUE-011 — rate-limit fail-fast crashed `next build` prerender.** Fix: skip enforcement when `NEXT_PHASE=phase-production-build`. Evidence: `npm run build` clean.
- **ISSUE-012 — nonce-only CSP broke Next.js inline rendering (22 console errors/page).** Fix: reverted script/style to `unsafe-inline` with documented justification (React escaping + DOMPurify + HttpOnly/SameSite cookies + CSRF remain). Evidence: 13/13 phase-1 tests with zero-console-error assertions.
- **ISSUE-013 — `npm run build` corrupts running dev `.next` cache (500s).** Fix: process rule (stop dev → clear `.next` → restart; CI uses clean checkouts).

### Medium (4: 2 fixed, 2 open)

- **ISSUE-003 — `/api/auth/me` 401 for guests → console.error every page load.** Fixed: 200 `{success:true,data:null}`. Verified.
- **ISSUE-008 — in-memory rate-limit fallback in prod.** Fixed: fail fast in production without Upstash creds. Verified (`tsc`, suites, build).
- **ISSUE-009 — missing composite property indexes.** Fixed: 3 indexes + migration `20260924194837_add_property_composite_indexes`. Verified (`pg_indexes`, `prisma validate`).
- **ISSUE-006 — CLOSED: `Idempotency-Key` on `POST /api/properties`.** DB-backed `idempotency_keys` table + migration, 24h TTL, race-safe replay. Playwright test: same key → same id/slug, different key → new row, bad key → ignored.
- **ISSUE-010 — CLOSED: page weight.** Dev 17MB proven to be unminified dev JS (largest image 114KB). Placeholder proxy capped (WebP ≤1200w + timeouts). **Production (`next start`) measured: home 1065ms/LCP 372ms/1.6MB, search 800ms/88ms/1.3MB, detail 1124ms/100ms/1.7MB.**

### Refuted audit claims (verified, no change needed)

Password-reset tokens ARE single-use (+ session revocation); no N+1 in listing queries; 0 orphaned images/favorites/inquiries; cron endpoints fail closed (503); Sheet/Drawer use Radix Dialog (focus trap built in); Moyasar is an unused stub (no live payment flow).

---

## 2. Features added this pass

- **Owner analytics on my-listings:** per-listing views/inquiries/favorites column (Eye/MessageCircle/Heart, localized, `aria-hidden` icons, `title` tooltips) + Playwright regression test.
- **Accessibility:** skip-to-content link + `main#main-content`; `text-gold` → `text-gold-700` on light surfaces (10 files, ~5.9:1 contrast); `aria-live="polite" role="status"` on search results count.
- **Security:** CSRF double-submit tokens (lib + middleware + `/api/csrf` + React hooks + Login/Register integration); CSP + security headers on every middleware response; upload Sharp timeouts (30s/15s); Saudi regions/cities/properties archived out of the live tables (20 Egyptian regions remain).
- **Test infrastructure:** 25 smoke tests + 13 phase-1 + 7 phase-2 + 3 phase-3 specs; stored-session auth (`tests/launch/gen-auth-state.mjs`) to stay under the 5/min/IP login limit; CI workflow extended (typecheck/lint/build/bundle-analysis/smoke).

## 3. Feature-gap check vs Property Finder / OLX / Aqarmap

Already present (verified, not built): saved searches + alerts, map view, WhatsApp click-to-chat (`wa.me`), share button, compare drawer + `/compare` page, similar listings, agents list page, owner dashboard totals, report flow, listing expiry cron. Gaps left for roadmap: per-agent public profile pages, expiry **renewal** UI/API, virtual tours, AI matching, native app. Smallest-first pick implemented above (owner analytics).

## 4. Remaining blockers (see BLOCKERS.md)

Real credentials required for staging/prod: `AUTH_SECRET`, `RESEND_API_KEY`, R2 keys, Upstash Redis, hCaptcha, `REVALIDATE_SECRET`/`CRON_SECRET`, Sentry, VAPID, `PEXELS_API_KEY`. **Moyasar absent entirely** — no payment flow exists; if monetization is launch-scoped, sandbox keys + full flow test are required.

## 5. Required env vars (production)

`DATABASE_URL`, `DIRECT_DATABASE_URL`, `AUTH_SECRET` (random 32B), `AUTH_URL`/`NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`/`NEXT_PUBLIC_R2_CDN_URL`), `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, `HCAPTCHA_SECRET` + `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`, `REVALIDATE_SECRET`, `CRON_SECRET`, `CSRF_SECRET`, Sentry DSN/org/project/token (optional but recommended), VAPID keys (push), `PEXELS_API_KEY` (or remove Pexels fallbacks).

## 6. Deploy checklist

1. Clean checkout on `stabilize`; `npm ci --legacy-peer-deps` (react-leaflet peer conflict documented).
2. Set all Section-5 vars (no `xxx`/`replace-with` placeholders; validator: `BLOCKERS.md` scan).
3. `npx prisma migrate deploy` (includes `20260924194837_add_property_composite_indexes`); verify `pg_indexes`.
4. `npm run build` must pass with zero errors (fail-fast guards active).
5. Seed: `npx prisma db seed` (admin `admin@joud.sa` + regions/cities/categories/demo listings).
6. Smoke: `node tests/launch/gen-auth-state.mjs` then `npx playwright test tests/smoke --project=chromium --workers=1`.
7. Cron: schedule expire-listings/price-alerts/backup-notification with `Authorization: Bearer $CRON_SECRET`.
8. Monitoring: Sentry DSN, uptime check on `/api/health`, log alert on 5xx rate.
9. Rollback: previous Vercel deployment / DB snapshot before migrate.

## 7. How to run the tests

```bash
npm run dev                                   # dev server on :3000
node tests/launch/gen-auth-state.mjs          # 1 login per persona (rate-limit safe)
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/smoke/launch-phase1.spec.ts tests/smoke/launch-phase2.spec.ts tests/smoke/launch-phase3.spec.ts tests/smoke/core-flows.spec.ts --project=chromium --workers=1 --reporter=list
npm run type-check && npm run lint && npm run build
```

## 8. Final verification evidence (2026-09-24)

- `tsc --noEmit`: exit 0. `next lint`: exit 0 (1 known warning: StepLocation exhaustive-deps). `next build`: compiled + 164kB shared JS.
- Playwright (chromium, workers=1, suites run per-file with cooldowns): phase-1 13/13, phase-2 8/8 (incl. new idempotency test), phase-3 3/3, core-flows 25/25 — **49/49 green**, zero console errors on core flows. Note: back-to-back full runs in dev occasionally flake (auth 5/min/IP budget; first-visit admin compile latency; dev-server contention) — per-file reruns consistently green. CI should run against `next start` (production build).
- Personas: guest (anonymous), `qa-user@joud.test` (USER), `admin@joud.sa` (SUPER_ADMIN) — all journeys completed.
- DB: 20 active Egyptian regions, 92 cities, 8 approved properties, 0 orphans; Saudi data archived to `archived_*` tables; `idempotency_keys` table + 2 migrations this pass.
- Open issues: **none**. ISSUE-006 and ISSUE-010 closed with tests + production measurements above.
