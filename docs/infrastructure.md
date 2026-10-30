# Infrastructure

`infra/terraform` is the Nx project `@koalaflow/infra`; its `README.md` covers the layout, setup, day-to-day work, rollback and adding a component or environment. One AWS account, `us-east-1`, prod only for now.

- Roots, one state each: `bootstrap/` (applied by hand once), `global/`, `envs/<env>/<component>/`; shared code in `modules/`. Roots read each other only through `terraform_remote_state`. A new root must be added to the paths filter in `terraform.yml`, after the roots it reads.
- State: S3 backend with `use_lockfile = true` (no DynamoDB). Commit `.terraform.lock.hcl` locked for `linux_amd64` and `darwin_arm64` (`terraform providers lock -platform=...`).
- Pushing needs Terraform installed: the `lint` target runs `terraform fmt -check` + `validate` on every root. `test` runs Vitest on the CloudFront Function.
- CloudFront Functions are plain scripts with a top-level `handler`: no ES module syntax, no `for...of` (the `cloudfront-js-2.0` runtime rejects it). Vitest runs them on Node, so check a new construct with `aws cloudfront test-function` before relying on it.
- CI uses GitHub OIDC roles, never static AWS keys. `.github/workflows/terraform.yml` plans on PRs and applies on `main` behind the `production` environment; `.github/workflows/deploy-site.yml` publishes `apps/site` to S3/CloudFront on push to `main`.
