# Proposal

## Why

Every product slice (library, ingestion, playback) needs an authenticated user and a tenant taken
from the session, and today `apps/api` has no authentication at all. The tenant model and the
session trust path are decided once here, before the first tenant-scoped table exists, because
changing them later means rewriting every query filter and every S3 key.

## What Changes

- **BREAKING (docs)**: authentication moves from `apps/app` to `apps/api`. Better Auth runs inside
  the api and owns its tables in the `public` Postgres schema; `apps/app` is a frontend only. `CLAUDE.md` and
  `openspec/config.yaml` are corrected.
- Add the `identity` bounded context in `apps/api/src/contexts/auth/`, and record in `CLAUDE.md` that
  bounded contexts live in `apps/api/src/contexts/<context>` (moved to `packages/` only when a second app
  imports one) and that use cases are `<Name>.UseCase.ts` classes.
- Passwordless sign-in: a 6-character alphanumeric code sent by email (implicit sign-up), or
  Google. A Google account and an email-code account with the same address are the same user.
- Tenant = organization. Each user gets a personal organization as `owner` at first sign-in, and
  the session's active organization is the tenant. Creating more organizations, invitations,
  membership changes and organization deletion are not available in this version.
- A global guard in the api denies every route by default: it requires a session and a current
  membership in the active organization, and gives handlers the tenant. Health and auth routes are
  the only public routes.
- Rate limits on code sending and sign-in (per IP, in Redis) plus a per-email cap on codes sent.
- Email sent through the SES API: Floci locally, real SES later (needs a domain).
- `apps/app`: `proxy.ts` forwards `/api/*` to the api (same origin for the browser) and redirects
  dashboard pages without a session to `/login`; a `/login` page with the email-code and Google
  flows; sign-out; baseline security headers.
- Readiness also checks Redis; production refuses to start with Redis without TLS.

## Capabilities

### New Capabilities
- `identity-authentication`: sign-in by email code and Google, sessions, sign-out and the abuse
  limits around them.
- `identity-tenancy`: personal organization on first sign-in, tenant resolution from the session
  and deny-by-default access for api routes.
- `dashboard-access`: how `apps/app` reaches the api, gates dashboard pages behind a session and
  presents the sign-in flow.

### Modified Capabilities
- `api-http-baseline`: auth routes under `/api/auth/*` answer errors in Better Auth's format
  instead of the uniform error body.
- `api-health`: readiness also checks Redis.
- `api-configuration`: production also requires TLS for Redis and an auth secret.

## Impact

- Bounded contexts: `identity` (new). No other context exists yet.
- Code: `apps/api` (new `src/contexts/auth/`, module wiring, `@Public()` on health, readiness check,
  env); `apps/app` (`proxy.ts`, `/login`, home page, server-side api helper, headers); new
  migration in `apps/api/src/infra/database/migrations/` for Better Auth's tables;
  `.github/workflows/ci.yml` (Redis service for e2e); `CLAUDE.md`, `openspec/config.yaml`.
- Dependencies: `better-auth`, `@better-auth/redis-storage`, `ioredis`, `@aws-sdk/client-sesv2`
  (api side only; reasons in design.md). `apps/app` adds none.
- Out of scope: production SES, domain and DNS records (SPF/DKIM/DMARC); production api
  infrastructure, network isolation and real `TRUSTED_PROXIES` values (`api-infra`); invitations,
  roles other than `owner`, organization switching or deletion; 2FA, passkeys, SSO; a strict
  `script-src` CSP for `apps/app` (needs nonces, separate change); `/embed/[videoId]` and playback
  tokens; account deletion and data export.
- Security: security-sensitive (authentication, sessions, tokens, tenant resolution, rate limits,
  personal data in Better Auth's tables, outbound email, new dependencies); see `design.md`.
