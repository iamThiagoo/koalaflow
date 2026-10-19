# Design

## Context

`apps/site` currently serves two locales through two route groups, each with its own root layout:
`(pt-BR)` at `/` and `(en)` at `/en/`. Texts live in typed dictionaries (`src/i18n/dictionaries`),
URLs come from `src/i18n/locales.ts`, and because there is no single root layout the 404 page uses
the experimental `global-not-found.tsx`. See proposal.md for why English is removed, and
`specs/marketing-site/spec.md` for the resulting requirements.

## Goals / Non-Goals

**Goals:**
- One route tree with a single root layout and a standard `not-found.tsx`.
- No locale concept left in the code: no locale types, path helpers or alternates.
- Keep the copy separated from the markup, in one content file.
- Keep the existing look; only the language switcher disappears.

**Non-Goals:**
- An abstraction that keeps English easy to add back.
- Renaming or restructuring components beyond what removing locales requires.

## Domain Model

None. No aggregates, domain events or bounded contexts are involved.

## Decisions

### 1. Single root layout and standard not-found

```
src/app/
  layout.tsx       <html lang="pt-BR">, brand font, body classes
  page.tsx         home page: metadata + sections (replaces views/home-page.tsx)
  not-found.tsx    Portuguese 404 with a link to /
  globals.css
  sitemap.ts
  robots.ts
```

With one root layout, Next renders `app/not-found.tsx` inside it and the static export emits
`404.html`. This removes `experimental.globalNotFound` from `next.config.ts`, and with it the risk
of depending on an experimental flag. Next already adds `noindex` to the not-found response.

*Alternative:* keep `global-not-found.tsx`. It still works, but it duplicates the `<html>` shell and
depends on an experimental flag for no remaining reason. Rejected.

The `src/views/` folder is removed: with a single page there is no shared view to reuse.

### 2. Copy in one content file

`src/i18n/dictionaries/pt-BR.ts` moves to `src/content/home.ts` and exports `home` plus
`type HomeContent = typeof home`. The texts themselves do not change, except that
`header.languageLabel` is removed. `en.ts`, `get-dictionary.ts` and `locales.ts` are deleted.
Components take their section from `HomeContent` (for example `HomeContent['hero']`) instead of
`Dictionary`.

*Alternative:* inline the strings in the components. That mixes copy with markup and makes
copy-only edits riskier. Rejected.

### 3. SEO helpers without locales

`src/seo.ts` holds two pure functions, unit-tested and used by the route files:
- `buildHomeMetadata(siteUrl)`: `metadataBase`, title, description, `alternates.canonical`
  (`${siteUrl}/`), and Open Graph with `locale: 'pt_BR'` and no `alternateLocale`. No
  `alternates.languages`.
- `buildSitemap(siteUrl)`: one entry per public path (`['/']`), with no `alternates`.

Routes keep the trailing slash (`trailingSlash: true` stays), so future pages are emitted as
`<path>/index.html`. The `next.config.ts` rule comment is updated so it no longer refers to
`en/index.html`.

### 4. Components

- `language-switcher.tsx` is deleted. `site-header.tsx` keeps the logo (linking to `/`) and the
  sign-in link, and no longer takes a `locale`.
- The other section components only change their content type import.

### New dependencies

None.

## Test Strategy

Unit tests (Vitest) after the change:
- `config.test.ts`: unchanged.
- `seo.test.ts` (replaces `metadata.test.ts` and `sitemap.test.ts`): canonical and Open Graph
  `pt_BR` on the default and a custom origin. No `alternates.languages` and no `alternateLocale`.
  The sitemap has a single `/` entry, with no alternates and no not-found page.
- `content.test.ts` (replaces `dictionaries.test.ts`): no empty text in the content file. The
  list-length parity test is removed because there is no second language left to compare.
- `locales.test.ts` is deleted together with `locales.ts`.

No E2E tests, for the same reasons as before: static markup with no service integration. The
build-output scenarios (`/en/` and `/es/` return 404, no `en/` directory, no `hreflang`, page works
without JS) are checked once against `out/` in the verification tasks.

## Risks / Trade-offs

- [Adding English back later means rebuilding the i18n layer] → Accepted. The archived
  `add-landing-site` change documents the previous approach (route groups, typed dictionaries)
  and can be reused.
- [`app/not-found.tsx` might not be emitted as `404.html` in export] → Checked in the tasks. The
  default `_not-found` route already produced `404.html` before `global-not-found` was added.

## Migration Plan

No deployment exists yet, so there is nothing to redirect or migrate. To roll back, revert the
change.
