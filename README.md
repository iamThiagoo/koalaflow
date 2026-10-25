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

## Structure

| Path | Description |
| --- | --- |
| `apps/app` | Creator dashboard and embed player in Next.js |
| `apps/api` | Backend API in NestJS |
| `apps/site` | Landing Page in Next.js |
| `packages/ui` | Shared design for Tailwind |
| `infra/terraform` | AWS infrastructure ([README](infra/terraform/README.md)) |
| `openspec` | Feature specifications and change proposals |

##

Project conventions are described in [CLAUDE.md](CLAUDE.md).
