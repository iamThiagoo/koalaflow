# Design

## Context

`apps/api` is the generated Nest 12 app: `main.ts` sets the `api` global prefix and listens on
`PORT`; one `AppController`/`AppService` pair; no tests or test target. It builds with `@nx/js:tsc`
(ESM, `nodenext`, decorators with metadata) and `dev` runs the build through `@nx/js:node`. The
workspace already has `@swc/core` and Vitest 5 (used by `apps/site` and `@koalaflow/infra`).
There is no local container setup. CI (`ci.yml`) runs `nx affected -t lint test build typecheck
e2e` with no services.

Decided with the user: Better Auth runs in `apps/app` (Next) against the same Postgres;
class-validator DTO classes validate every HTTP boundary; the production runtime is decided in `api-infra`. Motivation is in
proposal.md - Why; behavior is in the four specs of this change.

## Goals / Non-Goals

**Goals:**
- A runtime baseline every later slice reuses without changes: config, database, logging, errors,
  validation, headers, health, tests.
- The Postgres layout already separates owners, so Better Auth (`apps/app`) and MikroORM (`apps/api`)
  never manage each other's tables.

**Non-Goals:**
- No entities, domain code or bounded-context packages; the first ones arrive in `library-videos`.
- No shared platform package for `apps/worker` yet; extract `apps/api/src/platform/*` to
  `packages/` when the worker needs the same pieces.
- No production secrets loading; in production the runtime injects env vars from Secrets Manager
  (decided in `api-infra`), so the api only ever reads `process.env`.

## Decisions

### Layout
Platform code lives in `apps/api/src/platform/` (`logging/`, `http/`, `database/`, `health/`),
composed by `AppModule.forRoot()` in `apps/api/src/app.module.ts` (e2e tests pass an in-memory log
stream). It is not a bounded context, so it does not use
`domain/application/infrastructure`. The scaffold `app/` folder is removed.

### Configuration: `process.env` where it is used, no startup validation
Each setting is read from `process.env` by the code that uses it: `PORT` (default `3000`) in
`main.ts`, `LOG_LEVEL` (default `info`) in `LoggingModule.forRoot`, and `DB_*` in
`mikroOrmOptions()`, which `DatabaseModule` calls as its factory and the CLI calls as the default
export. They are read when the module starts, not at import, so e2e tests set `process.env` in
`startApp` before building the app (Vitest gives each test file its own process).

`DB_SSL` fails closed: TLS is on unless the value is exactly `false`, so a missing or mistyped
value never silently disables it. In production `mikroOrmOptions()` throws when `DB_SSL=false`,
naming only the variable.

Accepted risk (decided by the user): there is no validation of types, ranges or required variables.
A missing `DB_HOST` or an invalid `PORT` surfaces as a connection or listen error at runtime, not as
a startup error naming the variable.

Discrete `DB_*` fields instead of `DATABASE_URL`: RDS-managed master passwords are stored in
Secrets Manager as separate `username`/`password` fields, and a URL would need escaping and would
put the password in a string that is easy to log.

Locally the `dev` target passes `runtimeArgs: ["--env-file-if-exists=apps/api/.env"]` (Node 24
built-in), so no `dotenv` dependency. `apps/api/.env.example` documents every variable with local
values matching `compose.yaml`.

Alternatives considered: a `loadConfig` that validates every variable at startup with a class-validator
class, which fails fast but adds a parsing layer; `@nestjs/config`, which adds a second access pattern (`ConfigService.get`).

### Database: MikroORM 7 with per-owner schemas
`@mikro-orm/nestjs` registers MikroORM with the Postgres driver from the config
(`MikroOrmModule.forRootAsync`); its defaults already forbid the global context and fork one per
request. Entities will be declared with `defineEntity`/`EntitySchema` in each
context's `infrastructure`, keeping `domain` free of ORM decorators; this change ships none.

