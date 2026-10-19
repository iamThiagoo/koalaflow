# Proposal

## Why

The target market is Brazil. Maintaining an English version doubles copy work and keeps an i18n
layer (two root layouts, typed dictionaries, an experimental `globalNotFound` flag) that the site
does not need. Since `/en/` was never deployed, it can be removed now at no cost to existing links
or search rankings.

## What Changes

- **BREAKING** (unpublished): the English home page at `/en/` is removed. Only the Brazilian
  Portuguese site at `/` remains.
- The language switcher is removed from the header.
- `hreflang` alternates (including `x-default`) and the Open Graph alternate locale are removed from
  page metadata. The sitemap lists pages without language alternates.
- The not-found page is in Portuguese only and links back to `/`.
- The i18n code in `apps/site` is removed: one root layout (`app/layout.tsx`, `lang="pt-BR"`), the
  standard `app/not-found.tsx` replaces `global-not-found.tsx` (the experimental `globalNotFound`
  flag is dropped), and texts move to a single Portuguese content file.
- `CLAUDE.md`, `openspec/config.yaml` and the `marketing-site` spec Purpose stop mentioning English.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `marketing-site`: the localized home page and the language switcher are removed. A Portuguese-only
  home page requirement is added. Metadata, crawler files, the not-found page and static output no
  longer include English or language alternates. Calls to action no longer mention languages.

## Impact

- **Bounded contexts**: none. The change is limited to the presentation-only marketing site.
- **Code**: `apps/site` only (routes, components, content, SEO helpers, tests, `next.config.ts`).
  `packages/ui` and `apps/app` are unchanged.
- **Dependencies**: none added or removed.
- **URLs**: `/en/` now returns the not-found page. No redirect is needed because it was never public.

## Out of Scope

- Adding any other language, or keeping dormant i18n code for one. Adding a language later is a new
  change.
- Redirecting `/en/` to `/`.
- Content or visual changes to the Portuguese page beyond removing the switcher.
- Hosting and deployment (still a separate change).
