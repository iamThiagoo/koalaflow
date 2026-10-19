# Proposal

## Why

Koalaflow has no public web presence. Prospects have nowhere to learn what the product does or how
to reach the dashboard. The product is B2B protected content with no public discovery pages, so the
landing site is the only public, indexable surface. It should be built now, separately from the
authenticated dashboard and the embed player, so it does not weaken their security rules.

## What Changes

- New Next 16 app `apps/site` (`@koalaflow/site`), built as a fully static export (no Node server at
  runtime). It is meant to be served from the apex domain (`koalaflow.com`), while the dashboard
  stays on `app.koalaflow.com`.
- A home page in two locales: Brazilian Portuguese (default, at `/`) and English (at `/en/`), with a
  language switcher. It has a hero, product highlights (secure delivery, domain-restricted embeds,
  adaptive HLS streaming, direct-to-cloud uploads), a "how it works" section, and calls to action
  that point to the dashboard and to sales contact.
- SEO basics: per-locale title and description, canonical URLs, `hreflang` alternates, Open Graph
  tags, `sitemap.xml` and `robots.txt`.
- A single 404 page for unknown paths, with text in both languages.
- New shared package `packages/ui` (`@koalaflow/ui`) holding the brand design tokens as a Tailwind 4
  `@theme` stylesheet. `apps/site` and `apps/app` both import it so they share colors, typography
  scale and radii. Shared React components are not part of it yet.
- `apps/app` switches its `globals.css` to the shared theme. Nothing else in the dashboard changes.
- `CLAUDE.md` and `openspec/config.yaml` are updated to list `apps/site` and `packages/ui`.

## Capabilities

### New Capabilities
- `marketing-site`: the public, localized marketing website: pages, locale routing, SEO metadata,
  crawler files, 404 handling and calls to action into the product.

### Modified Capabilities
<!-- None: no existing specs. -->

## Impact

- **Bounded contexts**: none. The site is a presentation-only frontend. It has no domain logic,
  does not call `apps/api`, and touches no domain events or data.
- **Code**: new `apps/site`, new `packages/ui`, a one-line theme import in
  `apps/app/src/app/globals.css`, and doc updates in `CLAUDE.md` and `openspec/config.yaml`.
- **Dependencies**: `apps/site` uses the same stack already in `apps/app` (`next`, `react`,
  `tailwindcss`, `@tailwindcss/postcss`). Vitest is added for the site's i18n unit tests.
  No webpack, ESLint or Prettier.
- **CI**: `nx affected` picks up the new projects automatically. If Vitest pulls in a dependency
  with an install script (for example `esbuild`), it is added to `allowBuilds`.

## Out of Scope

- Hosting and deployment: Terraform baseline (provider, state backend), S3 bucket, CloudFront
  distribution, DNS and TLS. These go in a separate change. This change only produces the static
  `out/` directory.
- Pricing page and plan data (billing context not defined yet).
- Terms of service and privacy policy content (they need legal review).
- Blog, docs, customer cases and any CMS.
- Contact or lead-capture forms (a static export has no server actions; this needs a backend or
  third-party decision).
- Analytics and cookie consent.
- Automatic locale detection or redirect based on `Accept-Language`.
- Shared React components in `packages/ui` (added when both apps actually need the same component).
- Any visual redesign of the dashboard beyond adopting the shared tokens.
