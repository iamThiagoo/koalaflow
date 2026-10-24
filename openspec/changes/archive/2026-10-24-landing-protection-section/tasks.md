# Tasks

## 1. Assets

- [x] 1.1 Export the koala, hand and four icon images from the project Figma file and convert them
  to WebP with a transparent background. Do this once, outside the repo (design Decision 4), and
  name them:
  - `koala-branch.webp` and `hand-reaching.webp`, at the source's full 1536px width (the largest
    available, about 1.7x of the desktop render)
  - `icon-lock.webp`, `icon-cloud.webp`, `icon-code.webp` and `icon-signal.webp`, at 256px

  Save them in `apps/site/public/landing/`. Verify:
  - On white, where all six render, each file shows no background square.
  - The play triangle and other interior whites stay opaque.
  - On `primary-soft`, the illustrations and the lock are clean. The three off-white icons keep a
    faint opaque contact shadow, which is accepted because they only render on white cards.

## 2. Demo logic

- [x] 2.1 Add `src/theft-demo.ts` with:
  - `linkLifetimeMinutes`
  - `remainingMs`
  - `formatCountdown`
  - `playbackOutcome`
  - the demo reducer (`paste-elsewhere`, `open-authorized`, `skip-to-expiry`, `restart`)

  Add `Rule:` comments for the domain-first precedence and the expiry boundary. Verify that
  `src/theft-demo.test.ts` covers:
  - each outcome-table case, including both precedence and the exact boundary
  - countdown `05:00`, `03:55` after 65 s, clamping at `00:00` and rounding up
  - skip and restart

  Then verify `pnpm nx test @koalaflow/site` passes.

## 3. Content

- [x] 3.1 Rewrite `home.protection` in `src/content/home.ts`:
  - the headline claim, derived from `linkLifetimeMinutes` with singular and plural forms
  - the accent line and subtitle
  - the four card texts and icon keys
  - the call-to-action label and microcopy
  - all demo copy: the scene labels, the fictitious domains, the refusal messages for blocked
    domain and expired link, the static fallback text, the "tentar de novo" label and
    "Começar agora"

  Verify:
  - The existing no-empty-text test passes.
  - A new test asserts that the claim reads "5 minutos." for 5 and "1 minuto." for 1.

## 4. Section and demo UI

- [x] 4.1 Replace `ProductProtection` with the new section, keeping `id="produto"`:
  - The headline and subtitle are centered.
  - The hand and koala illustrations use `--u` container units against the 1440px frame, with
    `data-reveal` left and right, `aria-hidden`, and empty `alt`.
  - The four cards stagger in with `revealDelay`.
  - The mobile layout follows Figma `80:405`.

  Verify in `pnpm nx dev @koalaflow/site`:
  - At 1440px the layout matches Figma `80:380`.
  - At 360px the cards stack, the art is cropped at the edges and there is no horizontal scroll.
  - Clicking "Produto" in the header scrolls to the section.
- [x] 4.2 Add the `TheftDemo` client component inside a `<details>`. The `<summary>` is the primary
  pill call to action.
  - **Static render:** the server output is the static version, and the interactive demo replaces
    it after mount.
  - **Interactive scenes:** the authorized site playing, with the fake signed link and a countdown;
    "copiar e colar em outro site"; "pular 5 minutos"; reopening on the authorized site; a refusal
    message in an `aria-live="polite"` region; "tentar de novo"; and a "Começar agora" link to
    `appUrl`.
  - **Restrictions:** no clipboard API, no `fetch`, and scene transitions are disabled under
    `prefers-reduced-motion`.

  Verify by hand in the dev server:
  - Each outcome scenario in the spec.
  - Keyboard-only use, with focus returning to the summary when the demo closes.
  - With JavaScript disabled, the static version shows both outcomes and no buttons.
  - With reduced motion emulated, there are no transitions and the countdown still ticks.
- [x] 4.3 Delete `icon-shield.svg`, `icon-play.svg` and `icon-upload.svg` from
  `public/landing/` if a search of `apps/site/src` finds no other use. Verify the search returns no
  matches after deletion and the build still succeeds.

## 5. Verification

- [x] 5.1 Run `pnpm nx build @koalaflow/site` and confirm `out/index.html` contains:
  - the `#produto` section with the "5 minutos." claim
  - the static demo version
  - no references to the deleted icons
- [x] 5.2 Run `pnpm check`, then
  `pnpm exec openspec validate landing-protection-section --strict --no-interactive`, then
  `pnpm nx affected -t typecheck build test`. Verify that all three pass.

## Workflow follow-up

- After implementation, sync the Figma landing page with the shipped copy if it changed.
- Archive the change with `/opsx:archive` once review is done.
