# Koalaflow

Video hosting platform in the style of Vimeo / Panda Video:
upload → FFmpeg transcoding to HLS → signed CloudFront delivery → embedded player.

## Language

Code, identifiers, comments, commit messages and OpenSpec artifacts are written in English,
even when the conversation with the user is in Portuguese.

## Workspace

- Nx 23 + pnpm 11 workspaces (`apps/*`, `packages/*`, `infra/terraform`), Node 24 (`.nvmrc`; run `nvm use`).
- Package scope: `@koalaflow/*`. Use pnpm only (never npm/yarn).
- Run tasks through Nx: `pnpm nx <target> <project>`, e.g. `pnpm nx dev @koalaflow/api`.

### Apps

| App | Stack | Status |
|---|---|---|
| `apps/api` | NestJS 12 (ESM), `@nestjs/cqrs`, built with `tsc` (`@nx/js:tsc`) | created |
| `apps/app` | Next 16 (App Router, Turbopack): creator dashboard; the player is the `/embed/[videoId]` route using Video.js 10 (`@videojs/react`) | created |
| `apps/site` | Next 16 static export (`output: 'export'`): public marketing site for the apex domain, pt-BR only | created |
| `apps/worker` | Node + FFmpeg, consumes SQS, outputs HLS | planned |

There is no separate player app.

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
- Postgres is the main database (MikroORM recommended). Redis only for cache/rate limit.
- Uploads go straight from the browser to S3 via presigned multipart URLs, never through the api.
- Infra: AWS via Terraform (`infra/terraform`), Docker, docker-compose with LocalStack (S3/SQS) locally.

Decided:
- Product model: Panda-style B2B protected content (private by default, domain-restricted embeds,
  signed URLs; no public discovery pages).
- Unit test runner: Vitest + SWC (SWC keeps Nest decorator metadata).

Open decisions — ask the user, don't assume:
- MongoDB: recommended to leave it out (Postgres now, ClickHouse later for playback analytics).
- Auth provider.

## Constraints

- No webpack anywhere. Node/Nest builds use `tsc`; frontends use Vite or the framework's bundler.
  Nx generators may add webpack, ESLint or Prettier — remove them after generating.
- No Nx Cloud, no ESLint, no Prettier. Biome handles format, lint and import sorting.
- ESM: relative imports use the `.js` extension (`import { X } from './x.js'`); Next apps use the `@/` alias instead.
- Nest DI: never use `import type` for injected classes (it erases the runtime reference).
  Biome's `useImportType` is turned off for `apps/api/**` and `packages/**` for this reason.
- New dependencies with install scripts must be listed in `allowBuilds` in `pnpm-workspace.yaml`
  (`true` only if the script is needed); otherwise `pnpm install` fails in CI.
- Keep `.claude/settings.json` expanded (Biome override `expand: "always"`); Nx compares its text.

## Secrets and personal data

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
- Project rules for artifacts live in `openspec/config.yaml`; keep it in sync with this file.
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
