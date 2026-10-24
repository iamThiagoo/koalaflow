# Koalaflow

Video hosting platform in the style of Vimeo / Panda Video:
upload → FFmpeg transcoding to HLS → signed CloudFront delivery → embedded player.

## Language

Code, identifiers, comments, commit messages and OpenSpec artifacts are written in English,
even when the conversation with the user is in Portuguese.

## Commits

One line in Conventional Commits form, `<type>(<scope>): <subject>`: lowercase, imperative, no
trailing period. No body and no `Co-Authored-By` trailer.

- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`.
- Scope: the area changed, e.g. `infra`, `site`, `app`, `api`, `worker`, `ui`. Omit it only for
  changes that span the whole workspace (`chore: switch to pnpm`) or only touch CI (`ci: ...`).
- One commit per area: changes to `infra` and `site` go in separate commits.

```
feat(infra): add monthly aws cost budget alert
fix(site): read build urls from apps/site/.env
ci: scan for secrets with gitleaks
```

## Workspace

- Nx 23 + pnpm 11 workspaces (`apps/*`, `packages/*`, `infra/terraform`), Node 24 (`.nvmrc`; run `nvm use`).
- Package scope: `@koalaflow/*`. Use pnpm only (never npm/yarn).
- Run tasks through Nx: `pnpm nx <target> <project>`, e.g. `pnpm nx dev @koalaflow/api`.

### Apps

| App | Stack | Status |
|---|---|---|
| `apps/api` | NestJS 12 (ESM), `@nestjs/cqrs`, MikroORM 7 (Postgres), nestjs-pino, class-validator; built with `tsc` (`@nx/js:tsc`) | created |
| `apps/app` | Next 16 (App Router, Turbopack): creator dashboard; the player is the `/embed/[videoId]` route using Video.js 10 (`@videojs/react`) | created |
| `apps/site` | Next 16 static export (`output: 'export'`): public marketing site for the apex domain, pt-BR only | created |
| `apps/worker` | Node + FFmpeg, consumes SQS, outputs HLS | planned |

There is no separate player app.

`apps/api` runtime code shared by every context lives in `apps/api/src/platform/` (config, logging,
http, database, health). Run it locally with the compose stack:

```sh
docker compose up -d                      # Postgres, Redis, Floci on 127.0.0.1 (POSTGRES_PORT etc. to remap)
cp apps/api/.env.example apps/api/.env
pnpm nx db-migrate @koalaflow/api         # apply migrations from the build output
pnpm nx dev @koalaflow/api                # http://localhost:3000/api/health/ready
```

- Config is read from `process.env` where each setting is used (`main.ts`, `LoggingModule`,
  `mikroOrmOptions`), when the module starts rather than at import; there is no startup validation.
  Add new variables to `.env.example`.
- Client errors come only from `ApiException` (also thrown as `400 Validation failed` by the global
  `StrictValidationPipe`, which validates every parameter typed with a class-validator DTO class);
  any other exception becomes a generic message for its status.
- Migrations live in `src/platform/database/migrations/`; create one with
  `pnpm nx db-migration-create @koalaflow/api -- --name <name>` against the local database (MikroORM CLI).
- `e2e` boots the real app against Postgres (compose locally, a service container in CI).

`apps/app` and `apps/site` do not use `@nx/next` (it pulls in webpack). Their targets come from
`package.json` scripts; `typecheck` is `next typegen && tsc --noEmit` because `@nx/js/typescript`
skips Next projects. Turbopack does not map `.js` imports to `.ts`, so Next apps import their own
modules through the `@/` alias (`src/*`) instead of relative `.js` paths.

`apps/site` must stay fully static: no proxy, redirects, cookies, server actions or route handlers
that read the request. It reads `SITE_URL`, `APP_URL` and `SALES_CONTACT_URL` at build time, with
no defaults in code: locally from `apps/site/.env` (copy `.env.example`), in CI from repository
variables. `.env` and `.env.*` are git-ignored everywhere; only `.env.example` files are committed.
`apps/site/Dockerfile` is a local preview only (nginx mirroring the CloudFront rules); production is
S3 + CloudFront, with no container or ECR. Build it from the repo root:
`docker build -f apps/site/Dockerfile -t koalaflow-site . && docker run --rm -p 8080:8080 koalaflow-site`.
Its `tsconfig.json` excludes `.next/dev/types/validator.ts`: `next dev` generates it with unused
imports when metadata routes exist, which breaks `noUnusedLocals`; `.next/types/validator.ts`
still validates the routes.

### Packages

| Package | Purpose |
|---|---|
| `packages/ui` | Shared frontend design tokens (`@koalaflow/ui/theme.css`, a Tailwind 4 `@theme`) imported by `apps/app` and `apps/site`. Tokens only for now; add shared React components when both apps need the same one. Not a bounded context, so it does not use the `domain/application/infrastructure` layout. |

### Infrastructure

`infra/terraform` is the Nx project `@koalaflow/infra` (see its `README.md`). One AWS account,
`us-east-1`, prod only for now.

- Roots: `bootstrap/` (state bucket, applied by hand once), `global/` (Route 53 zone when
  `domain_name` is set, GitHub OIDC provider, Terraform CI roles), `envs/<env>/<component>/`
  (one state each; `envs/prod/site` today). Without a domain the site is served on its
  CloudFront domain. Shared code lives in `modules/`. Roots read each other only through `terraform_remote_state`.
- State: S3 backend with `use_lockfile = true` (no DynamoDB). Commit `.terraform.lock.hcl` locked
  for `linux_amd64` and `darwin_arm64` (`terraform providers lock -platform=...`).
- Its `lint` target runs `terraform fmt -check` + `validate` on every root, so Terraform must be
  installed locally to push; `test` runs Vitest on the CloudFront Function.
- CloudFront Functions are plain scripts with a top-level `handler` (no ES module syntax, no
  `for...of`; the `cloudfront-js-2.0` runtime rejects it). Vitest runs them on Node, so check a
  new construct with `aws cloudfront test-function` before relying on it.
- CI uses GitHub OIDC roles, never static AWS keys. `.github/workflows/terraform.yml` plans on PRs
  and applies on `main` behind the `production` environment; `.github/workflows/deploy-site.yml`
  publishes `apps/site` to S3/CloudFront on push to `main`.
- A new root must be added to the paths filter in `terraform.yml`, after the roots it reads.

## Architecture (DDD)

- Bounded contexts live in `packages/<context>/{domain,application,infrastructure}`.
  Proposed contexts: identity, library, ingestion, processing, playback, analytics, billing.
- `domain` has no framework or infrastructure dependencies.
- Events inside a context: `@nestjs/cqrs` (`AggregateRoot.apply()` + `EventBus`).
  Between contexts/services: outbox table in the same transaction → relay → SQS (with DLQ).
- Postgres is the main database (MikroORM in `apps/api`). Redis only for cache/rate limit.
- One Postgres schema per owner: `identity` for Better Auth (`apps/app`), one per api bounded context.
  No api entity uses `identity`; MikroORM only diffs the schemas its entities use, so its migrations
  never touch Better Auth tables.
- Uploads go straight from the browser to S3 via presigned multipart URLs, never through the api.
- Infra: AWS via Terraform (`infra/terraform`), Docker; locally the root `compose.yaml` runs Postgres, Redis and Floci (S3/SQS, port 4566).

Decided:
- Product model: Panda-style B2B protected content (private by default, domain-restricted embeds,
  signed URLs; no public discovery pages).
- Unit test runner: Vitest + SWC (SWC keeps Nest decorator metadata).
- Auth: Better Auth (self-hosted, data in Postgres), owned by the `identity` context.
- No MongoDB: Postgres now, ClickHouse later for playback analytics.

## Constraints

- No webpack anywhere. Node/Nest builds use `tsc`; frontends use Vite or the framework's bundler.
  Nx generators may add webpack, ESLint or Prettier — remove them after generating.
- No Nx Cloud, no ESLint, no Prettier. Biome handles format, lint and import sorting.
- ESM: relative imports use the `.js` extension (`import { X } from './x.js'`); Next apps use the `@/` alias instead.
- Nest DI: never use `import type` for injected classes (it erases the runtime reference).
  Biome's `useImportType` is turned off for `apps/api/**` and `packages/**` for this reason, as is
  `noStaticOnlyClass` (Nest dynamic modules are classes with only a static `forRoot`).
- New dependencies with install scripts must be listed in `allowBuilds` in `pnpm-workspace.yaml`
  (`true` only if the script is needed); otherwise `pnpm install` fails in CI.
- Keep `.claude/settings.json` expanded (Biome override `expand: "always"`); Nx compares its text.

## Security

Security is part of design, code, tests and review, scaled to the risk of each change. References:
OWASP Top 10, OWASP API Security Top 10 (for `apps/api`) and OWASP ASVS Level 2 as the checklist
for authentication, sessions and access control.

### Security-sensitive changes

A change is security-sensitive when it touches: authentication, sessions or tokens; authorization
or tenant-scoped data; uploads, S3 keys, file paths or FFmpeg; playback signing, keys or embed domain
rules; requests to URLs that come from input; raw SQL; IAM, networking or anything public; secrets;
payments or webhooks; personal data; a new dependency or GitHub Action.

- Before coding: list the threats, their mitigations and the effect on existing access rules (in
  `design.md` when using OpenSpec). Ask the user before accepting a risk without mitigation.
- After coding: review the diff against the rules below (`/security-review` on the branch).
- Other changes (copy, styling, refactors without new inputs) follow the rules below without a
  written threat analysis.
- When reading or reviewing code, report vulnerabilities you notice (severity, `file:line`,
  suggested fix) even outside the task; fix them only when they are in scope.

### Access control

- Deny by default. Every api endpoint, Next server action and route handler authenticates and
  authorizes on the server; hiding UI is not a control.
- The tenant comes from the authenticated session, never from body, query, path or headers. Every
  query on tenant data filters by it; another tenant's resource returns 404, not 403.
- Ownership and permission checks live in application command/query handlers (or Nest guards
  backed by them), so every entry point enforces them. Public IDs are UUIDs, never sequential.

### Input and injection

- Validate every external input at the boundary with a schema/DTO (type, length, format, enum) and
  reject unknown fields. External input includes HTTP, SQS messages, webhooks, file metadata and
  ffprobe output.
- SQL only through MikroORM or bound parameters; sort fields and column names from input are mapped
  from an allowlist.
- Run FFmpeg/ffprobe with `spawn`/`execFile` and an argument array (no shell, no flags taken from
  input).
- S3 keys and file paths are built by the server from IDs (`<tenant>/<video>/...`); the client
  filename is display metadata only.

### Uploads, media and playback

- Presigned upload URLs are short-lived, bound to a server-chosen key, and limited in size and part
  count; the object is checked (size, ffprobe) before transcoding.
- Uploaded media is hostile: FFmpeg runs with `-protocol_whitelist file` (crafted HLS/concat
  playlists can read local files or make requests), time/CPU/output limits, no secrets in its
  environment and no network beyond S3/SQS.
- Signed CloudFront URLs/cookies are short-lived and scoped to one video's path; only the playback
  service reads the signing key.
- Embed domain restriction is enforced with CSP `frame-ancestors` on `/embed/[videoId]` plus a
  server-checked playback token; `Referer` is only a hint.

### Web apps and outbound requests

- No `dangerouslySetInnerHTML` with user data. User-provided links must be `https:`; redirect
  targets come from an allowlist (no open redirects).
- Modules that read secrets import `server-only`. Session cookies are `HttpOnly`, `Secure`,
  `SameSite=Lax` or stricter; state changes never use GET; cookie-authenticated api routes check
  `Origin` or a CSRF token.
- `apps/app` sends CSP, HSTS, `X-Content-Type-Options` and `Referrer-Policy` (`apps/site` gets them
  from CloudFront).
- Fetching a URL from input (webhooks, import by URL): `https:` only, block private, loopback and
  link-local addresses (including `169.254.169.254`) after DNS resolution and on redirects, with
  timeouts and size limits.
- Incoming webhooks verify the signature over the raw body and a timestamp, and are idempotent.
- Rate-limit login, token issuance and upload creation (Redis).

### Errors and logs

- Clients get a status, a generic message and a request id. Stack traces, SQL, paths and upstream
  errors stay in server logs; the api uses one global exception filter that never echoes unknown
  error messages.
- Never log passwords, tokens, cookies, `Authorization` headers, signed or presigned URLs, or
  personal data; log IDs instead. Log authentication failures and denied access, without secrets.

### Infrastructure and dependencies

- Private by default: S3 public access block, OAC, databases in private subnets, no `0.0.0.0/0`
  ingress except 443 on a load balancer. Encrypt at rest; TLS 1.2+ in transit.
- IAM least privilege: one role per workload, scoped actions and resources; a `*` needs a `Rule:`
  comment explaining why. Workflows set minimal `permissions`.
- Add a dependency or GitHub Action only when the platform or an existing one does not cover it.
  Check maintenance, advisories (`pnpm audit --prod`) and install scripts (`allowBuilds: false`
  unless the script is needed), and name it in the design.

### Security tests

Follow the testing policy; add these only where the risk exists:

- Protected endpoints/handlers: unauthenticated is rejected and another tenant's resource returns
  404.
- Validators: malicious or out-of-range input (path traversal in names, oversized values, unknown
  fields).
- Tokens and signed URLs: expiry, scope and tampering are rejected.

### Secrets and personal data

- Never commit secrets or personal data. `.env`/`.env.*` (except `.env.example`) and
  `local.auto.tfvars` are git-ignored; gitleaks scans pushed commits in `pre-push`
  (`brew install gitleaks`) and the whole history in CI.
- Terraform state keeps every value in plain text; `sensitive = true` only hides CLI output. Keep
  secrets out of state: RDS with `manage_master_user_password`, private keys (e.g. the CloudFront
  signed-URL key) generated outside Terraform and stored in Secrets Manager, Terraform gets only
  the public key.
- Apps read secrets at runtime from Secrets Manager or SSM, never from `tfvars` or build-time env.
  Anything a Next app reads at build time, and every `NEXT_PUBLIC_*`, ends up in public files.
- GitHub repository variables are printed in workflow logs; sensitive values go in secrets
  (e.g. `BUDGET_ALERT_EMAILS` → `TF_VAR_budget_alert_emails`, a `sensitive` variable).
- The Terraform plan role reads resource configuration and the state, but is explicitly denied
  application data (objects outside the state bucket, secrets, parameters, KMS decrypt, table
  items, logs). A data source that needs such data requires changing `plan_data_guard` in `global/`.

## Simplicity

- Prefer the simplest solution that meets the spec. Reuse existing code and library defaults before
  adding anything; add an abstraction, file, export, option or config only for a current use, never
  "for a later change".
- Do not set an option to its default value, and do not export what only its own file uses.
- Each rule has one home: project policies in this file, OpenSpec artifact rules in
  `openspec/config.yaml`, decisions of a change in its artifacts, behavior details in code (`Rule:`
  comments). Anywhere else, point to it instead of restating it. Before adding an instruction,
  comment or doc, look for one that already says it, in any wording, and update that one instead.
- Before finishing, review the whole diff for leftovers: unused code, exports, files, options or
  dependencies, debug output, and stale comments or docs.

## Code comments

Comments about business rules or design decisions are simple, short and objective,
in a block comment with one `* Rule: ...` line per rule:

```ts
/**
 * Rule: a video can only be published after transcoding succeeds.
 */
