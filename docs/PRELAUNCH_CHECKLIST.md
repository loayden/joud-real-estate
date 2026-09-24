# Production Pre-Launch Checklist

Use this checklist before any production launch or major release. Do not store real secrets in this file.

## Infrastructure

- [ ] Vercel project created with production domain `joud.sa`
- [ ] Production region set to `bom1`
- [ ] Supabase Pro database created with PITR enabled
- [ ] Cloudflare DNS proxied for `joud.sa`
- [ ] Cloudflare WAF rules reviewed and enabled
- [ ] R2 production bucket `joud-images-prod` created
- [ ] R2 backup bucket configured through `R2_BACKUP_BUCKET_NAME`
- [ ] CDN subdomain `images.joud.sa` configured and proxied

## Environment Variables

- [ ] `NEXT_PUBLIC_APP_URL=https://joud.sa`
- [ ] `DATABASE_URL` points to Supabase PgBouncer pooler
- [ ] `DIRECT_DATABASE_URL` points to direct Supabase connection
- [ ] `AUTH_SECRET` is a unique 32-byte production secret
- [ ] `CRON_SECRET` is set in Vercel for protected cron routes
- [ ] `REVALIDATE_SECRET` is set in Vercel
- [ ] Resend production sender domain verified
- [ ] R2 production credentials scoped to the required buckets only
- [ ] Upstash Redis production REST credentials configured
- [ ] Sentry DSN, org, project, and auth token configured in CI/Vercel
- [ ] hCaptcha production site key and secret configured

## Database

- [ ] `npx prisma migrate deploy` completed against production
- [ ] Seed run completed intentionally for baseline regions/categories
- [ ] Admin account verified and default password rotated
- [ ] Backup workflow secrets configured in GitHub
- [ ] First manual backup workflow run completed successfully
- [ ] Restore drill completed against a non-production database

## Application Smoke Tests

- [ ] `https://joud.sa/ar` loads with HTTPS
- [ ] `/api/health` returns `status: ok`
- [ ] `/ar/login` renders and accepts valid credentials
- [ ] User registration and email verification flow tested
- [ ] Property submission -> admin approval -> public listing flow tested
- [ ] Image upload flow tested against production R2
- [ ] Search and filter flow tested with Arabic query text
- [ ] Inquiry form sends owner notification
- [ ] Admin dashboard and moderation pages load for admin roles only
- [ ] Unknown routes show localized 404
- [ ] Runtime errors show localized error page and are captured by Sentry

## Security

- [ ] `npm audit` reviewed and remediation decision recorded
- [ ] No secrets committed to git history
- [ ] Vercel environment variables scoped by environment
- [ ] `/admin`, `/dashboard`, and `/api` disallowed in `robots.txt`
- [ ] Security headers verified in production responses
- [ ] hCaptcha verified on public registration/contact flows
- [ ] Rate limits tested for auth, search, inquiry, and upload endpoints
- [ ] CORS origin policy tested against non-owned domains

## Observability

- [ ] Sentry test error captured
- [ ] Sentry source maps uploaded from CI
- [ ] `/api/health` added to uptime monitor
- [ ] Cron endpoints monitored by Vercel/Sentry
- [ ] Vercel Analytics verified
- [ ] Cloudflare analytics verified
- [ ] Backup workflow failure notifications configured in GitHub

## Performance

- [ ] Lighthouse Performance score is 80 or higher on key pages
- [ ] Lighthouse SEO score is 95 or higher
- [ ] Lighthouse Accessibility score is 90 or higher
- [ ] Core Web Vitals checked on homepage, listing page, and property detail page
- [ ] Above-the-fold property images load through `next/image`

## Launch Approval

- [ ] Product owner approval
- [ ] Engineering owner approval
- [ ] Security owner approval
- [ ] Rollback plan documented
- [ ] Launch window and on-call owner confirmed
