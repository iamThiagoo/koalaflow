# Design

## Context

`apps/api` has the platform baseline from `api-foundation` (env config read where used, MikroORM 7
on Postgres with per-owner schemas, nestjs-pino, a global exception filter, `StrictValidationPipe`,
helmet, `json({ limit: '1mb' })` applied to every route in `HttpModule`, health endpoints) and no
authentication. `apps/app` is the Next 16 scaffold (one page, `lang="en"`, no `proxy.ts`, no
headers) on port 3001. Compose already runs Redis and Floci; CI's `main` job has only a Postgres
service. `@nestjs/cqrs` is not installed.

Decided with the user while exploring (motivation in proposal.md - Why):
- Better Auth runs in `apps/api`; `apps/app` is a frontend only and reaches the api through its own
  origin. This reverses the earlier "Better Auth in `apps/app`" note in `CLAUDE.md`,
  `openspec/config.yaml` and the archived `api-foundation` design.
- Dashboard pages render on the server with the session; the tenant is the organization.
- Passwordless sign-in: a 6-character alphanumeric email code, plus Google.
- Better Auth over a custom implementation because it means less code of our own; we use its
  defaults unless there is a reason not to.
- Bounded contexts live in `apps/api/src/contexts/<context>/` until a second app imports one; use cases are
  plain classes with `execute()` in `<Name>.UseCase.ts` files (no command/query bus until there are
  domain events). `CLAUDE.md` and `openspec/config.yaml` record both rules.

Verified against `better-auth@1.7.12` (the latest version, which includes the fixes for the 2026
advisories): `emailOTP` options (`generateOTP`, `otpLength`, `allowedAttempts` default 3,
`expiresIn` default 300 s, custom `storeOTP.hash`, `rateLimit`), a Kysely instance, `advanced.database.generateId: "uuid"`, `advanced.ipAddress.trustedProxies`,
`secondaryStorage` (`@better-auth/redis-storage`), `organization` (`allowUserToCreateOrganization`,
server-side creation with `userId`, `disableOrganizationDeletion`). Telemetry is off by default.

## Goals / Non-Goals

**Goals:**
- One place that turns a request into `{ userId, organizationId, role }` or a rejection, so later
  contexts only declare routes and filter by `organizationId`.
- Better Auth stays inside `src/contexts/auth/infra`; other contexts import only `@Public()`,
  `@CurrentTenant()` and the `TenantContext` type.

**Non-Goals:**
- No domain events: nothing consumes identity events yet. Organization deletion (future) publishes
  `OrganizationDeleted` through the outbox so other contexts can clean up.
- No caching of membership lookups; add a short Redis cache only if it shows up in latency.
- No end-to-end test runner for `apps/app` (Playwright); the app flows are verified by hand in
  this change.

## Decisions

### Layout: `apps/api/src/contexts/auth`
```
apps/api/src/contexts/auth/
  domain/
    SignInCode.ts                        generate + normalize (pure, node:crypto) + unit test
    TenantContext.ts                      type TenantContext { userId, organizationId, role }
    AbstractOrganization.Repository.ts, AbstractUser.Repository.ts  repository ports (abstract classes, Nest tokens)
  application/
    GetTenant.UseCase.ts                 (userId, activeOrganizationId) -> TenantContext | null
    GetOrCreateSessionOrganization.UseCase.ts  user -> organizationId (oldest membership or new org)
  infra/
    auth.ts                                Better Auth instance (provider factory)
    Auth.Controller.ts                     @All('auth/*path'): allowlist, then Better Auth handler
    Session.Guard.ts                       global guard: public? -> session -> origin -> GetTenant
    Public.Decorator.ts, CurrentTenant.Decorator.ts
    Email.Sender.ts                        SES v2 SendEmail
    Organization.Repository.ts, User.Repository.ts  repository adapters (raw SQL on MikroORM's connection)
    Auth.Module.ts                     providers + APP_GUARD
```

The use cases hold our rules and are what the unit tests target. The guard, the controller and the
Better Auth hook are adapters that call them. The sign-in, Google and sign-out flows belong to
Better Auth and are not wrapped in use cases, since wrapping them would add no rule. The use cases
read and write Better Auth's tables through repository ports declared in `domain` (abstract
classes, so they double as Nest injection tokens); the adapters in `infra` run bound raw
SQL on MikroORM's connection, the same pool Better Auth uses through `em.getKysely()`, with no
MikroORM entity for those tables. `OrganizationRepository.createWithOwner` inserts the
organization and the `owner` membership in one statement.

