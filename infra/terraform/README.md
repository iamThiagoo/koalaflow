# Koalaflow infrastructure (Terraform)

AWS infrastructure for Koalaflow. One AWS account, region `us-east-1`, production only for now.

## Layout

```
infra/terraform/
  bootstrap/           # state bucket; applied once by hand, never in CI
  global/              # account-wide: Route 53 zone, GitHub OIDC provider, Terraform CI roles
  envs/
    prod/
      site/            # marketing site (apps/site) + its deploy role
      network/         # VPC, public/private subnets, single NAT gateway
      ecr/             # container image repositories (api, app) + push role
      data/            # RDS Postgres + ElastiCache Redis (private subnets)
      api/             # ECS Fargate cluster + api service (Cloud Map, secrets)
  modules/
    static-site/       # private S3 + CloudFront (OAC) + ACM + DNS + viewer-request function
    github-oidc-role/  # IAM role assumable from GitHub Actions via OIDC
  scripts/
    validate.sh        # fmt + validate for every root (nx lint)
```

Each directory under `bootstrap/`, `global/` and `envs/<env>/<component>/` is a root with its own
state (`<root path>/terraform.tfstate` key in the state bucket, S3 native locking). Roots read each
other's outputs only through `terraform_remote_state`.

## Requirements

- Terraform `~> 1.16` (CI pins 1.16.5).
- AWS credentials with admin access for the one-time setup below.
- `pnpm nx lint @koalaflow/infra` (fmt + validate) and `pnpm nx test @koalaflow/infra`
  (viewer-request function) run in CI and in the pre-push hook.

## One-time setup

Run from `infra/terraform` with admin credentials for the target account.

1. **State bucket**

   ```sh
   terraform -chdir=bootstrap init
   terraform -chdir=bootstrap apply
   ```

   Then create `bootstrap/backend.tf` (bucket = the `state_bucket` output, key
   `bootstrap/terraform.tfstate`) **before** migrating; without it `-migrate-state` does nothing and
   deleting the local state loses it. Move the local state into the bucket:

   ```sh
   terraform -chdir=bootstrap init -migrate-state
   rm bootstrap/terraform.tfstate bootstrap/terraform.tfstate.backup
   ```

2. **Account-wide resources**

   Set `github_subject_prefix` in `global/terraform.tfvars` to the repository's OIDC subject prefix
   (`gh api repos/<owner>/<repo>/actions/oidc/customization/sub`, field `sub_claim_prefix`). With
   immutable subjects it includes the owner and repository IDs; a wrong prefix makes every CI role
   fail with `Not authorized to perform sts:AssumeRoleWithWebIdentity`.

   Budget alert emails are personal data and stay out of the repository. Create
   `global/local.auto.tfvars` (git-ignored) with `budget_alert_emails = ["you@example.com"]` and
   the repository secret `BUDGET_ALERT_EMAILS` with the same list as JSON (`["you@example.com"]`);
   CI passes it as `TF_VAR_budget_alert_emails`.

   ```sh
   terraform -chdir=global init
   terraform -chdir=global apply
   terraform -chdir=global output name_servers
   ```

   `domain_name` in `global/terraform.tfvars` is optional. Without it no hosted zone is created and
   `name_servers` is null; skip the registrar step. With it, set those name servers at the domain
   registrar and wait until `dig NS <domain> +short` returns them (the site certificate cannot
   validate before that).

3. **GitHub settings** (repository → Settings)

   - Environment `production` with at least one required reviewer.
   - Repository variables:

     | Variable | Value |
     |---|---|
     | `AWS_REGION` | `us-east-1` |
     | `TERRAFORM_PLAN_ROLE_ARN` | `terraform -chdir=global output -raw terraform_plan_role_arn` |
     | `TERRAFORM_APPLY_ROLE_ARN` | `terraform -chdir=global output -raw terraform_apply_role_arn` |
     | `APP_URL` | `https://app.koalaflow.com` |
     | `SALES_CONTACT_URL` | `mailto:sales@koalaflow.com` |