Postgres schemas, one per owner: `identity` for Better Auth (created by `identity-auth`), one per
api bounded context (`library`, `ingestion`, ...), created by that context's first migration. The
migrator keeps its default table, `mikro_orm_migrations` in `public`. MikroORM 7 has no schema skip option,
but its diff (`SqlSchemaGenerator.prepareSchemaForComparison`) only loads tables from the schemas the
entities use, so as long as no api entity uses `identity`, a generated migration never sees, alters
or drops Better Auth tables.

Migrations are TypeScript files in `apps/api/src/platform/database/migrations/`, compiled with the
app. The MikroORM CLI runs them from the build output: `mikro-orm.config.ts` exports
`mikroOrmOptions()` as its default, and the Nx targets `db-migrate` (`migration:up`) and
`db-migration-create` (`migration:create --path src/...`) depend on `build` and pass the compiled
config with `--config`, so no TypeScript loader is needed. The scripts call the CLI's `cli.js` through
`node --env-file-if-exists=.env`, because Node does not accept `--env-file` in `NODE_OPTIONS`.
`@mikro-orm/cli` is a runtime dependency so the same `migration:up` can run as a production task.
Snapshots are off, so `migration:create` diffs against the live database instead of a snapshot file
that a clean build would delete. MikroORM's defaults (`transactional`, `allOrNothing`) roll back a
failed migration batch.

Alternatives considered: the CLI with a TS config, which needs a loader for ESM `.js` specifiers,
decorators and the `@koalaflow/source` condition; and our own `migrate`/`create-migration` scripts,
which duplicate what the CLI already provides (`up`, `create`, `down`, `list`, `pending`).

### HTTP baseline
- Layout: `main.ts` holds the app setup (logger, shutdown hooks, `api` prefix, helmet), mirrored
  by the e2e `startApp`. `platform/http/` holds `http.module.ts` (JSON body parser, global filter
  and pipe), `api.exception.ts` (`ApiException`), `exception.filter.ts` and `validation.pipe.ts`.
  The request id belongs to `LoggingModule`, since `genReqId` assigns it.
- Body parsing: `NestFactory.create(AppModule, { bodyParser: false })`, then Express's `json`
  parser with `limit: '1mb'` is applied as a module middleware in `HttpModule`, so it runs after
  pino-http and parser errors keep the request id and log line (`app.useBodyParser` would run it
  first). Bodies are JSON only (no `urlencoded`). Nest's own error handler sends parser errors to
  the global filter: malformed JSON arrives as a `BadRequestException`, and the filter keeps the
  status of other body-parser errors (`expose: true`, e.g. `413`, `415`). `express` is a direct
  dependency for this (already installed by `@nestjs/platform-express`).
- Request id: `pino-http`'s `genReqId` reads `X-Request-Id`, keeps it only if it matches the UUID
  format, otherwise uses `crypto.randomUUID()`, and sets the response header. The
  filter reads the same id from `req.id`.
- Exception filter (`APP_FILTER`, catches everything): only `ApiException` messages reach clients;
  any other `HttpException` keeps its status but gets a fixed generic message for that status (Nest's
  own messages echo input, e.g. `Cannot GET /<path>`); everything else becomes `500 Internal server error`, and the filter sets
  `res.err` so pino-http logs it with its stack on the request line. The reason phrase comes from
  Node's `STATUS_CODES`.
