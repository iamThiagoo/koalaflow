<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/koalaflow-logo-white.png">
    <img src=".github/assets/koalaflow-logo.png" alt="Koalaflow" width="220">
  </picture>
</p>

<p align="center">Video hosting for protected business content.</p>

Koalaflow is a video hosting platform in the style of Vimeo and Panda Video, built for companies
that sell or distribute private content. Videos are private by default and play only through
signed URLs, inside embeds restricted to the customer's own domains.

## Status

The project is in early development.

- **Marketing site** (`apps/site`): static landing page in Portuguese, deployed to S3 and
  CloudFront.
- **Infrastructure** (`infra/terraform`): AWS resources managed with Terraform, applied from
  GitHub Actions through OIDC roles, with a monthly cost budget alert.
- **API** (`apps/api`) and **creator dashboard** (`apps/app`): NestJS and Next.js apps set up,
  with no product features yet.

The planned video flow is: direct browser upload to S3, FFmpeg transcoding to HLS in a worker,
signed delivery through CloudFront, and playback in an embedded Video.js player.

## Structure

| Path | Description |
| --- | --- |
| `apps/site` | Public marketing site, Next.js static export |
| `apps/app` | Creator dashboard and embed player, Next.js |
| `apps/api` | Backend API, NestJS |
| `packages/ui` | Shared design tokens for Tailwind |
| `infra/terraform` | AWS infrastructure ([README](infra/terraform/README.md)) |
| `openspec` | Feature specifications and change proposals |

## Getting started

Requires Node 24 and pnpm 11.

```sh
nvm use
pnpm install
cp apps/site/.env.example apps/site/.env
pnpm nx dev @koalaflow/site
```

The site runs on `http://localhost:3002`. The dashboard (`@koalaflow/app`) and the API
(`@koalaflow/api`) start the same way, on ports 3001 and 3000.

To run the checks used in CI:

```sh
pnpm check
pnpm nx affected -t lint test build typecheck
```

Linting `@koalaflow/infra` also requires Terraform installed locally.

Project conventions are described in [CLAUDE.md](CLAUDE.md).
