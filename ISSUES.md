# Launch-Readiness Issues Log

> Rule: every "works/fixed" needs evidence (Playwright run, screenshot, curl, or test result).
> Loop: find -> log -> fix -> re-test -> next.

## Format

- **ID**: ISSUE-###
- **Severity**: critical / high / medium / low
- **Area**: guest / auth / listing-crud / admin / api / db / uploads / security / a11y / seo / perf / i18n / mobile
- **Status**: open / verified

---

## Open

### ISSUE-013 — high — devops — `npm run build` corrupts the running dev server's `.next` cache (recurrence of ISSUE-001 class)

- Steps: run `npm run build` while `next dev` is running → subsequent SSR page renders 500 (`Cannot find module './vendor-chunks/@sentry.js'`); API routes unaffected (search API 200 while `/ar` 500).
- Root cause: production build overwrites `.next/` out from under the dev server's incremental cache.
- Fix: stop dev → clear `.next` → restart dev. Process rule: never build and serve-dev from the same directory concurrently; CI uses clean checkouts.
- Status: VERIFIED (recurrence confirmed the rule: after `npm run build`, dev served 404s on `/_not-found` routing; stop → `rm -rf .next` → restart restores 200s).
- Recurrence evidence: 2026-09-24 final pass — `/ar` 200 before build, 404 after build with dev still running; API routes unaffected.

### ISSUE-012 — high — security — nonce-only CSP broke the app's own inline scripts/styles (22 console errors/page) — VERIFIED

- Steps: after attaching nonce-only CSP in middleware, every page logged `Executing/Applying inline script/style violates CSP` (Next.js App Router inlines critical scripts/styles; middleware nonces can't reach Next's renderer).
- Root cause: my ISSUE-007 fix was architecturally wrong for Next.js (no per-request nonce plumbing into RSC render).
- Fix: reverted script-src/style-src to `'unsafe-inline'` (documented justification in `buildCsp()`); kept strict default-src/object-src/frame-ancestors/base-uri/form-action + allowlists. XSS defense: React escaping + DOMPurify + HttpOnly/SameSite cookies + CSRF tokens.
- Evidence: 13/13 phase-1 tests pass with zero-console-error assertions; `tsc` clean.
- Status: VERIFIED.

### ISSUE-006 — medium — listing-crud — no idempotency on `POST /api/properties` (double-submit creates duplicates)

- Steps: send two identical `POST /api/properties` concurrently as qa-user → both return 201 with different IDs.
- Root cause: no `Idempotency-Key` handling; uniqueness only on slug (generated, so never collides).
- Mitigation in place: UI disables submit while pending (`isSubmitting`).
- Fix (recommended): accept optional `Idempotency-Key` header, store key per user with 24h TTL, return original response on replay. Post-launch.
- Status: open.

### ISSUE-010 — medium — perf — page weight 17–23MB in dev, mostly oversized Pexels placeholder variants

- Evidence: transfer-weight probe (dev): home 17MB/LCP 696ms, search 18MB/LCP 2436ms, detail 23MB/LCP 1220ms; `/_next/image?...placeholder...&w=3840` upscales the local placeholder proxy.
- Root cause: demo properties have no real images → every card hits `/api/pexels/placeholder`, Next Image generates up to 3840w variants.
- Why not a blocker: production listings use R2 uploads + Next AVIF/WebP; Pexels sources capped w=1200/1600; JS bundle healthy (164kB shared).
- Fix (recommended): cap placeholder proxy width (max 1200w); re-measure in production.
- Status: open (post-launch tune).

---

## Observation (not a blocker)

- OBS-001 — auth rate limit (5 logins/min/IP) trips test suites that log in repeatedly; suites now use stored sessions (`tests/launch/gen-auth-state.mjs`). Product note: per-IP limiting can collide for users behind shared NAT; consider per-account limiting + CAPTCHA instead of tightening further. No change made.

---

## Verified

- Phase 0 baseline: `tsc --noEmit` exit 0, `next lint` exit 0 (1 known warning in StepLocation.tsx), `next build` exit 0, `prisma migrate status` = "Database schema is up to date", dev server 200 on /ar and /en.
- ISSUE-001 — critical — dev server 500 on /ar (stale .next module graph): fixed by dev restart + cache clear. Evidence: `curl /ar` → 200, `/en` → 200; phase-1 suite green.
- ISSUE-002 — high — 38px horizontal overflow on home at 768px: fixed by moving Header desktop nav/actions `md:` → `lg:`. Evidence: overflow scan 0px; viewport tests 360/768/1440 pass.
- ISSUE-003 — medium — `/api/auth/me` 401 for guests → console.error on every page: fixed to 200 `{success:true,data:null}`. Evidence: curl + phase-1 console-error assertions.
- ISSUE-004 — high — login form leaks credentials into URL pre-hydration: fixed with `method="post"` on LoginForm/RegisterForm. Evidence: phase-2 auth UI tests pass; no credential URLs observed.
- ISSUE-005 — critical — Edge crash from Node `crypto` in `lib/csrf.ts` broke all mutating APIs: rewrote Edge-safe (double-submit cookie, Web Crypto). Evidence: `create:201, create-no-csrf:403, delete:200`; `tsc` clean.
- ISSUE-007 — high — CSP nonce header never reached client: attach CSP to every middleware return path. Evidence: `curl -sI /ar` shows per-request nonce CSP.
- ISSUE-008 — medium — rate limiting in-memory fallback in prod: fail fast in production without Upstash creds. Evidence: `tsc` clean; dev suites unaffected.
- ISSUE-009 — medium — missing composite property indexes: added 3 + migration `20260924194837_add_property_composite_indexes`. Evidence: `pg_indexes` + `prisma validate` OK.
- Phase 5 fixes: skip link + `main#main-content` (verified visible-on-focus); `text-gold` → `text-gold-700` on light surfaces (10 files); `aria-live="polite" role="status"` on search results count. Evidence: DOM probes + `tsc` clean.
- Phase 6 feature: per-listing performance stats (views/inquiries/favorites) on my-listings table. Evidence: header + 7 cells/row probe; new Playwright test passes.
- Refuted audit claims (verified, no change needed): password-reset tokens ARE single-use (+ session revocation); no N+1 in listing queries (single Prisma include); 0 orphaned images/favorites/inquiries; cron endpoints fail closed (503 when unconfigured); Sheet/Drawer use Radix Dialog (focus trap built in); Moyasar is an unused stub (no live payment flow — see BLOCKERS.md).