```

## Testing policy

- Unit tests: prioritize business rules, validations, calculations, error scenarios and relevant
  behaviors. Verify expected results and behavior, not internal implementation details.
- E2E tests: only when the integration between important modules, services or components needs
  validation. Prioritize business-critical scenarios and those where integration can fail.
- Prefer tests that add confidence and prevent regressions over chasing coverage.
- Keep tests simple, deterministic, independent and easy to understand. Avoid duplication,
  unnecessary mocks and brittle tests tied to internals.
- Every new feature or bug fix adds or updates the relevant tests.
- Run the relevant tests after changes and fix failures before considering the work done.

## Spec-driven development (OpenSpec)

- Flow: `/opsx:explore` (optional) → `/opsx:propose <name>` → user reviews → `/opsx:apply` → `/opsx:archive`.
- `openspec/config.yaml` also keeps a short summary of this project (update it when a fact in it
  changes) and names the sections of this file for policies.
- In `openspec/config.yaml`, quote YAML list items that contain `": "`, or the rules are ignored.

## Checks

| Command | What it does |
|---|---|
| `pnpm check` | Biome format + lint + imports (add `--write` to fix) |
| `pnpm exec openspec validate --all --strict --no-interactive` | Validate specs and changes |
| `pnpm nx affected -t lint test build typecheck` | Affected projects |
| `pnpm nx lint @koalaflow/infra` | Terraform fmt + validate for every root |

- Husky `pre-push` runs gitleaks (when installed), Biome, OpenSpec validation and `nx affected`
  (no e2e).
- CI (GitHub Actions) runs the same plus e2e, with `nrwl/nx-set-shas` for the affected base, and a
  `secrets` job that runs gitleaks over the full history.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->