Aggregates (persisted in Better Auth's tables in `public`): **User** (email, verified flag, linked
**Account**s for Google), **Organization** with its **Member**ships (role `owner` only in this
change), and **Session** (token, expiry, `activeOrganizationId`). Better Auth implements the User
and Session behavior; ours is the code format, the personal organization and tenant resolution.

Alternatives considered: `packages/identity` as a library package, which is the earlier `CLAUDE.md`
rule. It costs a package, a build and a tsconfig per context with no second importer (the worker
talks through SQS). Also `@nestjs/cqrs` command/query buses, which add indirection while each use
case has one caller and no events exist.

### Mounting Better Auth inside Nest
`AuthController` handles `@All('auth/*path')` under the `api` prefix and is `@Public()`. It first
checks the path against a fixed allowlist and throws a 404 `ApiException` for anything else. It then
calls `toNodeHandler(auth)(req, res)`. Because it is a route, the global middleware has already
run: pino-http (request id, log line), helmet and `json({ limit: '1mb' })`. better-call reuses
`req.body` when the stream has already been read, so the body limit and malformed-JSON handling
stay ours. Better Auth writes its own responses, so its errors use its JSON (`code`, `message`),
as stated in the `api-http-baseline` delta.

Allowlist (method + path): `GET get-session`, `POST sign-out`,
`POST email-otp/send-verification-otp`, `POST sign-in/email-otp`, `POST sign-in/social`,
`GET callback/google`, `GET organization/get-full-organization`, `GET error`. Any other path,
including ones added by later library upgrades, answers 404.

Alternatives considered: `@thallesp/nestjs-better-auth` (community-maintained, one more dependency
for what is a few lines here); `disabledPaths` (a denylist, so new upstream endpoints would be open
by default); `hooks.before` in Better Auth (also applies to our own server-side `auth.api` calls,
such as the organization creation below).

### Better Auth configuration (defaults unless listed)
- `baseURL`/`secret` from `BETTER_AUTH_URL`/`BETTER_AUTH_SECRET`, which Better Auth reads by
  itself. `BETTER_AUTH_URL` is the app's public origin, because browsers only ever see the app; it is
  also the only trusted origin.
- Database: `{ db: em.getKysely(), type: 'postgres' }`, so the tables live in `public` with
  every other table. This shares
  MikroORM's pool, TLS settings and readiness check, so there is no second pool. Fallback, if the
  shared Kysely misbehaves when the sign-in e2e first runs: a dedicated `pg` `Pool` built from the
  same `DB_*` variables. That costs one extra pool, and the spec does not change.
- `advanced.database.generateId: 'uuid'` (Postgres `gen_random_uuid()`).
- `secondaryStorage: redisStorage(redis)` with `session.storeSessionInDatabase: true`. Sessions are
  read from Redis on the hot path (every SSR request checks the session), and they survive a Redis
  flush. Rate-limit counters go to Redis too, which is Better Auth's default once secondary storage
  exists.
- `rateLimit.enabled: true` (the default is production only; tests and local runs must behave the
  same). `advanced.ipAddress.trustedProxies` comes from `TRUSTED_PROXIES` (comma-separated CIDRs).
