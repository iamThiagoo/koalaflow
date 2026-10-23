# Design

## Context

`apps/api` is the generated Nest 12 app: `main.ts` sets the `api` global prefix and listens on
`PORT`; one `AppController`/`AppService` pair; no tests or test target. It builds with `@nx/js:tsc`
(ESM, `nodenext`, decorators with metadata) and `dev` runs the build through `@nx/js:node`. The
workspace already has `@swc/core` and Vitest 5 (used by `apps/site` and `@koalaflow/infra`).
There is no local container setup. CI (`ci.yml`) runs `nx affected -t lint test build typecheck
e2e` with no services.

Decided with the user: Better Auth runs in `apps/app` (Next) against the same Postgres; zod
validates every boundary; the production runtime is decided in `api-infra`. Motivation is in
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
Platform code lives in `apps/api/src/platform/` (`config/`, `logging/`, `http/`, `database/`,
`health/`), composed by `AppModule.forRoot(config)` in `apps/api/src/app.module.ts` (e2e tests pass
the same config object plus an in-memory log stream). It is not a bounded context, so it does not use
`domain/application/infrastructure`. The scaffold `app/` folder is removed.

### Configuration: zod schema, no `@nestjs/config`
`platform/config/config.schema.ts` declares a zod object for `NODE_ENV` (`development | test |
production`), `PORT` (1–65535, default `3000`), `LOG_LEVEL` (pino levels, default `info`),
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` and `DB_SSL` (boolean string). A
`superRefine` enforces `DB_SSL=true` when `NODE_ENV=production`. `loadConfig(env)` parses once in
`main.ts` before `NestFactory.create`; on failure it throws an error whose message is built from
issue paths and codes only (zod's default message can include the received value). The parsed,
frozen object is passed to the modules that need it through `AppModule.forRoot(config)`; there is no
config injection token until a provider needs one.

Discrete `DB_*` fields instead of `DATABASE_URL`: RDS-managed master passwords are stored in
Secrets Manager as separate `username`/`password` fields, and a URL would need escaping and would
put the password in a string that is easy to log.

Locally the `dev` target passes `runtimeArgs: ["--env-file-if-exists=apps/api/.env"]` (Node 24
built-in), so no `dotenv` dependency. `apps/api/.env.example` documents every variable with local
values matching `compose.yaml`.

Alternative considered: `@nestjs/config` with a zod `validate` function. It adds a dependency and
a second access pattern (`ConfigService.get`) for what one parse provides.

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
`mikroOrmOptions(loadConfig(process.env))`, and the Nx targets `db-migrate` (`migration:up`) and
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
- Body parsing: `NestFactory.create(AppModule, { bodyParser: false })`, then Express `json` and
  `urlencoded` parsers with `limit: '1mb'` run inside a Nest middleware (`BodyParserMiddleware`).
  Parser failures (`400`, `413`, `415`) reject as `HttpException`s, which Nest routes to the global
  filter; Express's default handler, which prints stack traces outside production, is never
  reached. `express` is a direct dependency for this (already installed by
  `@nestjs/platform-express`).
- Request id: `pino-http`'s `genReqId` reads `X-Request-Id`, keeps it only if it matches the UUID
  format, otherwise uses `crypto.randomUUID()`, and sets the response header. The
  filter reads the same id from `req.id`.
- Exception filter (`APP_FILTER`, catches everything): only `ApiException` messages reach clients;
  any other `HttpException` keeps its status but gets a fixed generic message for that status (Nest's
  own messages echo input, e.g. `Cannot GET /<path>`); `ValidationException` adds
  `issues: [{ path, code }]`; everything else becomes `500 Internal server error`, and the filter sets
  `res.err` so pino-http logs it with its stack on the request line. The reason phrase comes from
  Node's `STATUS_CODES`.
- Validation: `ZodValidationPipe(schema)` in `platform/http/`, applied per handler parameter.
  Schemas are written with `z.strictObject` so unknown keys fail. The issue mapper drops
  `received`/`input` and messages, keeping `path` and `code`. No `nestjs-zod` dependency: the pipe
  is ~30 lines and owning it guarantees no value echo.
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
`platform/health/health.controller.ts`: `live` returns `{status:"ok"}`; `ready` runs `select 1`
through the ORM connection with `Promise.race` against a 2-second timeout and returns `503` via
`res.status` with the fixed body from the spec. Failures are logged with the error, never returned.
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
  config schema, request id parsing, zod issue mapping, exception filter mapping, log serializers.
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
| `zod` (4) | Decided validation library | No install scripts |
| `@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/nestjs`, `@mikro-orm/migrations`, `@mikro-orm/cli` (7) | Decided ORM, Nest integration, migrations and the CLI that runs them | Pulls `pg`, `kysely` and `yargs` |
| `nestjs-pino`, `pino`, `pino-http` | Request-scoped structured logs with redaction | Maintained, Nest 12 peer range |
| `helmet` (8) | Maintained header defaults instead of hand-written ones | No install scripts |
| `express` (5) | Body parsers inside `BodyParserMiddleware` | Same version `@nestjs/platform-express` installs |
| `vitest`, `unplugin-swc`, `@types/express` (dev) | Decided test runner; SWC keeps decorator metadata | Uses existing `@swc/core` |

`pnpm audit --prod` reported no known vulnerabilities and none of them adds an install script, so
`allowBuilds` is unchanged.

## Risks / Trade-offs

- [Stack traces, SQL or internal messages in error responses] (OWASP A05 Security
  Misconfiguration, API8) → global catch-all filter, generic `500`, generic messages for every
  non-`ApiException`, body-parser errors routed through the filter → unit tests on `toErrorBody`;
  e2e: thrown internal error, malformed JSON, oversized body, unknown route.
- [Submitted values echoed in validation errors, reflecting injected content] (A03 Injection,
  API8) → issue mapper keeps only `path` and `code` → unit test on the mapper with a path-traversal
  string and an oversized value; e2e on a test-only route.
- [Credentials, cookies or signed URLs written to logs] (A09 Logging Failures) → serializers
  without headers, bodies or query string, plus `redact` paths → unit test on serializers; e2e
  captures the log line for a request with `Authorization`, `Cookie` and `?signature=`.
- [Log forging or oversized ids via `X-Request-Id`] (A09) → accept only UUIDs → unit test with
  CRLF, long and valid values.
- [Database password printed on startup failure] (A02 Cryptographic Failures, A05) → error message
  built from issue paths/codes only → unit test asserting no input value appears.
- [Plaintext database connection in production] (A02) → `DB_SSL` required to be `true` in
  production → unit test on the schema.
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

Trade-off: owning the validation pipe, health controller and config loader means a little more code
than adopting `@nestjs/config`, `nestjs-zod` and `@nestjs/terminus`, in exchange for fewer
dependencies and full control over what responses and errors contain.

## Migration Plan

No deployed api exists, so nothing to migrate or roll back. Developers run `docker compose up -d`,
copy `apps/api/.env.example` to `apps/api/.env`, then `pnpm nx dev @koalaflow/api`. CI gains a
Postgres service; the `e2e` target runs only when `@koalaflow/api` is affected.
