# Design

## Context

- `apps/site` is a Next static export (`output: 'export'`, `trailingSlash: true`) that writes
  `apps/site/out/` with `index.html`, `404.html`, `robots.txt`, `sitemap.xml`, fingerprinted
  assets under `_next/static/`, unhashed images under `landing/`, and RSC `*.txt` payloads. It
  reads `SITE_URL`, `APP_URL` and `SALES_CONTACT_URL` at build time; the production defaults are
  `https://koalaflow.com` and `https://app.koalaflow.com`.
- `infra/terraform` only contains `.gitkeep`. Terraform 1.16 is installed locally.
- CI (`.github/workflows/ci.yml`) and the Husky `pre-push` hook run Biome, OpenSpec validation and
  `nx affected -t lint test build typecheck`. Biome does not format HCL.
- Repository: `github.com/iamThiagoo/koalaflow`.
- User decisions: one AWS account, prod only for now, `us-east-1`, Route 53 managed by Terraform,
  GitHub Actions with OIDC, plan on PRs and gated apply.

No aggregates or domain events are involved: this change has no bounded-context code.

## Goals / Non-Goals

**Goals:**
- A Terraform layout where adding a component (api, app, worker) or an environment (staging) is a
  new directory that reuses modules, not a refactor.
- Small blast radius: one state per environment and component.
- Site served from S3 + CloudFront at the edge with no server to operate.

**Non-Goals:**
- Terragrunt or any wrapper; plain Terraform roots are enough for this size.
- Content-Security-Policy (Next static export emits inline scripts; needs hashes or nonces work).
- Deploying from developer machines as the normal path (local apply stays possible for bootstrap).

## Decisions

### 1. Directory layout: roots per environment and component

```
infra/terraform/
  package.json              # Nx project @koalaflow/infra (lint, test targets)
  bootstrap/                # state bucket; applied once locally
  global/                   # account-wide: Route 53 zone, GitHub OIDC provider, Terraform CI roles
  envs/
    prod/
      site/                 # uses modules/static-site; outputs bucket, distribution, deploy role
      # api/ app/ worker/ network/ data/  (later)
    # staging/ (later)
  modules/
    static-site/            # S3 + OAC + CloudFront + function + ACM + DNS records
      functions/viewer-request.js
      functions/viewer-request.test.js
    github-oidc-role/       # IAM role trusted by GitHub OIDC with subject conditions
```

- Each root has `versions.tf` (`required_version = "~> 1.16"`, AWS provider `~> 6.0`),
  `backend.tf`, `providers.tf`, `variables.tf`, `outputs.tf`, `main.tf`, a committed
  `.terraform.lock.hcl` and a committed `terraform.tfvars` (no secrets live in Terraform vars).
- Roots read each other's outputs with `terraform_remote_state` (e.g. `envs/prod/site` reads the
  hosted zone ID and OIDC provider ARN from `global`). Only read access crosses roots.
- Provider `default_tags`: `Project=koalaflow`, `Environment`, `Component`, `ManagedBy=terraform`.
- Alternatives: one root per environment (simpler, but every api change would plan the site and
  share a lock); Terragrunt (extra tool, not justified yet); workspaces (hide which environment a
  plan targets).

### 2. Remote state: S3 with native lock file

- `bootstrap/` creates `koalaflow-tfstate-<account-id>` (versioning, SSE-S3, public access block,
  `prevent_destroy`, lifecycle expiring noncurrent versions after 90 days). It is applied once
  with local state, then migrated into the bucket it created (`terraform init -migrate-state`).
- Every root uses `backend "s3"` with `use_lockfile = true` (no DynamoDB table) and key
  `<env>/<component>/terraform.tfstate` (`global/terraform.tfstate`, `bootstrap/terraform.tfstate`).
- Backend blocks cannot use variables, so the bucket name is written literally in each
  `backend.tf` after bootstrap reveals the account ID.

### 3. Site delivery: one CloudFront distribution, private S3 origin with OAC

- S3 bucket `koalaflow-prod-site-<account-id>`: private, bucket-owner-enforced, public access
  block, SSE-S3, versioning with noncurrent expiry (30 days). Bucket policy allows `s3:GetObject`
  only to the distribution via OAC (`AWS:SourceArn` condition). No `s3:ListBucket` for CloudFront,
  so a missing key returns 403 from S3.
- CloudFront: aliases `koalaflow.com` and `www.koalaflow.com`, ACM certificate (DNS-validated in
  Route 53, `us-east-1`), `viewer_protocol_policy = redirect-to-https`, TLS 1.2_2021, HTTP/2+3,
  IPv6, `PriceClass_All` (Brazilian edges are not in `PriceClass_100`), `default_root_object =
  index.html`.
