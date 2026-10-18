# Koalaflow

Video hosting platform in the style of Vimeo / Panda Video:
upload → FFmpeg transcoding to HLS → signed CloudFront delivery → embedded player.

## Language

Code, identifiers, comments, commit messages and OpenSpec artifacts are written in English,
even when the conversation with the user is in Portuguese.

## Workspace

- Nx 23 + pnpm 11 workspaces (`apps/*`, `packages/*`), Node 24 (`.nvmrc`; run `nvm use`).
- Package scope: `@koalaflow/*`. Use pnpm only (never npm/yarn).
- Run tasks through Nx: `pnpm nx <target> <project>`, e.g. `pnpm nx dev @koalaflow/api`.

### Apps

| App | Stack | Status |
|---|---|---|
| `apps/api` | NestJS 12 (ESM), `@nestjs/cqrs`, built with `tsc` (`@nx/js:tsc`) | created |
| `apps/app` | Next 16 (App Router, Turbopack): creator dashboard; the player is the `/embed/[videoId]` route using Video.js 10 (`@videojs/react`) | created |
| `apps/worker` | Node + FFmpeg, consumes SQS, outputs HLS | planned |

There is no separate player app.

`apps/app` does not use `@nx/next` (it pulls in webpack). Its targets come from `package.json` scripts;
`typecheck` is `next typegen && tsc --noEmit` because `@nx/js/typescript` skips Next projects.

## Architecture (DDD)

- Bounded contexts live in `packages/<context>/{domain,application,infrastructure}`.
  Proposed contexts: identity, library, ingestion, processing, playback, analytics, billing.
- `domain` has no framework or infrastructure dependencies.
- Events inside a context: `@nestjs/cqrs` (`AggregateRoot.apply()` + `EventBus`).
  Between contexts/services: outbox table in the same transaction → relay → SQS (with DLQ).
- Postgres is the main database (MikroORM recommended). Redis only for cache/rate limit.
- Uploads go straight from the browser to S3 via presigned multipart URLs, never through the api.
- Infra: AWS via Terraform (`infra/terraform`), Docker, docker-compose with LocalStack (S3/SQS) locally.

Open decisions — ask the user, don't assume:
- Panda-style B2B protected content (recommended) vs Vimeo-style public pages.
- MongoDB: recommended to leave it out (Postgres now, ClickHouse later for playback analytics).
- Auth provider.
- Unit test runner (none configured yet; Vitest + SWC recommended).

## Constraints

- No webpack anywhere. Node/Nest builds use `tsc`; frontends use Vite or the framework's bundler.
  Nx generators may add webpack, ESLint or Prettier — remove them after generating.
- No Nx Cloud, no ESLint, no Prettier. Biome handles format, lint and import sorting.
- ESM: relative imports use the `.js` extension (`import { X } from './x.js'`).
- Nest DI: never use `import type` for injected classes (it erases the runtime reference).
  Biome's `useImportType` is turned off for `apps/api/**` and `packages/**` for this reason.
- New dependencies with install scripts must be listed in `allowBuilds` in `pnpm-workspace.yaml`
  (`true` only if the script is needed); otherwise `pnpm install` fails in CI.
- Keep `.claude/settings.json` expanded (Biome override `expand: "always"`); Nx compares its text.

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

- Husky `pre-push` runs Biome, OpenSpec validation and `nx affected` (no e2e).
- CI (GitHub Actions) runs the same plus e2e, with `nrwl/nx-set-shas` for the affected base.

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
