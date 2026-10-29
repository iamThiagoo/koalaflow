# Tasks

## 1. Package and dependencies

- [x] 1.1 Record in `CLAUDE.md` and `openspec/config.yaml` that bounded contexts live in `apps/api/src/contexts/<context>/{domain,application,infra}` (moved to `packages/` only when a second app imports one), that use cases are classes with `execute()` in `<Name>.UseCase.ts` files, that `@nestjs/cqrs` arrives with the first domain event, and that Better Auth runs in `apps/api` with `apps/app` as frontend only; create `apps/api/src/contexts/auth/`; verify `pnpm check` passes
- [x] 1.2 Add `better-auth@1.7.12` (exact), `@better-auth/redis-storage@1.7.12`, `@aws-sdk/client-sesv2` and `ioredis@^5` to `apps/api`; run `pnpm audit --prod`, review install scripts and add any to `allowBuilds` (`false` unless needed); verify `pnpm install --frozen-lockfile` succeeds

## 2. Infra: Redis, database schema, CI

- [x] 2.1 Add `apps/api/src/infra/cache/` (one `ioredis` client from `REDIS_URL`, injected as `Redis`, closed on shutdown, `rediss:` required in production naming only `REDIS_URL`) and the Redis readiness check with a 2-second timeout; add `REDIS_URL` to `apps/api/.env.example` and the e2e `testEnv`; e2e: ready `200` with both up, `503` with `redis: down` within 3 seconds when booted with an unreachable Redis port, production with `redis://` exits non-zero naming `REDIS_URL` without printing it
- [x] 2.2 Generate Better Auth's table SQL with Better Auth's `getMigrations` (a throwaway script with MikroORM's Kysely and the options from design.md: plugins, `generateId: 'uuid'`, secondary storage) and commit it as a MikroORM migration (tables in `public`, `down` drops them); verify `pnpm nx db-migrate @koalaflow/api` applies it, a second run is a no-op, and ids default to `gen_random_uuid()`
- [x] 2.3 Run the check deferred from `api-foundation`: with Better Auth's tables present, `pnpm nx db-migration-create @koalaflow/api -- --name probe` generates no statements; delete the probe file and note the result in the PR (it failed without configuration, so `schemaGenerator.skipTables` lists Better Auth's tables and the probe was repeated)
- [ ] 2.4 Add a `redis:8.8.3-alpine` service with a health check to the `main` job in `.github/workflows/ci.yml`; verify the job's e2e step reaches Redis on the PR

## 3. Sign-in code

