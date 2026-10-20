# Tasks

## 1. Terraform project scaffolding

- [x] 1.1 Create the `infra/terraform` layout from design §1 (`bootstrap/`, `global/`, `envs/prod/site/`, `modules/static-site/`, `modules/github-oidc-role/`, `scripts/`), remove `.gitkeep`, and add Terraform local files (`.terraform/`, `*.tfstate*`, `*.tfplan`, `crash.log`) to `.gitignore`; verify `git status` shows no ignored artifacts after a local `terraform init`
- [x] 1.2 Add `infra/terraform/package.json` (`@koalaflow/infra`, `type: module`, `vitest` dev dependency matching `apps/site`) and `infra/terraform/vitest.config.js`, and add `infra/terraform` to `pnpm-workspace.yaml`; verify `pnpm install` succeeds and `pnpm nx show project @koalaflow/infra` lists the project
- [x] 1.3 Add `scripts/validate.sh` (runs `terraform fmt -check -recursive`, then `init -backend=false` + `validate` for every root) and wire it as the `lint` target, with `test` running `vitest run`; verify `pnpm nx lint @koalaflow/infra` passes on the empty roots

## 2. Remote state bootstrap

- [ ] 2.1 Write `bootstrap/` (state bucket `koalaflow-tfstate-<account-id>` with versioning, SSE-S3, public access block, bucket-owner-enforced, noncurrent-version expiry, `prevent_destroy`), pinned `versions.tf` and committed `.terraform.lock.hcl`; verify `terraform validate` and `terraform plan` show only the bucket resources
- [ ] 2.2 Apply `bootstrap/` locally, add its `backend.tf` (`use_lockfile = true`) and migrate the local state into the bucket; verify `terraform plan` reports no changes using the remote backend and a `.tflock` object appears during an operation
- [ ] 2.3 Add `backend.tf` with the real bucket name and keys `global/terraform.tfstate` and `prod/site/terraform.tfstate` to the other roots; verify `terraform init` succeeds in each

## 3. Global root (account-wide)

- [ ] 3.1 Implement `modules/github-oidc-role` (role with trust on `token.actions.githubusercontent.com`, `aud = sts.amazonaws.com`, `sub` patterns as input, managed and inline policies as inputs); verify `terraform validate` passes and the rendered trust policy in a plan matches design §9
- [ ] 3.2 Implement `global/`: Route 53 hosted zone for `var.domain_name` (default `koalaflow.com`), GitHub OIDC provider, `koalaflow-terraform-plan` and `koalaflow-terraform-apply` roles, outputs for zone ID, name servers, OIDC provider ARN and role ARNs; verify `terraform plan` lists exactly these resources
- [ ] 3.3 Apply `global/` locally, delegate the registrar's name servers to the zone output, and create the GitHub environment `production` with a required reviewer; verify `dig NS koalaflow.com` returns the Route 53 name servers

## 4. Static site module

- [x] 4.1 Write `modules/static-site/functions/viewer-request.js` (www → apex 301, directory index rewrite, trailing-slash 301 keeping query string) with unit tests in `viewer-request.test.js` covering every case listed in design §12; verify `pnpm nx test @koalaflow/infra` passes
- [ ] 4.2 Implement the S3 bucket (private, SSE-S3, versioning with 30-day noncurrent expiry) and OAC-only bucket policy; verify the plan shows no public access and the policy is scoped by `AWS:SourceArn`
- [ ] 4.3 Implement the ACM certificate (apex + www, DNS validation records in the zone) and the CloudFront distribution: OAC origin, `redirect-to-https`, TLS 1.2_2021, HTTP/2+3, IPv6, `PriceClass_All`, function association, custom cache policy (design §5), response headers policy (design §6), and 403/404 → `/404.html` with status 404; verify `terraform validate` passes and the plan matches design §3–§6
- [ ] 4.4 Add Route 53 `A`/`AAAA` alias records for apex and www, and module outputs (bucket name, distribution ID and ARN, domain); verify `terraform plan` from a root using the module shows the records
- [x] 4.5 Make `domain_name` optional in `global/` (no hosted zone when null) and in `modules/static-site` (no certificate, aliases or records; CloudFront default certificate; `url` falls back to the CloudFront domain), reading nullable `global` outputs with `try()` in `envs/prod/site/`; verify `pnpm nx lint @koalaflow/infra` passes with `domain_name` unset