- Custom error responses: S3 403 and 404 → `/404.html` with response code 404, error caching TTL
  60s. This covers `/en/` and removed pages.
- Route 53: `A`/`AAAA` alias records for apex and `www` to the distribution.
- Alternatives: S3 website endpoint (requires a public bucket, no OAC); Amplify Hosting (less
  control, another service to learn for api/app later); two distributions for www redirect (extra
  cert and resource for a one-line rule).
- No domain yet: `domain_name` is optional in `global` and in the module. When it is null there is
  no hosted zone, certificate, aliases or DNS records; the distribution uses the CloudFront default
  certificate and the site URL is `https://<id>.cloudfront.net`. Setting the domain later adds the
  zone (then delegate name servers), the certificate and the records in place, without recreating
  the bucket or the distribution.

### 4. Viewer-request CloudFront Function (JS runtime 2.0)

One function, three rules, in order:
1. `Host` starts with `www.` → 301 to `https://<host without www.><uri><query>`.
2. URI ends with `/` → rewrite to `<uri>index.html`.
3. Last path segment has no `.` → 301 to `<uri>/` with the query string.

- The canonical host is derived from the request (strip `www.`), so the code has no templated
  values and the same file is deployed and tested.
- CloudFront Functions forbid ES module syntax, so the file defines a top-level `handler`. The
  test loads the source with `new Function(source + '; return handler;')` and asserts on the
  returned request/response objects.
- Alternative: Lambda@Edge (slower, regional replication, overkill for URI rewrites).

### 5. Caching

- Cache policy (custom): min TTL 0, default 1 day, max 1 year; no cookies, headers or query
  strings in the key; gzip and Brotli enabled. CloudFront honours the object's `Cache-Control`.
- Object metadata set at upload time:
  - `_next/static/**` → `public, max-age=31536000, immutable`.
  - everything else → `public, max-age=0, s-maxage=31536000, must-revalidate`: browsers revalidate
    every time, CloudFront keeps it until the deploy invalidates `/*`.
- Alternative: short edge TTL instead of invalidation (stale pages for minutes after a deploy;
  invalidating `/*` is one path and well within the free 1,000 paths/month).

### 6. Security headers

`aws_cloudfront_response_headers_policy` with HSTS (`max-age=63072000; includeSubDomains`, no
`preload` yet), `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy:
strict-origin-when-cross-origin`, `override = true`. It applies to error responses too.

### 7. Deploy workflow (`.github/workflows/deploy-site.yml`)

- Triggers: push to `main` with paths `apps/site/**`, `packages/ui/**`, `pnpm-lock.yaml`, and the
  workflow file; plus `workflow_dispatch` (also used to redeploy an older commit as rollback).
- `concurrency: deploy-site-prod` with `cancel-in-progress: false`.
- Steps: install, `pnpm nx build @koalaflow/site` with the production `SITE_URL`/`APP_URL`/
  `SALES_CONTACT_URL` from repository variables, assume the deploy role via
  `aws-actions/configure-aws-credentials` (OIDC), then:
  1. `aws s3 sync out/_next/static s3://…/_next/static` with the immutable header and **no**
     `--delete` (old chunks stay for pages already open).
  2. `aws s3 sync out s3://… --exclude "_next/static/*" --delete` with the revalidate header.
  3. `aws cloudfront create-invalidation --paths "/*"` and wait for completion.
- If the build fails, the job stops before any AWS call.
- Bucket name, distribution ID and role ARN are repository variables set from `envs/prod/site`
  outputs (they are identifiers, not secrets).
- Old `_next/static` files accumulate; a few MB per deploy is acceptable and can be pruned later.

### 8. Terraform workflow (`.github/workflows/terraform.yml`)

- Matrix of roots (`global`, `envs/prod/site`), filtered by `dorny/paths-filter`: a root runs when
  its directory or a module it uses changes. `bootstrap` is never run in CI.
- Pull request: `fmt -check`, `init`, `validate`, `plan -lock=false` with the **plan role**; the
  plan is posted as a PR comment (updated in place).
- Push to `main`: job in GitHub environment `production` (required reviewer) runs `plan` and
  `apply` with the **apply role**.
- Pinned Terraform version via `hashicorp/setup-terraform`.

### 9. IAM roles for GitHub OIDC (module `github-oidc-role`)

| Role | Defined in | Trust (`token.actions.githubusercontent.com:sub`) | Permissions |
|---|---|---|---|
| `koalaflow-terraform-plan` | `global` | `repo:iamThiagoo@69599810/koalaflow@1424810366:pull_request` | `ReadOnlyAccess` + state bucket read |
| `koalaflow-terraform-apply` | `global` | `repo:iamThiagoo@69599810/koalaflow@1424810366:environment:production` | `AdministratorAccess` (to be narrowed when components stabilise) |
| `koalaflow-prod-site-deploy` | `envs/prod/site` | `repo:iamThiagoo@69599810/koalaflow@1424810366:ref:refs/heads/main` | `s3:PutObject/DeleteObject/ListBucket` on the site bucket, `cloudfront:CreateInvalidation/GetInvalidation` on the distribution |