- Validation: `StrictValidationPipe` in `platform/http/`, Nest's `ValidationPipe` registered as
  `APP_PIPE`, so every parameter typed with a DTO class is validated without opting in. Options:
  `whitelist` + `forbidNonWhitelisted` (unknown keys fail) and `forbidUnknownValues` (a class without
  validation decorators rejects every value); it also rejects arrays and primitives for a class
  parameter, which Nest's pipe accepts when every field is optional. Nest's pipe strips
  `__proto__`/`constructor` keys before `plainToInstance`. Every failure becomes
  `ApiException(400, 'Validation failed')`; the response lists no fields (decided with the user:
  simpler than mapping class-validator's error tree), so submitted values and attacker-chosen key
  names never reach it.
- Headers: `helmet` with `contentSecurityPolicy: { directives: { defaultSrc: ["'none'"],
  frameAncestors: ["'none'"] } }`, `X-Frame-Options: DENY`, `referrerPolicy: no-referrer`, HSTS
  default (1 year, `includeSubDomains`). CORS is not enabled (`apps/app` calls the api server-side or through its own
  origin).
- `app.enableShutdownHooks()` so `SIGTERM` closes the ORM pool and finishes in-flight requests.

### Logging: nestjs-pino
`LoggerModule.forRoot` with `pino-http`: JSON output always (no `pino-pretty`; pipe to it locally
if wanted), level from `LOG_LEVEL`, custom `req`/`res` serializers that log only the request id,
`method`, the path without query string and `statusCode`, and `redact` on `authorization`, `cookie`,
`x-api-key` and `set-cookie` headers added to any other log call, as a second line of defense. Nest's own logger is replaced with
`app.useLogger(app.get(Logger))` and `bufferLogs: true`, so startup logs are JSON too.
`customLogLevel` maps `5xx` to `error`, `4xx` to `warn`, else `info`.

Alternative considered: Nest's built-in `ConsoleLogger` in JSON mode. It has no per-request
context, request id propagation or redaction.

### Health: own controller, no Terminus
`platform/health/health.controller.ts`: `live` returns `{status:"ok"}`; `ready` asks
`HealthService.checkDatabase()` (`health.service.ts`), which runs `select 1` through the ORM
connection with `Promise.race` against a 2-second timeout, and returns `503` via `res.status` with
the fixed body from the spec. Failures are logged with the error, never returned.
`@nestjs/terminus` was considered; for one check it adds a dependency and a response format with
error details that would have to be stripped.

### Local stack: `compose.yaml`
Root `compose.yaml` with `postgres:18.6-alpine`, `redis:8.8.3-alpine` and `floci/floci:2.3.0`, every
port published on `127.0.0.1` only (host ports overridable with `POSTGRES_PORT`, `REDIS_PORT`,
`FLOCI_PORT` when another project holds them), named volumes, and health checks (`pg_isready`,
`redis-cli ping`, Floci's own). The Docker socket is not mounted into Floci: S3 and SQS run
in-process, and the socket would give the container control of the host's Docker. Postgres credentials are fixed local-only values
(`koalaflow`/`koalaflow`) also used in `.env.example`; they never appear in production config.
Redis and Floci are in the stack now so later slices only add clients and resources.

### Tests
- Unit (`test` target, `vitest.config.ts` with `unplugin-swc` so Nest decorator metadata is kept):
  ready for later slices; request id, the exception filter and validation are covered by e2e.
- E2E (`e2e` target, `vitest.e2e.config.ts`, `test/**/*.e2e.test.ts`): boots the real `AppModule`
  with `listen(0)` and uses `fetch` against a real Postgres (no `supertest`). Covers the HTTP
  baseline, health (up; a local TCP server that never answers; rejected credentials) and log output
  (a pino destination stream captured in memory). nestjs-pino 5 keeps one pino-http instance per
  process, so a second app in the same file would log to the first app's stream at its level; each
  file starts at most one app (`startApp` throws otherwise) and Vitest isolates modules per file. Locally it uses `compose.yaml`; CI adds a
  `postgres:18-alpine` service to the `main` job with throwaway credentials.
- E2E is justified by the policy: the filter, body parser, helmet and pino interact through the
  Express pipeline, and that is where leaks happen; unit tests cannot see it.

### New dependencies
| Package | Why | Notes |
|---|---|---|
| `class-validator` (0.15), `class-transformer` (0.5) | Decided validation library for HTTP input; both are loaded by Nest's `ValidationPipe` | No install scripts; `class-transformer` has had no release since 2022 but is the transformer Nest's pipe requires |
| `@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/nestjs`, `@mikro-orm/migrations`, `@mikro-orm/cli` (7) | Decided ORM, Nest integration, migrations and the CLI that runs them | Pulls `pg`, `kysely` and `yargs` |
| `nestjs-pino`, `pino`, `pino-http` | Request-scoped structured logs with redaction | Maintained, Nest 12 peer range |
| `helmet` (8) | Maintained header defaults instead of hand-written ones | No install scripts |
| `express` (5) | JSON body parser in `HttpModule` | Same version `@nestjs/platform-express` installs |
| `vitest`, `unplugin-swc`, `@types/express` (dev) | Decided test runner; SWC keeps decorator metadata | Uses existing `@swc/core` |

None of them adds an install script, so `allowBuilds` is unchanged. `pnpm audit --prod` reports
no advisory for these packages; it does report `body-parser` 2.3.0 and `multer` 2.4.0 (high, DoS),
pulled in by `@nestjs/platform-express`.

## Risks / Trade-offs

- [Stack traces, SQL or internal messages in error responses] (OWASP A05 Security
  Misconfiguration, API8) → global catch-all filter, generic `500`, generic messages for every
  non-`ApiException`, body-parser errors routed through the filter → e2e: thrown internal error, malformed JSON,
  oversized body, unsupported charset, unknown route.
- [Submitted values echoed in validation errors, reflecting injected content] (A03 Injection,
  API8) → validation errors carry only `Validation failed`, no fields or values → e2e on a test-only
  route with a path-traversal string and an oversized value.
- [Credentials, cookies or signed URLs written to logs] (A09 Logging Failures) → serializers
  without headers, bodies or query string, plus `redact` paths → e2e
  captures the log line for a request with `Authorization`, `Cookie` and `?signature=`.
- [Log forging or oversized ids via `X-Request-Id`] (A09) → accept only UUIDs (anchored pattern,
  so CRLF cannot pass) → e2e with missing, valid and malformed ids.
- [Plaintext database connection] (A02 Cryptographic Failures) → TLS unless `DB_SSL=false`, and
  production refuses `DB_SSL=false` with an error that names only the variable.
- [Missing or invalid configuration found only at runtime] (A05) → accepted risk, see
  Configuration.
- [Memory exhaustion via large bodies] (API4 Unrestricted Resource Consumption) → 1 MB limit →
  e2e `413`.
- [Clickjacking, MIME sniffing, referrer leakage] (A05) → helmet headers → e2e asserts headers on
  `200` and `404`.
- [Browser cross-origin calls with credentials] (A01 Broken Access Control) → no CORS → e2e
  preflight from a foreign origin has no `Access-Control-Allow-Origin`.
- [Information disclosure via public health endpoints] (API8, API9 Improper Inventory) → fixed
  bodies with `up`/`down` only → e2e for the failure case.
- [Local database and Redis reachable from the LAN] (A05) → ports published on `127.0.0.1` →
  checked with `lsof` after `docker compose up` (all three bound to `127.0.0.1`).
- [Generated migration drops Better Auth tables] (data integrity, A08) → per-owner schemas; the
  MikroORM 7 diff only reads schemas used by entities (confirmed in its source) → **e2e verification
  deferred to `identity-auth`**, when the `identity` schema first exists; this change has no tables
  to break. Accepted by the user for this change.
- [Vulnerable or script-running dependencies] (A06 Vulnerable Components, A08) → list above,
  `pnpm audit --prod`, `allowBuilds` review → task check.
- [Fixed local credentials in `compose.yaml` copied to production] (A07) → values only in
  `compose.yaml`/`.env.example`, production reads env from Secrets Manager, and the production
  `DB_SSL` rule fails fast against a local-style setup → review.

Trade-off: owning the health controller means a little more code than adopting
`@nestjs/terminus`, in exchange for fewer
dependencies and full control over what responses and errors contain.

## Migration Plan

No deployed api exists, so nothing to migrate or roll back. Developers run `docker compose up -d`,
copy `apps/api/.env.example` to `apps/api/.env`, then `pnpm nx dev @koalaflow/api`. CI gains a
Postgres service; the `e2e` target runs only when `@koalaflow/api` is affected.
