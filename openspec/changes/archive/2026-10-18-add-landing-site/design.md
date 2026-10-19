# Design

## Context

- `apps/app` is a Next 16 App Router app with Tailwind 4 (`@tailwindcss/postcss`). Its Nx targets
  come from `package.json` scripts plus an `nx.targets` block, with no `@nx/next`. `apps/site` follows
  the same pattern.
- `packages/` does not exist yet, and `infra/terraform` is empty.
- Next 16 static export (`output: 'export'`) does not support proxy (middleware), redirects,
  rewrites, headers, cookies, server actions or default image optimization. Next's recommended i18n
  pattern (`app/[lang]` plus a proxy redirect) therefore does not work here, because the default
  locale must be served unprefixed at `/`.
- Requirements are in `specs/marketing-site/spec.md`.

## Goals / Non-Goals

**Goals:**
- A static site whose build output can go to any static host without changes.
- Locale routing with Portuguese unprefixed at `/` and English at `/en/`, with no runtime logic.
- Missing translations caught at build time, not in production.
- One source of brand tokens for `apps/site` and `apps/app`.

**Non-Goals:**
- Dark mode.
- A CSS or component library beyond tokens.
- Sharing Next config or layouts between the two apps.
- A generic i18n framework: two locales, typed dictionaries, nothing more.

## Domain Model

None. No aggregates, domain events or bounded contexts are involved. The site is presentation-only
and never calls `apps/api`.

## Decisions

### 1. Separate app `apps/site` instead of a route group in `apps/app`

The dashboard will hold auth middleware and session cookies, and `/embed` will hold strict
per-domain `frame-ancestors` CSP. Putting public marketing routes in the same app means carving
exceptions out of both. A separate app keeps the dashboard's security rules unconditional, keeps
marketing scripts away from the session origin, and deploys independently.

*Alternative:* a `(marketing)` route group in `apps/app`. That is one fewer project, but it couples
deploys and makes middleware and CSP conditional. Rejected.

### 2. Next 16 with static export, not Astro

The stack, Tailwind setup, Nx target pattern and Biome config are identical to `apps/app`, so
there is nothing new to learn or maintain. The export runs Server Components at build time and ships
plain HTML.

*Alternative:* Astro (Vite-based, zero JS by default, strong for content). Worth reconsidering if a
blog or docs section grows. For one localized page it adds a second framework for little gain.

`next.config.ts`:
- `output: 'export'`: the build fails if a page uses request-time features (spec: "A page uses a
  server-only feature").
- `trailingSlash: true`: emits `en/index.html`, which S3-style hosts serve as a directory index
  without rewrite rules.
- `images: { unoptimized: true }`: the default image loader is not supported in export.
- `experimental: { globalNotFound: true }`: see decision 4.

### 3. Locale routing with two route groups, each with its own root layout

```
src/app/
  globals.css
  global-not-found.tsx
  sitemap.ts
  robots.ts
  (pt-BR)/layout.tsx        <html lang="pt-BR">
  (pt-BR)/page.tsx          → /
  (en)/layout.tsx           <html lang="en">
  (en)/en/page.tsx          → /en/
```

Route groups do not affect URLs, and Next supports one root layout per group with no top-level
`layout.tsx`. Each layout sets the right `<html lang>` at build time. Pages are thin wrappers that
pass a `locale` to a shared view (`src/views/home-page.tsx`), so the markup exists once. Views live
in `src/views/`, not `src/pages/`, which Next would treat as the Pages Router.

*Alternatives:*
- `app/[locale]` with `generateStaticParams`: forces a prefix on every locale (`/pt-br/`), so `/`
  would need a client-side or meta-refresh redirect. That is bad for SEO and adds a flash on the
  most important URL.
- A CloudFront function that rewrites `/` to `/pt-br/`: couples routing to hosting and breaks
  `next dev`.

*Trade-off:* switching language crosses root layouts, so it is a full page load. That is acceptable,
and the switcher is a plain `<a>`, which also works without JS.

### 4. 404 through `global-not-found.tsx`

With multiple root layouts there is no single layout from which to build a `not-found.tsx`. Next's
`global-not-found.tsx` covers this case and is emitted as `404.html`. It imports `globals.css`
itself and renders bilingual text, since an unmatched URL has no reliable locale. Next adds
`noindex` to not-found responses.

The flag is experimental. The fallback is a hand-written `public/404.html` using the same CSS.
Task 3.6 checks that the export actually contains `404.html`.

### 5. Typed dictionaries as the translation contract

```
src/i18n/
  locales.ts               locales, defaultLocale, path and alternate helpers
  dictionaries/pt-BR.ts    source of truth; exports `type Dictionary = typeof ptBR`
  dictionaries/en.ts       `export const en = { ... } satisfies Dictionary`
  get-dictionary.ts        locale → dictionary
```

`satisfies Dictionary` turns a missing key or a stray extra key into a type error, which fails
`typecheck` and `next build` (spec: "A translation is missing"). There is no runtime i18n library.

*Alternative:* JSON dictionaries plus `next-intl`. That is a new dependency built around
middleware-based routing, which export cannot use. Rejected.

```ts
/**
 * Rule: pt-BR is the default locale and is served without a path prefix.
 * Rule: every other locale is served under /<locale>/.
 */
```

### 6. Build-time configuration for URLs

`src/config.ts` reads these at build time (server-only, so no `NEXT_PUBLIC_` prefix is needed):

| Variable | Default | Used for |
|---|---|---|
| `SITE_URL` | `https://koalaflow.com` | `metadataBase`, canonical, alternates, sitemap, robots |
| `APP_URL` | `https://app.koalaflow.com` | primary call to action |
| `SALES_CONTACT_URL` | `mailto:sales@koalaflow.com` | secondary call to action |

Values are parsed with `new URL()`. An invalid value throws, which fails the build rather than
publishing broken links. Trailing slashes are normalized. These variables are declared as `env`
inputs on the Nx `build` target so the cache does not reuse a build made for another origin.

### 7. SEO through the Metadata API

A `buildMetadata(locale, path)` helper returns the Next `Metadata` for a page: localized title and
description, `alternates.canonical`, `alternates.languages` (`pt-BR`, `en`, `x-default` → `/`) and
`openGraph` (`pt_BR` / `en_US`). `sitemap.ts` and `robots.ts` are static metadata routes, so they
are emitted as files during export. The sitemap lists the same alternates per entry.

### 8. `packages/ui` holds design tokens only

`@koalaflow/ui` is a source-only package: no build step and no TypeScript in this change.

```
packages/ui/
  package.json     "exports": { "./theme.css": { "style": "./src/theme.css", "default": "./src/theme.css" } }
  src/theme.css    @theme { --color-brand-*, --color-ink-*, --font-sans, --radius-* }
```

Each app's `globals.css`:

```css
@import "tailwindcss";
@import "@koalaflow/ui/theme.css";
```

Both apps declare `"@koalaflow/ui": "workspace:*"`, so the Nx project graph links them and
`nx affected` rebuilds both when the tokens change.

`--font-sans` is `var(--font-brand), ui-sans-serif, system-ui, sans-serif`. Each app loads the brand
font with `next/font/google` (`variable: '--font-brand'`) in its root layouts. Fonts stay in the apps
because `next/font` only runs inside a Next app, and the fallback stack keeps a page readable if the
font is missing.

**Why a package now, and why tokens only:** brand colors and type are the first thing both apps
share. Keeping two copies would drift right away. Components are different: the site's marketing
sections and the dashboard's controls do not overlap yet. A React component package needs a decision
on its build (tsc vs `transpilePackages`), and on Tailwind `@source` scanning so classes inside the
package are generated. That decision is postponed until a component is needed by both apps.
`packages/ui` is a shared frontend package, not a bounded context, so it does not follow the
`domain/application/infrastructure` layout. `CLAUDE.md` records this exception.

*Alternatives:* duplicating tokens per app (they drift), or a full component library now (too
early, and nothing to put in it).

### New dependencies

| Dependency | Where | Why |
|---|---|---|
| `next`, `react`, `react-dom`, `tailwindcss`, `@tailwindcss/postcss`, `@types/*`, `typescript` | `apps/site` | Same versions as `apps/app`. Not new to the workspace. |
| `@koalaflow/ui` (`workspace:*`) | `apps/site`, `apps/app` | Shared tokens. |
| `vitest` | `apps/site` (dev) | Unit tests for i18n and config. This is the project's chosen runner. The SWC plugin is not needed because the site has no decorators. |

If `pnpm install` reports blocked install scripts from Vitest's dependency tree (for example
`esbuild`), add them to `allowBuilds` as `false` unless the build needs them.

