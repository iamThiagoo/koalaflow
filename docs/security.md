# Security rules

Checklist for security-sensitive changes (trigger list and process: "Security" in CLAUDE.md).

## Access control

- Deny by default. Every api endpoint, Next server action and route handler authenticates and authorizes on the server; hiding UI is not a control.
- The tenant comes from the authenticated session, never from body, query, path or headers. Every query on tenant data filters by it; another tenant's resource returns 404, not 403.
- Ownership and permission checks live in the use cases (or Nest guards backed by them), so every entry point enforces them. Public IDs are UUIDs, never sequential.

## Input and injection

- Validate every external input at the boundary with a schema/DTO (type, length, format, enum) and reject unknown fields. External input includes HTTP, SQS messages, webhooks, file metadata and ffprobe output.
- SQL only through MikroORM or bound parameters; sort fields and column names from input are mapped from an allowlist.
- Run FFmpeg/ffprobe with `spawn`/`execFile` and an argument array (no shell, no flags from input).
- S3 keys and file paths are built by the server from IDs (`<tenant>/<video>/...`); the client filename is display metadata only.

## Uploads, media and playback

- Presigned upload URLs are short-lived, bound to a server-chosen key, and limited in size and part count; the object is checked (size, ffprobe) before transcoding.
- Uploaded media is hostile: FFmpeg runs with `-protocol_whitelist file` (crafted HLS/concat playlists can read local files or make requests), time/CPU/output limits, no secrets in its environment and no network beyond S3/SQS.
- Signed CloudFront URLs/cookies are short-lived and scoped to one video's path; only the playback service reads the signing key.
- Embed domain restriction is enforced with CSP `frame-ancestors` on `/embed/[videoId]` plus a server-checked playback token; `Referer` is only a hint.

## Web apps and outbound requests

- No `dangerouslySetInnerHTML` with user data. User-provided links must be `https:`; redirect targets come from an allowlist (no open redirects).
- Modules that read secrets import `server-only`. Session cookies are `HttpOnly`, `Secure`, `SameSite=Lax` or stricter; state changes never use GET; cookie-authenticated api routes check `Origin` or a CSRF token.
- `apps/app` sends CSP, HSTS, `X-Content-Type-Options` and `Referrer-Policy` (`apps/site` gets them from CloudFront).
- Fetching a URL from input (webhooks, import by URL): `https:` only, block private, loopback and link-local addresses (including `169.254.169.254`) after DNS resolution and on redirects, with timeouts and size limits.
- Incoming webhooks verify the signature over the raw body and a timestamp, and are idempotent.
- Rate-limit login, token issuance and upload creation (Redis).

## Errors and logs

- Clients get a status, a generic message and a request id. Stack traces, SQL, paths and upstream errors stay in server logs; the api uses one global exception filter that never echoes unknown error messages.
- Never log passwords, tokens, cookies, `Authorization` headers, signed or presigned URLs, or personal data; log IDs instead. Log authentication failures and denied access, without secrets.

## Infrastructure and dependencies

- Private by default: S3 public access block, OAC, databases in private subnets, no `0.0.0.0/0` ingress except 443 on a load balancer. Encrypt at rest; TLS 1.2+ in transit.
- IAM least privilege: one role per workload, scoped actions and resources; a `*` needs a `Rule:` comment explaining why. Workflows set minimal `permissions`.
- Add a dependency or GitHub Action only when the platform or an existing one does not cover it. Check maintenance and advisories (`pnpm audit --prod`), and name it in the design. A dependency with an install script must be listed in `allowBuilds` in `pnpm-workspace.yaml` (`true` only if the script is needed), or `pnpm install` fails in CI.

## Security tests

Follow the testing policy; add these only where the risk exists:

- Protected endpoints/handlers: unauthenticated is rejected; another tenant's resource returns 404.
- Validators: malicious or out-of-range input (path traversal in names, oversized values, unknown fields).
- Tokens and signed URLs: expiry, scope and tampering are rejected.

## Secrets and personal data

- Never commit secrets or personal data (gitleaks guards pushes and CI, see Checks in CLAUDE.md). `.env`, `.env.*` and `local.auto.tfvars` are git-ignored everywhere; only `.env.example` files are committed.
- Terraform state keeps every value in plain text; `sensitive = true` only hides CLI output. Keep secrets out of state: RDS with `manage_master_user_password`, private keys (e.g. the CloudFront signed-URL key) generated outside Terraform and stored in Secrets Manager, Terraform gets only the public key.
- Apps read secrets at runtime from Secrets Manager or SSM, never from `tfvars` or build-time env. Anything a Next app reads at build time, and every `NEXT_PUBLIC_*`, ends up in public files.
- GitHub repository variables are printed in workflow logs; sensitive values go in secrets (e.g. `BUDGET_ALERT_EMAILS` → `TF_VAR_budget_alert_emails`, a `sensitive` variable).
- The Terraform plan role reads resource configuration and the state, but is explicitly denied application data (objects outside the state bucket, secrets, parameters, KMS decrypt, table items, logs). A data source that needs such data requires changing `plan_data_guard` in `global/`.
