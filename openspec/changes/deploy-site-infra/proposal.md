# Proposal

## Why

The marketing site (`apps/site`) builds to static files but is not published anywhere, and
`infra/terraform` is empty. We need a repeatable, reviewable way to put the site on the apex
domain now, with a Terraform layout and CI workflow that api, app and worker can reuse later
without restructuring.

## What Changes

- Add a Terraform layout under `infra/terraform` split into a one-time `bootstrap` root (remote
  state bucket), a `global` root (account-wide resources: Route 53 hosted zone, GitHub OIDC
  provider, Terraform CI roles) and per-environment, per-component roots (`envs/prod/site` now;
  `envs/prod/{api,app,worker,...}` and `envs/staging/*` later).
- Add a reusable `static-site` module: private S3 bucket, CloudFront distribution with Origin
  Access Control, TLS certificate, DNS records, viewer-request function (directory indexes,
  `www` → apex redirect), security response headers and cache policy.
- Serve `apps/site` on `https://koalaflow.com` (domain is a variable), with `www.koalaflow.com`
  redirecting to the apex, HTTP redirecting to HTTPS, and unknown paths returning the site's
  not-found page with status 404.
- Add a GitHub Actions deploy workflow: on push to `main` it builds the site and publishes it to
  S3 and invalidates CloudFront, authenticating with GitHub OIDC (no static AWS keys).
- Add a GitHub Actions Terraform workflow: `terraform plan` on pull requests touching
  `infra/terraform`, and `terraform apply` only after approval through a protected GitHub
  environment.
- Register `infra/terraform` as an Nx project so `nx affected` checks Terraform formatting,
  validation and the viewer-request function tests.

## Capabilities

### New Capabilities
- `site-hosting`: how the public marketing site is served on its domain (HTTPS, canonical host,
  directory indexes, not-found status, caching, security headers) and how a new build is published.
- `infrastructure-workflow`: how infrastructure changes are reviewed and applied (plan on pull
  request, gated apply, locked remote state, keyless CI credentials). Future components (api, app,
  worker) add their requirements here.

### Modified Capabilities
- `marketing-site`: the call-to-action URLs no longer fall back to defaults in code; they come from
  `apps/site/.env` locally and repository variables in CI, and the build fails when one is missing,
  so a deploy with unset variables cannot publish wrong links. Other requirements are unchanged.

## Impact

- Bounded contexts: none. This change is infrastructure and CI only; no `packages/<context>` code
  changes.
- New files: `infra/terraform/**`, `.github/workflows/deploy-site.yml`,
  `.github/workflows/terraform.yml`, `infra/terraform/package.json` (Nx project).
- Changed files: `pnpm-workspace.yaml` (adds `infra/terraform`), `.gitignore` (Terraform local
  files and `.env`/`.env.*`), `apps/site/src/config.ts` and `apps/site/.env.example` (required
  build settings), `.github/workflows/ci.yml` (installs Terraform so `nx affected` can lint the project),
  `CLAUDE.md` and `openspec/config.yaml` (document the infra layout and commands).
- External systems: one AWS account (`us-east-1`), Route 53 hosted zone for the domain (name
  servers delegated manually at the registrar), GitHub repository environment `production`.
- Tooling: Terraform CLI (`~> 1.16`) required locally and in CI for the `infra` project targets.

### Out of scope

- Infrastructure for `apps/api`, `apps/app` and `apps/worker` (VPC, compute, Postgres, Redis, SQS,
  video buckets, signed-URL CloudFront). The layout reserves a place for them.
- A staging environment; the layout allows adding `envs/staging/*` later.
- Multi-account setup (AWS Organizations), WAF, Content-Security-Policy, access logs, monitoring
  and budget alarms.
- Domain registration and registrar configuration (manual, one time).
- Preview deployments per pull request.
