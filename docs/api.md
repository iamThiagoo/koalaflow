# `apps/api`

Runtime code shared by every context lives in the root of `src/` (config, logging, http, database, redis, health). Run the api and the app locally:

```sh
docker compose up -d                      # Postgres, Redis, Floci (S3/SQS, :4566) on 127.0.0.1 (POSTGRES_PORT etc. to remap)
cp apps/api/.env.example apps/api/.env    # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
cp apps/app/.env.example apps/app/.env
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_REGION=us-east-1 \
  aws --endpoint-url http://127.0.0.1:4566 sesv2 create-email-identity \
  --email-identity no-reply@koalaflow.local  # Floci sender, once per Floci container
pnpm nx db-migrate @koalaflow/api         # apply migrations from the build output
pnpm nx dev @koalaflow/api                # http://localhost:3000/api/health/ready
pnpm nx dev @koalaflow/app                # http://localhost:3001 (sign in with an email code)
curl -s http://127.0.0.1:4566/_aws/ses    # emails Floci "sent", including sign-in codes
```

- Config is read from `process.env` where each setting is used (`main.ts`, `LoggingModule`, `mikroOrmOptions`, `RedisModule`, `createAuth`), when the module starts, not at import. No startup validation beyond the production refusals (`REDIS_URL` without TLS, a missing or short `BETTER_AUTH_SECRET`). Add new variables to `.env.example`.
- Client errors come only from `ApiException`; the global `StrictValidationPipe` validates every parameter typed with a class-validator DTO class and throws it as `400 Validation failed`. Any other exception becomes a generic message for its status. Better Auth's `/api/auth/*` routes answer with its own `{ code, message }` errors.
- Every route needs a session unless marked `@Public()` (global `SessionGuard`); tenant-scoped handlers read the tenant with `@CurrentTenant()` and filter every query by its `organizationId`.
- Migrations live in `src/infra/database/migrations/`; create one against the local database with `pnpm nx db-migration-create @koalaflow/api -- --name <name>` (MikroORM CLI).
- `e2e` boots the real app against Postgres and Redis (compose locally, service containers in CI).