- `emailAndPassword` is not enabled (its default). `socialProviders.google` is registered only when
  `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set, so local runs and e2e work without Google
  credentials. Account linking keeps Better Auth's default: a Google account links to an existing
  user only when Google reports the email as verified (a trusted provider would skip that check).
- Plugins: `emailOTP` and `organization` only.
- `advanced.disableOriginCheck: false`, set explicitly: Better Auth turns its origin and
  `callbackURL` checks off when `NODE_ENV=test` (found during apply, when the cross-origin sign-out
  and foreign `callbackURL` e2e passed through). Fixing it keeps tests honest and keeps any
  environment that sets `NODE_ENV=test` protected.
- A `hooks.before` rejects emails over 254 characters on the code request route; Better Auth checks
  the format but not the length. Sign-in needs no check, since no code is ever issued for such an email.
- Better Auth checks its schema in the background at startup (auth requests also await it). The
  api must start with the database down (liveness/readiness), so the check is not awaited at
  startup; `AuthModule.beforeApplicationShutdown` waits for it instead, because closing the
  pool under that query hung `app.close()` (found as a flaky e2e during apply).
- The provider is typed with a narrow `Auth` interface (`handler`, `api.getSession`, `$context`):
  Better Auth's inferred type cannot be emitted in declaration files, and the narrow type lists
  exactly what the api relies on.
- `logger.log` forwards the level and message to Nest's logger (pino) without the extra arguments,
  which can hold request data.

### Sign-in code
- `generateOTP`: 6 characters from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (31 symbols: no `0 O 1 I L`),
  each picked with `crypto.randomInt` (uniform, no modulo bias). There are 31^6 = 887,503,681
  possible codes.
- `normalizeCode`: uppercase, then strip spaces and hyphens.
- `storeOTP: { hash }` stores an HMAC-SHA256 of the normalized code keyed with
  `BETTER_AUTH_SECRET`. Better Auth applies the same `hash` to the submitted code and compares the
  two in constant time, so normalizing inside `hash` gives case and separator tolerance with no
  other hook. A plain hash of a 6-character code can be brute-forced offline in seconds, while the
  HMAC needs the secret too.
- Plugin defaults kept: 5-minute expiry, 3 attempts and then lockout, `resendStrategy: 'rotate'`,
  implicit sign-up, and 3 requests per minute per IP on send, check and sign-in.
- `sendVerificationOTP` returns without sending for any type but `sign-in` (the allowed route also
  accepts `email-verification` and `forget-password` in its body), then increments
  `identity:otp-sends:<HMAC(email)>` in Redis (`INCR` and `EXPIRE` in one Lua script, 1 hour). Above 5 it returns
  without sending; otherwise it calls `EmailSender.sendSignInCode` without awaiting it, as Better Auth
  recommends against timing attacks. A send failure is logged with the error name only, because SES
  error messages can include the address.

### Personal organization and the active organization
`databaseHooks.session.create.before` runs for every new session (email code or Google) and calls
`GetOrCreateSessionOrganizationUseCase`. The use case returns the user's oldest membership's
organization; if there is none, it inserts an organization and an `owner` membership in one
transaction. The organization's name is the user's name, or the email's local part when the name
is empty, and its slug is a random UUID. The hook returns the session with `activeOrganizationId`
set. Doing this at session creation, rather than at user creation, also repairs a user left without
an organization by an earlier failure. Writing the rows directly, instead of calling
`auth.api.createOrganization` from inside Better Auth's own hook, avoids a circular dependency and
makes the organization and membership atomic. `allowUserToCreateOrganization: false` and
`disableOrganizationDeletion: true` close the HTTP side, and the allowlist hides the other
organization mutations.

### Guard and tenant
`SessionGuard` is registered as `APP_GUARD` from `AuthModule`, so every route in the api,
current and future, is closed unless it is marked `@Public()`. It runs these steps in order:
1. `@Public()` metadata: the route runs.
2. `auth.api.getSession({ headers })`; none → `ApiException(401)`.
3. `POST`/`PUT`/`PATCH`/`DELETE`: `Origin` must equal the origin of `BETTER_AUTH_URL`, else
   `ApiException(403)`. This is the `CLAUDE.md` rule for cookie-authenticated routes; Better Auth
   does the same for its own routes.
4. `GetTenantUseCase` reads the user's membership in `session.activeOrganizationId` from
   `member` on every request; none (or no active organization) → `ApiException(403)`.
5. `req.tenant = { userId, organizationId, role }`, read by `@CurrentTenant()`.

Nothing in the request can choose the organization. The health controller gets `@Public()`.
Rule: a route without `@CurrentTenant()` must still be public or tenant-free by design; contexts
filter every query by `tenant.organizationId`.

### Email: SES v2 API, Floci locally
`EmailSender` wraps `SESv2Client.send(SendEmailCommand)` (plain-text pt-BR message with the code).
It reads `EMAIL_FROM`, and the SDK picks up `AWS_REGION` and `AWS_ENDPOINT_URL` from the
environment by itself. Floci implements SES v2 `SendEmail`, requires a verified sender identity
(created once with `aws --endpoint-url http://127.0.0.1:4566 sesv2 create-email-identity`) and
lists sent mail at `GET http://127.0.0.1:4566/_aws/ses`, where developers read their code. e2e
tests replace `EmailSender` with an in-memory capture through `overrideProvider`, so CI needs no
Floci. In production the api role gets `ses:SendEmail` on the domain identity (`api-infra` plus a
domain), with no SMTP credentials.

