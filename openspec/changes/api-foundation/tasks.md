# Tasks

## 1. Local stack and dependencies

- [x] 1.1 Add root `compose.yaml` with `postgres:18-alpine`, `redis:8-alpine` and `floci/floci` pinned to a release tag, ports published on `127.0.0.1` only, named volumes and health checks; verify `docker compose up -d` reports all three healthy and `lsof -iTCP -sTCP:LISTEN` shows them bound to `127.0.0.1`
- [x] 1.2 Add the api dependencies and dev dependencies listed in design.md with pnpm; run `pnpm audit --prod`, review install scripts and add any to `allowBuilds` (`false` unless needed); verify `pnpm install --frozen-lockfile` succeeds
- [x] 1.3 Remove the scaffold `app/` controller and service, create `src/platform/{config,logging,http,database,health}` and `src/app.module.ts`; verify `pnpm nx build @koalaflow/api` passes

## 2. Test setup

- [x] 2.1 Add `apps/api/vitest.config.ts` (unplugin-swc, `src/**/*.test.ts`) and a `test` target; verify a Nest provider injected by class resolves in a sample unit test under `pnpm nx test @koalaflow/api` (proves decorator metadata survives), then delete the sample
- [x] 2.2 Add `apps/api/vitest.e2e.config.ts` (`test/**/*.e2e.test.ts`) and an `e2e` target with a helper that boots `AppModule` on port `0`; verify `pnpm nx e2e @koalaflow/api` runs an empty suite successfully

## 3. Configuration

- [x] 3.1 Implement the zod config schema and `loadConfig`, and load it in `main.ts` before the app is created; unit tests cover valid config, missing `DB_HOST`, `PORT` `70000` and `abc`, unknown `LOG_LEVEL`, unused variables ignored, production with `DB_SSL=false`, development with `DB_SSL=false`, and that the error message contains no input value (including `DB_PASSWORD`)
- [x] 3.2 Add `apps/api/.env.example` matching `compose.yaml` and `runtimeArgs: ["--env-file-if-exists=apps/api/.env"]` on the `dev` target; verify `pnpm nx dev @koalaflow/api` starts with the copied `.env` and exits non-zero naming the variable when `DB_HOST` is removed

## 4. Logging

- [x] 4.1 Configure nestjs-pino (JSON, `LOG_LEVEL`, status-based levels, `bufferLogs`) with serializers that drop headers, bodies and the query string and `redact` paths for `authorization`, `cookie`, `x-api-key`, `set-cookie`; unit tests on the serializers with credentials and `?signature=abc123&token=xyz`
- [x] 4.2 Implement request id handling in `genReqId` (accept only UUIDs, else `randomUUID()`, set `X-Request-Id`); unit tests with missing, valid, CRLF-containing and over-long ids

## 5. HTTP baseline

- [x] 5.1 Disable Nest's body parser and register `json`/`urlencoded` with a 1 MB limit plus the error middleware that turns parser failures into `HttpException`s; covered by the e2e in 5.5
- [x] 5.2 Implement the global catch-all exception filter with the uniform body (`statusCode`, `error`, `message`, `requestId`) and server-side error logging with stack for unexpected errors only; unit tests for `HttpException`, validation exception with `issues` and an unknown error with an internal message
- [x] 5.3 Implement `ZodValidationPipe` and the issue mapper keeping only `path` and `code`; unit tests with an unknown field, a 10,000-character string and `../../etc/passwd`, asserting the values are absent from the result
- [x] 5.4 Configure helmet (CSP `default-src 'none'; frame-ancestors 'none'`, `no-referrer`, HSTS), keep CORS disabled and call `enableShutdownHooks()`
- [x] 5.5 Add e2e tests for the HTTP baseline using a test-only module with a route that throws an internal error and a route validated by a strict schema: request id (missing, valid, malformed), unknown route `404`, internal error `500` without the internal message, `requestId` equals the header, malformed JSON `400` without parser text, oversized body `413`, validation `400` without echoed values, security headers and no `X-Powered-By` on `200` and `404`, foreign-origin preflight without `Access-Control-Allow-Origin`
- [x] 5.6 Add e2e tests for logging with an in-memory pino destination: one line per request with request id, method, path, status and duration; nothing at `warn` level for a `200`; no `Authorization`, `Cookie` or query string values; error line with stack and the same request id for the internal error; no stack line for a `400`

## 6. Database

- [x] 6.1 Register MikroORM 7 (Postgres driver from the config, TLS when `DB_SSL=true`, default migration settings, no api entity in the `identity` schema); verify the app boots against the compose Postgres
- [x] 6.2 Add `mikro-orm.config.ts` for the MikroORM CLI and the `db-migrate` / `db-migration-create` targets (depending on `build`); verify `pnpm nx db-migrate @koalaflow/api` succeeds on an empty database and running it twice is a no-op

## 7. Health

- [x] 7.1 Implement `GET /api/health/live` and `GET /api/health/ready` (`select 1` with a 2-second timeout, fixed bodies, failure logged server-side only); e2e tests: live `200`, `POST` live `404`, ready `200` with the database up, ready `503` with the fixed body within 3 seconds when booted with an unreachable `DB_PORT`, and a failure body with no error text, host or version

## 8. CI and documentation

- [ ] 8.1 Add a `postgres:18-alpine` service with throwaway credentials matching the e2e defaults to the `main` job in `.github/workflows/ci.yml`; verify the job runs `e2e` for `@koalaflow/api` green on the PR
- [x] 8.2 Update `CLAUDE.md` (api row, local stack command, `.env.example`, Postgres schema-per-owner rule, `db-migrate` targets) and keep `openspec/config.yaml` in sync; verify the documented commands run as written

## 9. Verification

- [x] 9.1 Check every risk in design.md has its task and test checked; run `/security-review` on the branch and fix the findings
- [x] 9.2 Run `pnpm check`, `pnpm exec openspec validate --all --strict --no-interactive` and `pnpm nx affected -t typecheck build test e2e`, and fix any failure

## Workflow follow-up

- Commit per area: `chore: add local compose stack`, `feat(api): ...`, `ci: ...`, `docs: ...`.
- Archive the change with `/opsx:archive` after review; the deferred migration-isolation check moves to `identity-auth`.
