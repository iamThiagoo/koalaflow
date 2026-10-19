# Tasks

## 1. Content and SEO without locales

- [x] 1.1 Move `src/i18n/dictionaries/pt-BR.ts` to `src/content/home.ts` (export `home` and `type HomeContent`, drop `header.languageLabel`), and replace `dictionaries.test.ts` with `src/content/content.test.ts` (no empty texts, no parity test); verify `pnpm nx test @koalaflow/site` passes
- [x] 1.2 Add `src/seo.ts` with `buildHomeMetadata(siteUrl)` and `buildSitemap(siteUrl)` as described in design.md, and replace `metadata.test.ts` and `sitemap.test.ts` with `src/seo.test.ts` (canonical and `pt_BR` on default and custom origin; no `alternates.languages` and no `alternateLocale`; a single `/` sitemap entry with no alternates); verify `pnpm nx test @koalaflow/site` passes

## 2. Routes and components

- [x] 2.1 Replace the `(pt-BR)` and `(en)` route groups with `src/app/layout.tsx` (`lang="pt-BR"`) and `src/app/page.tsx` (uses `buildHomeMetadata` and renders the sections, replacing `src/views/home-page.tsx`); point `sitemap.ts` at `buildSitemap`; verify `pnpm nx build @koalaflow/site` emits `out/index.html` with `lang="pt-BR"` and no `out/en/` directory
- [x] 2.2 Replace `global-not-found.tsx` with `src/app/not-found.tsx` (Portuguese message and a link to `/`), remove `experimental.globalNotFound` and update the rule comment in `next.config.ts`; verify the export contains `out/404.html` with Portuguese text and `noindex`
- [x] 2.3 Delete `language-switcher.tsx`, remove the switcher and `locale` prop from `site-header.tsx`, switch every component to `HomeContent`, and delete `src/i18n/` and `src/views/`; verify `grep -rn "i18n\|locale\|Dictionary\|hreflang" apps/site/src` finds only `pt_BR`/`pt-BR` and `pnpm nx typecheck @koalaflow/site` passes

## 3. Documentation

- [x] 3.1 Update `CLAUDE.md` (the `apps/site` row says pt-BR only at `/`), `openspec/config.yaml` (the `apps/site` context line), and the Purpose of `openspec/specs/marketing-site/spec.md` so it no longer mentions English; verify `pnpm exec openspec validate --all --strict --no-interactive` passes

## 4. Verification

- [x] 4.1 Serve `apps/site/out` with a static server that honors `404.html` and check the spec scenarios: `/` returns 200 in pt-BR with canonical and `og:locale` `pt_BR` and no `hreflang` links; `/en/`, `/es/` and `/does-not-exist/` return the Portuguese 404 with `noindex`; `sitemap.xml` has a single `/` entry without alternates; with scripts stripped, all content and CTAs are still present
- [x] 4.2 Run `pnpm check` and `pnpm nx affected -t typecheck build test` and fix any failures until both pass