## 5. Production site root

- [ ] 5.1 Implement `envs/prod/site/` using `modules/static-site` and `modules/github-oidc-role` (deploy role trusted only for `ref:refs/heads/main`, permissions from design §9), reading zone ID and OIDC provider ARN from `global` remote state, with `default_tags`; verify `terraform plan` succeeds
- [ ] 5.2 Apply `envs/prod/site/` and set repository variables `SITE_BUCKET`, `SITE_DISTRIBUTION_ID`, `SITE_DEPLOY_ROLE_ARN`, `AWS_REGION` and the production `SITE_URL`/`APP_URL`/`SALES_CONTACT_URL`; verify `https://koalaflow.com/` answers over TLS with the issued certificate (403/404 until the first deploy is expected)

## 6. Deploy workflow

- [ ] 6.1 Add `.github/workflows/deploy-site.yml` per design §7 (path filters, `workflow_dispatch`, concurrency, `id-token: write`, Nx build, two-step `s3 sync` with cache headers, invalidation and wait); verify a run on `main` publishes the site and the failing-build path stops before any AWS step (check with a dispatch on a branch that breaks the build, without credentials)
- [x] 6.2 Make the site's `SITE_URL`/`APP_URL`/`SALES_CONTACT_URL` required (no defaults in `apps/site/src/config.ts`), add `apps/site/.env.example`, git-ignore `.env`/`.env.*` at the root, and copy the example in `ci.yml` before `nx affected`; verify `nx build @koalaflow/site` fails without `apps/site/.env` and passes with it

## 7. Terraform workflow

- [ ] 7.1 Add `.github/workflows/terraform.yml` per design §8: paths filter per root (`global`, `envs/prod/site`, with module paths mapped to the roots that use them), pinned `hashicorp/setup-terraform`, PR job with `fmt -check`, `validate`, `plan -lock=false` using the plan role and an updated-in-place PR comment; verify on a test PR that the plan is posted and no resource changes
- [ ] 7.2 Add the `main` apply job in the `production` environment using the apply role; verify an apply waits for approval, and that assuming the apply role from a non-`main`/non-environment job fails
- [ ] 7.3 Add `hashicorp/setup-terraform` to `.github/workflows/ci.yml` so `nx affected -t lint` can lint `@koalaflow/infra`; verify CI passes on a PR touching `infra/terraform`

## 8. Documentation

- [ ] 8.1 Add `infra/terraform/README.md` with the layout, the one-time bootstrap/global/NS steps from the design's migration plan, how to add a component or environment, and rollback; verify each command in it runs as written against the current roots
- [x] 8.2 Update `CLAUDE.md` (Workspace and Checks sections: infra project, Terraform requirement, roots layout, deploy workflow) and keep `openspec/config.yaml` context in sync; verify `pnpm exec openspec validate --all --strict --no-interactive` passes

## 9. Local preview container

- [x] 9.1 Add `apps/site/Dockerfile` (multi-stage: pnpm build of the static export, then unprivileged nginx serving `out/`), `Dockerfile.dockerignore` and `apps/site/docker/*.conf` mirroring the edge rules (directory index, trailing-slash 301, 404 page with status 404, cache and security headers except HSTS); verify `docker build -f apps/site/Dockerfile .` succeeds and `curl` against the container shows those behaviours

## 10. Verification

- [ ] 10.1 Run `pnpm check` and `pnpm nx affected -t typecheck build test lint` and confirm both pass, then confirm the deploy workflow passed on the latest `main` run
