# Design

## Context

- `apps/site` is a Next 16 static export with `images.unoptimized: true`. Sections are Server
  Components. Interactivity is limited to a few client components (`HeadlineChip`, `MobileHeader`,
  `ScrollReveal`).
- All visible copy lives in `src/content/home.ts`. `content.test.ts` checks that no text is empty.
- Scroll entrances use `data-reveal` (`left` / `right` / `scale`) plus `revealDelay()`. Content is
  hidden only after the observer is ready, so the page is complete without JavaScript, and reduced
  motion skips the observer entirely.
- `FinalInvitation` already lays out illustrations against the 1440px Figma frame by scaling with
  container units (`--u: min(1px, 100cqw / 1440)`).
- The tests run in Vitest with `environment: 'node'`. There is no DOM test setup and no e2e project
  for the site.
- Approved visuals are in the project Figma file `vVRqPEAfCAMqiwIT22ZecQ`, on the page
  "Koalaflow · Landing / Proteção":
  - Desktop section component `80:380`
  - Mobile section component `80:405`
  - `Koalaflow/benefit-card` variant set `80:433`, with Layout=Vertical and Layout=Horizontal
  - The source images, in the "Assets" row
- The landing frames (Desktop `17:2478`, Mobile `17:2687`) use instances of these components. The
  previous section is kept hidden as "Product protection (old, hidden)".
- Requirements are in `specs/marketing-site/spec.md`.

## Goals / Non-Goals

**Goals:**
- The demo's rules (outcome, countdown, expiry boundary, restart) live in plain functions that can
  be unit-tested, separate from React.
- The page stays complete and usable with JavaScript disabled.
- The illustrations scale the same way as the final invitation's.

**Non-Goals:**
- A DOM or browser test setup for the site. This change does not add jsdom, Testing Library or
  Playwright.
- Reusing the demo anywhere else, such as in the dashboard.

## Domain Model

None. No aggregates or domain events are involved. The demo imitates the playback rules
(domain-restricted embed and signed URL expiry) for marketing purposes only. It does not import
from, or stand in for, the future `playback` context.

## Decisions

### 1. Disclosure with `<details>`, not a modal `<dialog>`

The call to action is the `<summary>` of a `<details>` element, styled as the primary pill. The
demo renders inside it, below the cards.

- **No JavaScript:** `<details>` opens natively and shows the static version, which the server
  renders (spec: "Visitor has JavaScript disabled").
- **Keyboard:** toggling and focus come from the browser. Closing leaves focus on the summary,
  which is the call to action.
- **Hydration:** once the client component mounts, the interactive demo replaces the static
  version. A mount flag ensures the server and the first client render produce the same output.

*Alternative:* a modal `<dialog>` opened through invoker commands (`commandfor`). It gives a more
focused experience, but opening it without JavaScript depends on newer browser support, and it
needs a focus trap and restore. Rejected for now. If the inline expansion feels too long, we can
reconsider it without changing the spec.

### 2. Pure demo logic in `src/theft-demo.ts`

This module owns:

