# Koalaflow

Video hosting platform in the style of Vimeo / Panda Video:
upload → FFmpeg transcoding to HLS → signed CloudFront delivery → embedded player.

## Language

Code, identifiers, comments, commit messages and OpenSpec artifacts are in English, even when the user writes in Portuguese.

## Commits

One line, `<type>(<scope>): <subject>` (Conventional Commits): lowercase, imperative, no trailing period, no body, no `Co-Authored-By` trailer. Never run `git push`; the user pushes.

- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`.
- Scope: the area changed (`infra`, `site`, `app`, `api`, `worker`, `ui`); omit it only for changes that span the whole workspace or only touch CI. One commit per area (`infra` and `site` changes go in separate commits).

```
feat(infra): add monthly aws cost budget alert
fix(site): read build urls from apps/site/.env
chore: switch to pnpm
ci: scan for secrets with gitleaks
```

## Workspace

Nx 23 + pnpm 11 workspaces (`apps/*`, `packages/*`, `infra/terraform`), Node 24 (`.nvmrc`; run `nvm use`). Package scope `@koalaflow/*`; pnpm only (never npm/yarn).

- `apps/api`: NestJS 12 (ESM), MikroORM 7 (Postgres), Better Auth, nestjs-pino, class-validator; built with `tsc` (`@nx/js:tsc`); holds the bounded contexts.
- `apps/app`: Next 16 (App Router, Turbopack) creator dashboard, frontend only (no auth logic; `proxy.ts` forwards `/api/*` to the api). The player is its `/embed/[videoId]` route with Video.js 10 (`@videojs/react`); there is no separate player app.
- `apps/site`: Next 16 static export (`output: 'export'`), public marketing site for the apex domain, pt-BR only.
- `apps/worker` (planned): Node + FFmpeg, consumes SQS, outputs HLS.
- `packages/ui`: shared design tokens (`@koalaflow/ui/theme.css`, a Tailwind 4 `@theme`) imported by `apps/app` and `apps/site`; add shared React components only when both apps need the same one. Not a bounded context (no `domain/application/infra` layout).

Area details, read when the task touches the area:

- `apps/api` (run locally, config, errors, migrations, e2e): `docs/api.md`.
- `apps/app` and `apps/site` (Nx targets, static export, preview): `docs/next-apps.md`.
- `infra/terraform` (roots, state, CloudFront Functions, CI roles): `docs/infrastructure.md`.

## Architecture (DDD)

- Bounded contexts live in `apps/api/src/contexts/<context>/{domain,application,infra}`; move one to `packages/<context>` only when a second app imports it (`apps/worker` talks to the api through SQS messages, not imports). Proposed contexts: auth, library, ingestion, processing, playback, analytics, billing.
- `domain` has no framework or infrastructure dependencies.
- `application` holds the use cases: one class with `execute()` per `<Name>.UseCase.ts` file (`GetTenant.UseCase.ts`). Controllers, guards and library hooks in `infra` call them; business rules live in the use cases, not in the adapters.
- Events inside a context: `@nestjs/cqrs` (`AggregateRoot.apply()` + `EventBus`), added with the first domain event. Between contexts/services: outbox table in the same transaction → relay → SQS (with DLQ).
- Postgres is the main database (MikroORM), Redis only for cache/rate limit. No MongoDB; ClickHouse later for playback analytics.
- Every table lives in the `public` schema, Better Auth's included. Better Auth's tables arrive as raw SQL migrations and are listed in `schemaGenerator.skipTables`, otherwise MikroORM's diff drops every table that has no entity.
- Uploads go straight from the browser to S3 via presigned multipart URLs, never through the api.

Decided:
- Product model: Panda-style B2B protected content (private by default, domain-restricted embeds, signed URLs; no public discovery pages).
- Unit test runner: Vitest + SWC (SWC keeps Nest decorator metadata).
- Auth: Better Auth (self-hosted, data in Postgres) in `apps/api`, owned by the `auth` context. Passwordless (email code, Google); the tenant is the session's active organization.

## Constraints

- No webpack, ESLint, Prettier or Nx Cloud anywhere. Node/Nest builds use `tsc`; frontends use Vite or the framework's bundler; Biome handles format, lint and import sorting. Nx generators may add webpack, ESLint or Prettier: remove them after generating.
- ESM: relative imports use the `.js` extension (`import { X } from './x.js'`). Next apps import their own modules through the `@/` alias (`src/*`) instead, since Turbopack does not map `.js` imports to `.ts`.
- Nest DI: never use `import type` for injected classes (it erases the runtime reference). For this reason Biome's `useImportType` is off for `apps/api/**` and `packages/**`, as is `noStaticOnlyClass` (Nest dynamic modules are classes with only a static `forRoot`).
- Keep `.claude/settings.json` expanded (Biome override `expand: "always"`); Nx compares its text.

## Security

Security is part of design, code, tests and review, scaled to the risk of each change. References:
OWASP Top 10, OWASP API Security Top 10 (for `apps/api`) and OWASP ASVS Level 2 as the checklist for authentication, sessions and access control.

### Security-sensitive changes

A change is security-sensitive when it touches: authentication, sessions or tokens; authorization or tenant-scoped data; uploads, S3 keys, file paths or FFmpeg; playback signing, keys or embed domain rules; requests to URLs that come from input; raw SQL; IAM, networking or anything public; secrets; payments or webhooks; personal data; a new dependency or GitHub Action.

- Before coding: list the threats, their mitigations and the effect on existing access rules (in `design.md` when using OpenSpec). Ask the user before accepting a risk without mitigation.
- After coding: review the diff against `docs/security.md` (`/security-review` on the branch).
- Other changes (copy, styling, refactors without new inputs) follow `docs/security.md` without a written threat analysis.
- When reading or reviewing code, report vulnerabilities you notice (severity, `file:line`, suggested fix) even outside the task; fix them only when they are in scope.

Rules by area (access control, input and injection, uploads and playback, web apps, errors and logs, infrastructure and dependencies, security tests, secrets): `docs/security.md`. Read it before coding or reviewing a security-sensitive change.

## Simplicity

- Prefer the simplest solution that meets the spec. Reuse existing code and library defaults before adding anything; add an abstraction, file, export, option or config only for a current use, never "for a later change".
- Do not set an option to its default value, and do not export what only its own file uses.
- Each rule has one home: project policies in this file, OpenSpec artifact rules in `openspec/config.yaml`, decisions of a change in its artifacts, behavior details in code (`Rule:` comments). Anywhere else, point to it instead of restating it. Before adding an instruction, comment or doc, look for one that already says it, in any wording, and update that one instead.
- Before finishing, review the whole diff for leftovers: unused code, exports, files, options or dependencies, debug output, and stale comments or docs.

## Code comments

Comments about business rules or design decisions are simple, short and objective, in a block comment with one `* Rule: ...` line per rule:

```ts
/**
 * Rule: a video can only be published after transcoding succeeds.
 */
