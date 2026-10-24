# Proposal

## Why

`apps/api` is still the Nest scaffold: no configuration, database, logging, error handling or tests.
Every backend slice that follows (library, ingestion, playback) needs the same runtime baseline,
and the security policy requires that errors, logs and headers are safe before the first real
endpoint exists. Building it once, now, keeps those rules out of each feature change.

## What Changes

- Add a root `compose.yaml` for local development with Postgres, Redis and Floci (S3/SQS), bound
  to `127.0.0.1` only, plus `apps/api/.env.example`.
- Read the api configuration from environment variables where it is used; database TLS stays on
  unless `DB_SSL=false`, and production refuses to start without it.
- Add MikroORM (Postgres) with migrations run from the built app, and one Postgres schema per
  owner so the api never manages tables it does not own (Better Auth tables, owned by `apps/app`).
- Add structured JSON logging with a request id per request and redaction of credentials, cookies
  and query strings.
- Add one global exception filter and a uniform error body (`statusCode`, `error`, `message`,
  `requestId`), including malformed or oversized request bodies.
- Add a global class-validator pipe that rejects unknown fields, for the endpoints of later slices.
- Send security headers with helmet; no CORS (the api is not called cross-origin from browsers).
- Add `GET /api/health/live` and `GET /api/health/ready` (checks Postgres).
- Set up Vitest + SWC unit tests and an `e2e` target that boots the app against a real Postgres;
  CI gets a Postgres service for it.
- Remove the scaffold `AppController`/`AppService`.

## Capabilities

### New Capabilities
- `api-configuration`: how the api reads its runtime configuration and keeps database TLS on.
- `api-http-baseline`: request ids, the error response contract, body limits, security headers
  and cross-origin policy shared by every api endpoint.
- `api-logging`: structured request logs and what they must never contain.
- `api-health`: liveness and readiness endpoints and what they disclose.

### Modified Capabilities
<!-- None: no existing spec covers the api. -->

## Impact

- Bounded contexts: none. This is platform code in `apps/api/src/platform/`; contexts start in
  later changes (`identity-auth`, `library-videos`, ...).
- Code: `apps/api` (rewrite of the scaffold), root `compose.yaml`, `apps/api/.env.example`,
  `.github/workflows/ci.yml` (Postgres service for e2e).
- Dependencies (api): listed with their reasons in design.md (New dependencies).
- Out of scope: authentication and tenancy (`identity-auth`), Redis client and rate limiting
  (first used by `identity-auth`), S3/SQS clients and Floci resources (`ingestion-upload`), the
  outbox and relay, `apps/worker`, loading secrets from Secrets Manager and any production
  infrastructure (`api-infra`), `trust proxy` settings for a load balancer.
- Security: security-sensitive (error handling and logs, configuration with a database password,
  unauthenticated health endpoints, new dependencies); see `design.md`.