- `aud` must be `sts.amazonaws.com`. The OIDC provider is created once in `global`.
- The repository uses GitHub's immutable OIDC subjects (`repo:<owner>@<owner-id>/<repo>@<repo-id>`),
  so a rename or a recreated repository with the same name cannot assume the roles. The prefix
  is the `github_subject_prefix` variable of `global`.
- `plan -lock=false` avoids giving the plan role write access to the state bucket.
- `global` is bootstrapped with a local admin apply because it creates the roles CI uses.

### 10. Nx integration

- Add `infra/terraform` to `pnpm-workspace.yaml` as `@koalaflow/infra` with:
  - `lint`: `terraform fmt -check -recursive` plus `terraform init -backend=false && terraform
    validate` for each root (a small shell script in `infra/terraform/scripts/validate.sh`).
  - `test`: `vitest run` for the CloudFront function.
- `ci.yml` and the `pre-push` hook already run `nx affected -t lint test`; `ci.yml` gains a
  `hashicorp/setup-terraform` step. Developers need Terraform locally to push infra changes.
- New dev dependency: `vitest` in the infra package (same version as `apps/site`), needed to unit
  test the function. No other new npm dependencies.
- New external tooling: Terraform CLI, AWS provider `~> 6.0`, GitHub Actions
  `aws-actions/configure-aws-credentials`, `hashicorp/setup-terraform`, `dorny/paths-filter`.

### 11. Local preview container

`apps/site/Dockerfile` builds the static export and serves it with
`nginxinc/nginx-unprivileged` on port 8080, with nginx rules that mirror the CloudFront function
and error responses. It is for local runs only: no ECR repository and no container in production,
since a static site needs no server. The build uses the repository root as context (the site
depends on `packages/ui`); `Dockerfile.dockerignore` keeps the context to the site, its workspace
dependencies and root config files.

### 12. Test strategy

- Unit tests (Vitest, `modules/static-site/functions/viewer-request.test.js`): every rule of the
  viewer-request function — www redirect keeps path and query, directory rewrite, trailing-slash
  redirect keeps query, files with extensions untouched, `/` rewritten to `/index.html`, `/en/`
  rewritten (so S3 returns 404 page).
- Static checks: `terraform fmt -check` and `terraform validate` on every root via `nx lint`;
  `terraform plan` on PRs as review.
- No E2E test in CI and no post-deploy smoke check. The edge behaviours (redirects, 404 status,
  cache and security headers) are checked by hand with `curl` after the first deploy; the
  viewer-request function logic is covered by its unit tests.

## Risks / Trade-offs

- [Single account, prod only] A bad apply hits production directly → gated apply with plan
  review, `prevent_destroy` on the bucket, one state per component; staging can be added as
  `envs/staging/*` later.
- [Apply role is admin] Broad permissions in CI → only assumable from the protected `production`
  environment on this repository; narrow once api/worker resources are known.
- [Name servers not delegated] ACM DNS validation hangs until the registrar points to Route 53 →
  apply `global` first, delegate NS, then apply `envs/prod/site` (documented in the runbook).
- [HSTS includeSubDomains] Any future subdomain must serve HTTPS → all planned subdomains
  (`app.`, `api.`, video CDN) use HTTPS anyway; `preload` is left off so it can be reverted.
- [`/*` invalidation] Every deploy evicts all cached objects, including unchanged images → cost is
  negligible at current traffic; switch to targeted paths if it matters.
- [Old assets accumulate] `_next/static` grows with each deploy → acceptable; add pruning later.
- [Error responses cached 60s] A page added right after a 404 was cached may 404 for a minute →
  deploy invalidation clears it.

## Migration Plan

1. Run `bootstrap` locally with admin credentials; migrate its state into the new bucket.
2. Write the bucket name into every `backend.tf`.
3. Apply `global` locally; delegate the domain's name servers at the registrar to the Route 53
   zone output; create the GitHub environment `production` with a required reviewer.
4. Apply `envs/prod/site` (locally or through the workflow); set repository variables from its
   outputs.
5. Merge to `main` → deploy workflow publishes the site.

Rollback: re-run the deploy workflow with `workflow_dispatch` on the previous good commit.
Infrastructure rollback is a revert PR followed by the gated apply.

## Open Questions

- Whether the domain is already registered and where (only affects the manual NS delegation step).