```

## Testing policy

- Unit tests: prioritize business rules, validations, calculations, error scenarios and relevant behaviors. Verify expected results and behavior, not internal implementation details.
- E2E tests: only when the integration between important modules, services or components needs validation. Prioritize business-critical scenarios and those where integration can fail.
- Prefer tests that add confidence and prevent regressions over chasing coverage. Keep them simple, deterministic, independent and easy to understand; avoid duplication, unnecessary mocks and brittle tests tied to internals.
- Every new feature or bug fix adds or updates the relevant tests. Run the relevant tests after changes and fix failures before considering the work done.

## Spec-driven development (OpenSpec)

- Flow: `/opsx:explore` (optional) → `/opsx:propose <name>` → user reviews → `/opsx:apply` → `/opsx:archive`.
- `openspec/config.yaml` also keeps a short summary of this project (update it when a fact in it changes) and names the sections of this file for policies.
- In `openspec/config.yaml`, quote YAML list items that contain `": "`, or the rules are ignored.

## Claude Code models

`.claude/settings.json` sets `"model": "opusplan"`: Opus 5.5 in plan mode, Sonnet 5.5 outside it. The mode picks the model:

- Plan mode (Shift+Tab): architecture, hard bugs, security-sensitive or multi-area changes.
- Outside plan mode: small edits, copy, simple refactors.
- `/model opus` keeps Opus for work that writes files while it reasons (e.g. a large `/opsx:propose`).

## Checks

- `pnpm check`: Biome format + lint + imports (add `--write` to fix).
- `pnpm exec openspec validate --all --strict --no-interactive`: validate specs and changes.
- `pnpm nx affected -t lint test build typecheck`: affected projects.
- `pnpm nx lint @koalaflow/infra`: Terraform fmt + validate for every root.

Husky `pre-push` runs gitleaks on the pushed commits (when installed; `brew install gitleaks`), Biome, OpenSpec validation and `nx affected` (no e2e). CI (GitHub Actions) runs the same plus e2e, with `nrwl/nx-set-shas` for the affected base, and a `secrets` job that runs gitleaks over the full history.

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