- **`linkLifetimeMinutes = 5`:** the single source for the headline and the countdown (spec: "One
  link lifetime"). The `protection` content in `home.ts` builds the claim from it, including the
  singular "1 minuto".
- **`remainingMs(issuedAt, now, lifetimeMs)`:** clamped at 0.
- **`formatCountdown(ms)`:** returns `mm:ss`. It rounds up to whole seconds, so a fresh link shows
  `05:00` and only `0` shows `00:00`.
- **`playbackOutcome({ host, authorizedHost, remainingMs })`:** returns `'plays'`,
  `'blocked-domain'` or `'expired'`.
  - The domain is checked first, matching the real flow, where the embed refuses to load before
    the CDN ever checks the URL.
  - `remainingMs === 0` counts as expired.
- **A reducer over `{ scene, issuedAt, skippedMs, linkId }`:**
  - Actions: `paste-elsewhere`, `open-authorized`, `skip-to-expiry`, `restart`.
  - The caller passes the current time in, so tests are deterministic.

The component only keeps a one-second `now` tick and renders the reducer state. It writes nothing to
the clipboard, makes no network calls, and uses only timers.

### 3. Fictitious domains

- **Authorized site:** `alunos.minhaescola.com`, which the hero already uses.
- **Unauthorized site:** a `.example` host (for example, `cursinho-pirata.example`), so the demo
  never names a real website.
- **The "signed link":** a fake CloudFront-style URL with `Expires` and `Signature` values derived
  from `linkId`. It is visual only.

### 4. Assets as transparent WebP

- **Source:** the six images generated in Figma (koala, hand, four icons).
- **Processing:** each is converted once, outside the repo, to WebP with alpha:
  - The background is made transparent by a flood fill from the edges, which keeps interior
    whites such as the play triangle.
  - Then `cwebp` encodes the result.
- **Sizing:** each image is sized for 2x of its largest rendered CSS size.
- **No new dependency:** the conversion is not part of the build, and no image tooling is added.

*Alternative:* ship the white-background PNGs with `mix-blend-mode: multiply`. That works for the
two illustrations on the white section. However, the icons' light grey studio background leaves
visible squares on the white cards (seen in the Figma mockup), and PNG files would be 5–10× larger.
Multiply stays as the fallback for the illustrations only.

### 5. Layout and motion

- **Desktop:** reuses the `--u` container-unit composition from `FinalInvitation` against the
  1440px frame. The hand is revealed with `left` and the koala with `right`. The cards use
  `revealDelay(index)` as they do today.
- **Mobile:** follows Figma `80:405`. Below `md`, the illustrations are cropped at the screen
  edges, and the cards stack as horizontal rows: a 72px icon next to left-aligned text.
- **Reduced motion:** scene changes inside the demo use a CSS transition that is disabled under
  `prefers-reduced-motion`.

### 6. The section replaces `ProductProtection` in place

- The section keeps the `id="produto"` anchor and the `protection` key in `home.ts`, so the header
  link and the page order do not change.
- The old card icons (`icon-shield`, `icon-play`, `icon-upload`) are deleted if a search finds no
  other use.

## Test Strategy

**Unit tests (Vitest), `src/theft-demo.test.ts`:**
- **Outcome rules:** each case below gets its own test.

  | Domain | Link | Result |
  |---|---|---|
  | Authorized | Valid | Plays |
  | Unauthorized | Valid | Blocked domain |
  | Authorized | Expired | Expired |
  | Unauthorized | Expired | Blocked domain (precedence) |
  | Authorized | Exactly at the lifetime boundary | Expired |
- **Countdown:** fresh link shows `05:00`; 65 s elapsed shows `03:55`; never below `00:00`.
  Sub-second remainders round up.
- **Reducer:**
  - Skipping to expiry marks the link expired.
  - Restarting issues a new `linkId` and the full lifetime.
  - Pasting elsewhere moves to the unauthorized scene.

**Unit tests, content:**
- The headline claim follows `linkLifetimeMinutes`, including singular and plural.
- The existing no-empty-text test covers the new copy.

**E2E:** none. The site has no e2e project. The demo is a client-only simulation with no
integration point that could fail. Adding a browser test runner for one widget does not fit the
testing policy. The behaviors that need a browser are checked by hand in the verification task:
JavaScript disabled, keyboard, reduced motion, a 360px viewport and the screen reader live region.

## Risks / Trade-offs

- **The "5 minutos" copy becomes a product commitment.** → The proposal records it. The playback
  change must use a TTL of 5 minutes or less, or update `linkLifetimeMinutes`.
- **The static version could flash before the interactive one.** → Most visitors never open the
  demo, and the demo renders only inside the open `<details>`. If needed, the static version can be
  hidden while `<details>` is closed.
- **The page now shows two different koala drawings (this section and the final invitation).** →
  Both use the same engraving style, and they look consistent in the Figma landing. Revisit only if
  the repetition feels heavy in the browser.
- **An inline demo makes the section taller when open.** → It opens only when the visitor asks for
  it. If it feels heavy, Decision 1 lists the dialog alternative.
- **Flood-fill transparency can eat light edges of the illustration.** → Check each exported image
  on both white and colored backgrounds before committing.

## Migration Plan

This is a content and presentation change on a static site. It ships with the normal site deploy.
Rollback is a revert of the commit and a redeploy.

## Open Questions

- The exact demo copy for each scene (button labels, explanations). It can be tuned during
  implementation without changing behavior.