### Nx targets (`apps/site/package.json`)

Scripts: `dev` (`next dev --port 3002`), `build` (`next build`), `start` is omitted (a static export
has no server), `typecheck` (`next typegen && tsc --noEmit`), `test` (`vitest run`). The `nx.targets`
block mirrors `apps/app`, with `build.outputs` set to `{projectRoot}/out` and `{projectRoot}/.next`
(excluding the cache), and `build.inputs` extended with the three `env` inputs.

## Test Strategy

**Unit tests (Vitest, node environment):** these cover the rules that decide which URL a visitor or
crawler gets:
- Locale paths: `pt-BR` maps to `/` and `en` to `/en/`; an unsupported locale is rejected.
- Alternates: each locale gets the full `hreflang` set with `x-default` → `/`, as absolute URLs on the
  configured origin.
- Switcher target: each locale's "other language" link and current-language state.
- Config: defaults when variables are unset; a custom `SITE_URL` changes every generated URL;
  trailing slashes are normalized; an invalid URL throws.
- Dictionaries: no leaf string is empty in any locale. Key parity is already enforced by the type
  checker, so it is not tested again.

**No component or E2E tests.** The site has no integration with other services and no
business-critical flow. A browser E2E suite would mostly check static markup. The spec scenarios
about build output (export files, 404 page, JS disabled) are checked once in the verification tasks
against the built `out/` directory.

## Risks / Trade-offs

- [`globalNotFound` is experimental and could change in a Next minor] → Verify `404.html` in the
  export; the fallback is a static `public/404.html`.
- [The static host must serve `404.html` for unknown paths] → This belongs to the hosting change
  (CloudFront custom error response). Locally, a static server checks it.
- [`next/font/google` downloads fonts at build time, so CI needs network] → CI already has network.
  If this becomes a problem, switch to `next/font/local` with the files in `apps/site`.
- [Placeholder copy and brand palette ship in the first version] → Kept in the dictionaries and
  `theme.css`, so updating them touches no structure.
- [Language switching reloads the page] → Accepted. It is rare and keeps routing free of runtime logic.

## Migration Plan

No data or runtime migration. `apps/app` only gains a theme import, which has no visual effect
until its components use the brand tokens. To roll back, revert the change.

## Open Questions

- Final brand palette, logo and font (placeholders: an indigo-like brand scale and Inter).
- Real sales contact address (placeholder `sales@koalaflow.com`).
