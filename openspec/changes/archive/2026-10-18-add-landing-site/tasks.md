# Tasks

## 1. Shared theme package

- [x] 1.1 Create `packages/ui` with `package.json` (`@koalaflow/ui`, private, `type: module`, `exports["./theme.css"]` with `style` and `default` conditions) and `src/theme.css` defining the placeholder brand tokens in a Tailwind 4 `@theme` block (`--color-brand-*`, `--color-ink-*`, `--font-sans` with the `--font-brand` fallback stack, `--radius-*`); verify `pnpm nx show projects` lists `@koalaflow/ui`
- [x] 1.2 Add `"@koalaflow/ui": "workspace:*"` to `apps/app`, import `@koalaflow/ui/theme.css` in `apps/app/src/app/globals.css`, and load the brand font with `next/font/google` (`variable: '--font-brand'`) in `apps/app/src/app/layout.tsx`; verify `pnpm nx build @koalaflow/app` passes and `pnpm nx graph --file=stdout` (or `nx show project @koalaflow/app --json`) shows the dependency on `@koalaflow/ui`

## 2. Site scaffolding

- [x] 2.1 Create `apps/site` by hand, mirroring `apps/app` (no generator, so no webpack, ESLint or Prettier): `package.json` (`@koalaflow/site`, scripts `dev` on port 3002, `build`, `typecheck`, `test`; `nx.targets` with `build.outputs` `{projectRoot}/out` and `{projectRoot}/.next` minus the cache, `build.inputs` including `env` inputs `SITE_URL`, `APP_URL`, `SALES_CONTACT_URL`), `tsconfig.json`, `postcss.config.mjs`, and `next.config.ts` with `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`, `experimental.globalNotFound: true`; add `out` to `.gitignore` if it is not already ignored; verify `pnpm install` succeeds and `pnpm nx show project @koalaflow/site` lists `dev`, `build`, `typecheck`, `test`
- [x] 2.2 Add `vitest` as a dev dependency of `apps/site` with a node-environment `vitest.config.ts`; add any install-script packages it pulls in to `allowBuilds` (`false` unless needed); verify `pnpm install` reports no blocked builds and `pnpm nx test @koalaflow/site` runs, passing with no tests
- [x] 2.3 Add `src/app/globals.css` (Tailwind and the `@koalaflow/ui` theme import) and the two root layouts `(pt-BR)/layout.tsx` (`lang="pt-BR"`) and `(en)/layout.tsx` (`lang="en"`), both loading the brand font, with placeholder pages at `(pt-BR)/page.tsx` and `(en)/en/page.tsx`; verify `pnpm nx build @koalaflow/site` emits `out/index.html` and `out/en/index.html` with the correct `<html lang>`

## 3. Locale routing, configuration and SEO

- [x] 3.1 Implement `src/config.ts` (reads `SITE_URL`, `APP_URL`, `SALES_CONTACT_URL` with the defaults from design.md, validates them with `new URL()`, normalizes trailing slashes) with unit tests for defaults, custom origin, trailing-slash normalization and an invalid URL throwing; verify `pnpm nx test @koalaflow/site` passes
- [x] 3.2 Implement `src/i18n/locales.ts` (supported locales, `pt-BR` default, locale → path, absolute `hreflang` alternates with `x-default`, the "other language" target for the switcher) with the `* Rule:` comment on prefix behavior, plus unit tests for each locale's path, alternates on the configured origin, the switcher target, and rejection of an unsupported locale; verify `pnpm nx test @koalaflow/site` passes
- [x] 3.3 Add the typed dictionaries `src/i18n/dictionaries/pt-BR.ts` (exports `Dictionary`) and `en.ts` (`satisfies Dictionary`) with copy for every home section, metadata and the switcher, plus `get-dictionary.ts`, and a unit test asserting that no leaf string is empty in any locale; verify the test passes and that temporarily removing a key from `en.ts` makes `pnpm nx typecheck @koalaflow/site` fail
- [x] 3.4 Implement `buildMetadata(locale, path)` and use it in both page files (title, description, canonical, `alternates.languages`, Open Graph with `pt_BR` / `en_US`), with a unit test on the returned canonical and alternates for each locale; verify the test passes and `out/index.html` and `out/en/index.html` contain the expected `<link rel="canonical">` and `<link rel="alternate" hreflang>` tags
- [x] 3.5 Add `src/app/sitemap.ts` (both pages with language alternates, no 404) and `src/app/robots.ts` (allow all, absolute sitemap URL); verify `out/sitemap.xml` and `out/robots.txt` match the spec scenarios after `pnpm nx build @koalaflow/site`
- [x] 3.6 Add `src/app/global-not-found.tsx` with bilingual text, links to `/` and `/en/`, and its own `globals.css` import; verify the export contains `out/404.html` with `noindex`; if it does not, replace it with a static `public/404.html` as described in design.md

## 4. Home page content

- [x] 4.1 Build the shared view `src/views/home-page.tsx` and its section components (header with the language switcher, hero, product highlights, how it works, calls to action, footer) using only server components, dictionary text and brand tokens; render it from both page files; verify both pages show every section in their own language with no text from the other locale
- [x] 4.2 Implement the language switcher as plain links (current language shown as non-link text) and the calls to action from `config.ts`; verify in `out/` that `/` links to `/en/` and back, and that the primary CTA uses `APP_URL` (default and an overridden value via `SITE_URL=… APP_URL=… pnpm nx build @koalaflow/site --skip-nx-cache`)

## 5. Documentation

- [x] 5.1 Update `CLAUDE.md` (apps table gains `apps/site`: Next 16 static export, marketing site on the apex domain; note `packages/ui` as the shared design-token package and an exception to the bounded-context layout) and keep `openspec/config.yaml` context in sync; verify `pnpm exec openspec validate --all --strict --no-interactive` passes

## 6. Verification

- [x] 6.1 Serve the export with a static server that honors `404.html` (for example `pnpm dlx serve apps/site/out`) and check the spec scenarios manually: `/`, `/en/`, `/es/` and `/does-not-exist/` return the expected pages, and with JavaScript disabled the content, switcher and CTAs still work
- [x] 6.2 Run `pnpm check` and `pnpm nx affected -t typecheck build test` and fix any failures until both pass