4. **Site**

   ```sh
   terraform -chdir=envs/prod/site init
   terraform -chdir=envs/prod/site apply
   ```

   Add repository variables from its outputs: `SITE_URL` (`site_url`), `SITE_BUCKET`
   (`site_bucket`), `SITE_DISTRIBUTION_ID` (`site_distribution_id`) and `SITE_DEPLOY_ROLE_ARN`
   (`site_deploy_role_arn`). Then run the **Deploy site** workflow once from `main`.

   Without a domain the site is served on `https://<id>.cloudfront.net` and `site_url` returns that
   URL.

5. **Network**

   ```sh
   terraform -chdir=envs/prod/network init
   terraform -chdir=envs/prod/network apply
   ```

   Apply it before any component that runs inside the VPC (api, app, databases). The single NAT
   gateway costs about US$ 33/month while it exists; run `terraform destroy` on this root to stop
   paying when nothing uses it.

6. **ECR**

   ```sh
   terraform -chdir=envs/prod/ecr init
   terraform -chdir=envs/prod/ecr apply
   ```

   Add the repository variable `ECR_PUSH_ROLE_ARN` (`ecr_push_role_arn`). The role can push only
   from `main`, to the `koalaflow-api` and `koalaflow-app` repositories.

7. **Data**

   ```sh
   terraform -chdir=envs/prod/data init
   terraform -chdir=envs/prod/data apply
   ```

   Apply it after `network`. RDS (`db.t4g.micro`) and ElastiCache (`cache.t4g.micro`) cost roughly
   US$ 25/month together while they exist; run `terraform destroy` on this root to stop paying. Both
   security groups start without ingress rules; the api root adds them.

8. **Api**

   ```sh
   terraform -chdir=envs/prod/api init
   terraform -chdir=envs/prod/api apply
   aws secretsmanager put-secret-value \
     --secret-id "$(terraform -chdir=envs/prod/api output -raw better_auth_secret_arn)" \
     --secret-string "$(openssl rand -base64 32)"
   ```

   Apply it after `network`, `ecr` and `data`. `desired_count` is 0 in `terraform.tfvars` until an
   image exists in ECR; then set `image_tag` and `desired_count = 1` and apply again. It adds the
   api's ingress rules to the database and Redis security groups.

9. **Adding the domain later**

   Set `domain_name` in `global/terraform.tfvars`, apply `global`, delegate the name servers and
   wait for `dig NS`, then apply `envs/prod/site` (adds the certificate, aliases and DNS records in
   place) and update the `SITE_URL` repository variable to the new `site_url`.

## Day to day

- **Infrastructure change**: open a pull request. The **Terraform** workflow posts a plan per
  affected root. After merge, the apply job waits for approval in the `production` environment.
- **Site change**: merging to `main` runs **Deploy site**: build, upload to S3, invalidate
  CloudFront.
- Run a plan locally: `terraform -chdir=envs/prod/site plan`.

## Rollback

- **Site**: run **Deploy site** manually from `main` with the `ref` input set to the last good
  commit SHA.
- **Infrastructure**: revert the pull request; the gated apply puts the previous configuration back.
- **State**: the state bucket is versioned; restore a previous object version of the affected key.

## Adding a component or environment

- **Component** (e.g. worker): create `envs/prod/worker/` with `versions.tf`, `backend.tf`
  (key `prod/worker/terraform.tfstate`), `providers.tf`, `variables.tf`, `terraform.tfvars`, `main.tf`
  and `outputs.tf`; read `global` outputs through `terraform_remote_state`; add a filter for it in
  `.github/workflows/terraform.yml` after the roots it reads.
- **Environment** (e.g. staging): copy `envs/prod/<component>` to `envs/staging/<component>`,
  change the state key, names (`koalaflow-staging-*`) and `Environment` tag, and use a subdomain
  such as `staging.koalaflow.com`. Its deploy role should trust a staging GitHub environment.