- [x] 3.1 Implement `generateCode` (6 symbols from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` with `crypto.randomInt`) and `normalizeCode` (uppercase, strip spaces and hyphens) in `apps/api/src/contexts/auth/domain/SignInCode.ts` with `Rule:` comments; unit tests: length, alphabet only, every symbol appears over 10,000 draws, normalization of `k7q-m4x` and ` K7Q M4X `

## 4. Better Auth in the api

- [x] 4.1 Implement `EmailSender` (SES v2 `SendEmail`, `EMAIL_FROM`, pt-BR text with the code, failures logged by error name only); add `EMAIL_FROM`, `AWS_REGION`, `AWS_ENDPOINT_URL` and dummy Floci credentials to `.env.example`; let `startApp` override providers and add an in-memory `EmailSender` capture for e2e; verify locally that a requested code appears in `GET http://127.0.0.1:4566/_aws/ses` after creating the sender identity in Floci
- [x] 4.2 Implement `createAuth` per design.md (shared MikroORM Kysely, `generateId: 'uuid'`, Redis secondary storage with `storeSessionInDatabase`, `rateLimit.enabled`, `trustedProxies` from `TRUSTED_PROXIES`, Google only when both variables are set (linking only with Google's `email_verified`), `emailOTP` with `generateOTP`, HMAC `storeOTP.hash` over the normalized code and the per-email cap in `sendVerificationOTP`, `organization` with creation and deletion disabled, logger forwarding level and message only) and refuse to start in production with `BETTER_AUTH_SECRET` missing or shorter than 32 characters; add the `BETTER_AUTH_*`, `GOOGLE_*` and `TRUSTED_PROXIES` entries to `.env.example`; e2e: both production refusals name `BETTER_AUTH_SECRET` and do not print the value; if the shared Kysely fails, switch to the dedicated `pg` pool fallback from design.md and record it there
- [x] 4.3 Implement `AuthController` (`@All('auth/*path')`, `@Public()`, the allowlist from design.md, then `toNodeHandler`) and `AuthModule`, imported by `AppModule`; e2e: `POST sign-up/email`, `POST update-user`, `POST organization/create`, `POST organization/delete` and `POST organization/invite-member` answer `404` with the uniform error body and change nothing
- [x] 4.4 E2E for the email-code flow: known and unknown emails get identical responses and one captured code from the alphabet each; malformed and 255-character emails `400` with no email sent; a second code invalidates the first; first sign-in creates a verified user and sets the cookie (`HttpOnly`, `SameSite=Lax`, no `Domain`); `k7q-m4x`-style input accepted; wrong code `400` without a cookie or user; expired code rejected (fake `Date` past 5 minutes); reused code rejected; correct code after 3 wrong attempts rejected; a new code works after the lockout; unknown body fields (`emailVerified`, `role`) have no effect; auth errors are JSON with `code` and `message`, carry `X-Request-Id` and have no stack, SQL or path; the code never appears in the response
- [x] 4.5 E2E for rate limits with `TRUSTED_PROXIES=127.0.0.1/32` and one `X-Forwarded-For` address per test: fourth code request in a minute `429`; sixth code for one email from different addresses in an hour gets the normal response and sends nothing; a forged prefix in `X-Forwarded-For` still gets `429`; the Redis key for the cap does not contain the email
- [x] 4.6 E2E for sessions: tampered token and a session past 7 days (fake `Date`) give no session from `get-session`; after `sign-out` the old token gives no session; `sign-out` with `Origin: https://evil.example` answers `403` and the session stays valid; user id and active organization id are UUIDs
- [x] 4.7 E2E for Google without real credentials (dummy `GOOGLE_*`): `sign-in/social` returns an authorization URL for `accounts.google.com`; a foreign `callbackURL` is rejected without a URL; `callback/google` with a missing or forged `state` creates no session
- [x] 4.8 E2E for logs: after requesting a code and signing in, no captured log line contains the code, the session token or the email address

## 5. Tenancy

- [x] 5.1 Implement `GetOrCreateSessionOrganizationUseCase` (`GetOrCreateSessionOrganization.UseCase.ts`: oldest membership's organization, else insert organization + `owner` membership in one transaction) and call it from the `session.create.before` hook to set `activeOrganizationId`; e2e: first sign-in yields an organization whose only member is the user as `owner`; a second sign-in reuses it and creates no organization
- [x] 5.2 Implement `GetTenantUseCase` (`GetTenant.UseCase.ts`), `SessionGuard` as `APP_GUARD` calling it, `@Public()` and `@CurrentTenant()`, and mark the health controller `@Public()`; unit test the guard's decisions (public, no session, bad or missing origin on `POST`/`DELETE`, no membership, member) with `getSession` and `GetTenantUseCase` stubbed; e2e with a test-only tenant route (`GET` and `POST`): no session and an invalid session `401` with the uniform body; health and `get-session` public; cross-origin and origin-less writes `403`; same-origin write runs; the route receives the session's organization and role; another organization's id in the query, body or `X-Organization-Id` has no effect; deleting the user's membership row makes the next call `403`

## 6. App

- [x] 6.1 Add `apps/app/.env.example` with `API_URL` and `src/proxy.ts` forwarding `/api/*` to `API_URL` (fixed host, path and query from the request); verify with the api and app running: `curl <app>/api/health/live` is `200 {"status":"ok"}`, `grep -r` for the api address in `apps/app/.next/static` finds nothing after `pnpm nx build @koalaflow/app`, and with the api stopped the response is an error without the api address
- [x] 6.2 Add the session gate to `proxy.ts` (no cookie → `/login` without calling the api; otherwise `get-session` with `cookie` and `X-Forwarded-For`; `/login` → `/` when signed in) and `src/lib/api.ts` (`server-only`, forwards `cookie` and `x-forwarded-for`); verify with `curl`: `/` without a cookie and with a revoked cookie redirects to `/login`, `/login` with a valid cookie redirects to `/`
- [ ] 6.3 Build `/` (Server Component: email and organization name, sign-out button) and `/login` (email step, code step, errors for wrong code, lockout and `429`, Google button, `?error=google` message), pt-BR copy and `lang="pt-BR"`; verify in a browser: email-code sign-in lands on `/` showing email and organization, a wrong code shows the error and allows a new code, sign-out returns to `/login` and `/` then redirects to `/login`
- [ ] 6.4 Add the security headers from design.md for every app response, including redirects issued by `proxy.ts`; verify with `curl -I` on `/login` and on the `/` redirect, and by loading `/login` in an iframe from another origin and seeing it blocked

## 7. Documentation

- [x] 7.1 Update the local stack steps in `CLAUDE.md` (`.env` entries for api and app, Floci sender identity, reading codes at `/_aws/ses`, running app and api together); verify the documented steps run as written from a fresh `.env`

## 8. Verification

- [ ] 8.1 With real Google dev credentials (redirect `http://localhost:3001/api/auth/callback/google`): sign in with Google lands on `/`; a user who signed up by email code and then uses Google with the same address gets the same user and organization
- [x] 8.2 Check that every risk in design.md has its task and test checked; run `/security-review` on the branch and fix the findings
- [x] 8.3 Review the diff for leftovers (Simplicity in `CLAUDE.md`), then run `pnpm check`, `pnpm exec openspec validate --all --strict --no-interactive` and `pnpm nx affected -t typecheck build test e2e`, and fix any failure

## Workflow follow-up

- Commit per area: `feat(auth): ...`, `feat(api): ...`, `feat(app): ...`, `ci: ...`, `docs: ...`.
- Follow-up changes: strict `script-src` CSP with nonces in `apps/app`; production SES with a domain (SPF/DKIM/DMARC); `api-infra` must set `TRUSTED_PROXIES` and keep the api private.
- Archive the change with `/opsx:archive` after review.