Alternative considered: Mailpit + SMTP (nodemailer) locally and the SES API in production. That
means two transports, one more dependency, and static SMTP credentials if SMTP were used in
production too.

### Redis: cache module
`apps/api/src/infra/cache/` provides one `ioredis` client (`Redis` class as the injection token)
from `REDIS_URL`, closed on shutdown, and adds the Redis readiness check. In production
`rediss:` is required, failing like `DB_SSL` does and naming only the variable. Redis is infra
code because rate limiting and caching will serve every context.

### Configuration
| Variable | Where | Notes |
|---|---|---|
| `BETTER_AUTH_SECRET` | api | ≥ 32 chars in production (Better Auth only warns; we refuse to start), Secrets Manager |
| `BETTER_AUTH_URL` | api | app public origin, e.g. `http://localhost:3001` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | api | optional locally; secret from Secrets Manager |
| `REDIS_URL` | api | `redis://127.0.0.1:6379` locally |
| `TRUSTED_PROXIES` | api | empty locally; set by `api-infra` |
| `EMAIL_FROM`, `AWS_REGION`, `AWS_ENDPOINT_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | api | the last three only locally for Floci (dummy values) |
| `API_URL` | app | server-only, read at request time; never `NEXT_PUBLIC_` |

### `apps/app`
- `src/proxy.ts` (Node runtime, reads `API_URL` per request, matcher excludes `_next/*` and static
  files):
  - `/api/*` → forwarded with `fetch` to `new URL(pathname + search, API_URL)` (method, headers
    without hop-by-hop ones, streamed body, `redirect: 'manual'` so the Google callback's 302
    reaches the browser), and the api's response is returned as is; 502 with no body when the
    api is unreachable. The host is fixed, so no request can choose the upstream. Found during
    apply: `NextResponse.rewrite` always adds `x-middleware-rewrite` with the full target URL to the
    response, and a `next.config` rewrite would put the address in the client build manifest.
  - Every other page: when no session cookie is present, redirect to `/login` without calling the
    api. Otherwise call `GET /api/auth/get-session` with the cookie and `X-Forwarded-For`, and
    redirect to `/login` when it returns no session. `/login` redirects to `/` when a session
    exists. This is a UX gate only; the api authorizes every call.
- `src/lib/api.ts` (`server-only`): `apiFetch` for Server Components. It forwards `cookie` and
  `x-forwarded-for` so the api rate-limits per client and not per Next server.
- `/login` (client component): email step → code step → `/`; the Google button posts
  `sign-in/social` with `callbackURL: '/'` and `errorCallbackURL: '/login?error=google'` and follows
  the returned URL. It uses plain `fetch` to relative `/api/auth/...` paths, with no Better Auth
  client dependency in the app.
- `/` (Server Component): the session's email and the organization name (`get-full-organization`),
  plus a sign-out button (client component: `POST sign-out`, then `router.replace('/login')`).
- `next.config.ts` `headers()` for `/:path*`: HSTS, `nosniff`, `strict-origin-when-cross-origin`,
  CSP `frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`. If Next
  does not apply them to redirects issued by `proxy.ts`, the proxy sets them on its redirects too.
- UI copy is pt-BR and `lang="pt-BR"`, like `apps/site` (assumption; the product targets Brazil).

### Migration for Better Auth's tables
Generated once with Better Auth's `getMigrations` (the same code its CLI runs), using MikroORM's
Kysely and the options of `auth.ts` (plugins, `generateId`, secondary storage). The
result is committed as a MikroORM migration with raw SQL (the tables in `public`;
`down` drops them), so migrations stay one pipeline (`db-migrate`). With Redis as secondary
storage there is no `verification` table: codes live in Redis with their TTL.

The check deferred by `api-foundation` failed. Even with an entity in another schema, MikroORM
7.2.5's `migration:create` generated statements that drop every Better Auth table, so the
`api-foundation` claim that the diff only loads the entities' schemas was wrong. The tables first
lived in an `identity` schema excluded with `schemaGenerator.ignoreSchema`; they moved to `public`
to keep a single schema, so the config now lists them in `schemaGenerator.skipTables`, and a probe
migration contains no statement for them. A plugin that adds a table must add it to that list. Library upgrades that change the schema need a
new generated migration.

### New dependencies
| Package | Where | Why |
|---|---|---|
| `better-auth` (exact `1.7.12`) | identity | auth flows, sessions, OAuth, organizations |
| `@better-auth/redis-storage` (`1.7.12`) | identity | official secondary storage for sessions and rate limits |
| `ioredis` (`^5`, its peer range) | api infra | Redis client for storage, the per-email cap and readiness |
| `@aws-sdk/client-sesv2` | identity | sending the code; the SDK is already the AWS path for later contexts |

Each one passes `pnpm audit --prod` and an install-script review (`allowBuilds`) when added.

## Risks / Trade-offs

- [Brute-forcing a sign-in code] (A07 Identification and Authentication Failures) → 31^6 codes, 3
  attempts per code, at most 5 codes per email per hour and 3 attempts per IP per minute. This
  bounds an attacker to about 15 guesses per email per hour, against 887 million codes → e2e:
  lockout after 3, per-IP `429`, per-email cap; unit: alphabet and length.
- [Codes or tokens leaked from the database or logs] (A02 Cryptographic Failures, A09 Logging
  Failures) → codes stored as an HMAC with the server secret, session tokens are opaque, request
  logs carry no bodies or query strings, the Better Auth logger forwards messages only, and SES
  errors are logged by name → e2e: log scan after a full sign-in finds no code, token or email.
- [Cross-tenant access] (API1 BOLA) → the tenant comes only from the session's active organization,
  membership is re-checked on every request, and organization ids in the input are ignored → e2e
  on a test-only tenant route: ids injected in the query, body or header have no effect; a removed
  membership returns `403`.
- [Unauthenticated access to future routes] (API5 Broken Function Level Authorization) → global
  deny-by-default guard; `@Public()` is explicit → e2e: test-only route without a session `401`,
  health routes public.
- [CSRF] (A01 Broken Access Control) → `SameSite=Lax`, Better Auth's origin check on auth routes
  (forced on in every environment),
  the guard's `Origin` check on api routes, and no state change on `GET` → e2e: cross-origin
  sign-out `403`, cross-origin and origin-less `POST`/`DELETE` on the test route `403`.
- [Session theft] (A07) → `HttpOnly`, `Secure` in production, host-only, opaque token, server-side
  revocation on sign-out, 7-day expiry → e2e: tampered, expired (fake `Date`) and signed-out tokens
  give no session; cookie attributes asserted.
- [Account takeover through account linking] (A07) → Google links only with `email_verified`
  (no trusted providers, found in the security review), so a verified Google email or a code
  delivered to the inbox are the only proofs of ownership. Accepted
  residual: whoever controls the mailbox controls the account, which is inherent to email sign-in.
  → manual check with real Google credentials (task 8.1).
- [Account enumeration] (API3, A07) → identical response for known and unknown emails, implicit
  sign-up, and the per-email cap also answers normally → e2e compares both responses.
- [Email bombing / SES reputation] (API4 Unrestricted Resource Consumption) → per-IP limit plus
  per-email cap → e2e.
- [Rate limits bypassed with a forged `X-Forwarded-For`] (API4) → `trustedProxies` walks the chain
  from the right, skipping only configured hops → e2e with `TRUSTED_PROXIES=127.0.0.1/32` and a
  forged prefix. **Accepted until `api-infra`**: without `TRUSTED_PROXIES` in production, Better
  Auth puts every request in one shared bucket (it fails closed, not open), and the api must not be
  reachable except through the app. No production api exists before `api-infra`.
- [OAuth state forgery or open redirect] (A01, A07) → Better Auth's state cookie and PKCE,
  `callbackURL` checked against the app origin, and the app sends only fixed relative URLs → e2e:
  forged state creates no session; foreign `callbackURL` rejected.
- [Unused auth endpoints, including ones added by upgrades] (API9 Improper Inventory Management)
  → allowlist in `AuthController` → e2e: password sign-up, `update-user` and organization
  mutations `404`.
- [Vulnerable dependency] (A06 Vulnerable and Outdated Components) → `better-auth` pinned exactly
  to 1.7.12 (after the 2026 advisories), only two plugins, no community wrapper, `pnpm audit
  --prod` in the dependency task.
- [Secrets exposure] (A05 Security Misconfiguration) → `BETTER_AUTH_SECRET` and the Google secret
  are read at runtime only, never by the app or at build time; production refuses a missing or
  short secret; `.env` stays git-ignored → e2e: config refusals print no value.
- [Plain Redis in production] (A02) → `rediss:` required in production → e2e: config refusal.
- [Personal data in storage] (A02) → emails live in `identity` tables, Redis keys use an HMAC of the
  email, and Better Auth stores the IP and user agent on each session (needed for rate limiting
  and session review) → accepted: kept as session metadata and never logged.
- [Auth route allowlist bypassed through `Host` / `X-Forwarded-Proto`] (API9, A01) → found in the
  security review: better-call builds the routed URL from those headers, so a crafted value sent
  Better Auth to non-allowlisted paths. `AuthController` pins `Host` and drops `X-Forwarded-Proto`
  and `:authority` before delegating → e2e (`identity-sessions`) and a `curl` reproduction.
- [Internal api address exposed to browsers] (A05) → found during apply: `NextResponse.rewrite`
  sends the target URL in `x-middleware-rewrite`; `proxy.ts` forwards with `fetch` instead →
  `curl -i` on `/api/*` through the app shows no api address, also with the api down (task 6.1).
- [Login page framed for clickjacking] (A05) → `frame-ancestors 'none'` → manual check (task 6.4).
- [XSS in the app] (A03 Injection) → React escaping, no `dangerouslySetInnerHTML`, and an
  `HttpOnly` cookie limits what injected script can steal. **Accepted for user approval**: there is
  no strict `script-src` yet (it needs nonces in Next), so injected script could act as the user
  while the page is open. Tracked as a follow-up change.
- [MikroORM migrations dropping Better Auth tables] (A08 Software and Data Integrity Failures) →
  found during apply: without configuration, the diff drops tables that have no entity.
  `schemaGenerator.skipTables` lists Better Auth's tables → a probe migration contains no statement
  for them (task 2.3); a plugin that adds a table without adding it to the list is the residual risk.
- [Two personal organizations from concurrent first sign-ins] → accepted: needs two sessions
  created at the same moment for a new user. Each session still has a valid active organization,
  and later sessions pick the oldest membership.
- [Error format differs on `/api/auth/*`] → accepted (decided with the user): the app reads the
  status and Better Auth's `code`; responses still carry `X-Request-Id` and no internals → e2e.

## Test strategy

- Unit (Vitest + SWC, `apps/api`): `generateCode` (length, alphabet only, every symbol appears
  over many draws), `normalizeCode`, the guard's decision table (public, no session, bad
  origin, no membership, member) with Better Auth's `getSession` and `GetTenantUseCase`
  stubbed, and the two use cases with in-memory repositories (oldest membership reused, personal
  organization named after the user or the email's local part; member, non-member, no active
  organization). The repository SQL is covered by e2e against the real database (personal
  organization on first and later sign-in; membership removed → `403`).
- E2E (`apps/api`, real Postgres and Redis, `EmailSender` captured in memory, a test-only module
  with one tenant route): every scenario in the `identity-authentication`, `identity-tenancy`,
  `api-http-baseline`, `api-health` and `api-configuration` deltas that does not need Google or a
  browser. Expiry uses a fake `Date` (the api runs in the test process). Each test uses its own
  emails and `X-Forwarded-For` addresses, so Redis counters do not leak between tests.
- Manual, recorded in the tasks: the Google flow and account linking with real dev credentials, and
  the `dashboard-access` scenarios in a browser, with `curl` for redirects and headers.

## Migration Plan

No production deployment of the api exists yet, so there is no data to migrate. Locally, start the
compose stack, copy the new `.env.example` entries, run `db-migrate` and create the Floci sender
identity. Rollback is reverting the change and running MikroORM `migration:down`, which drops
Better Auth's tables.

## Open Questions

- Organization name shown on `/` for email-code users: the email's local part is a placeholder
  until a profile/settings page exists.
