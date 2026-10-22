# Design

## Context

`apps/site` is a Next 16 static export (see the `marketing-site` spec, "Static delivery without a
runtime server"). The home page (`src/app/page.tsx`) renders Hero, ProductProtection
(`#produto`), HowItWorks (`#como-funciona`), Faq, FinalInvitation and the footer. All visible copy
lives in `src/content/home.ts`, and a content test rejects empty or non-string leaves. Logic with
rules lives in small modules with Vitest tests (`theft-demo.ts`, `motion.ts`, `links.ts`), and
components stay thin. The header is fixed, and `<html>` sets `scroll-padding-top` per breakpoint,
so in-page anchors already land below it.

## Goals / Non-Goals

**Goals:**
- Match the Figma pricing section (`116:1099`, `116:1191`) with the site's tokens, text styles
  and motion rules.
- Keep the pricing math in one tested module. Components only render its results.

**Non-Goals:**
- A shared pricing source with a future billing context or `apps/app`. Prices stay in `apps/site`
  until billing exists.
- Animated number count-ups. The total updates instantly as the sliders move.

## Decisions

### 1. A pricing module owns every number
`src/pricing.ts` holds the published prices, the free allowance, the minutes per student, the hours
per course and the slider ranges. It exports pure functions:
- `estimate(minutes, hours)` returns the delivery, storage and allowance lines, the total, the
  student count and the cost per student.
- `valueAt(position, range)` and `positionOf(value, range)` map slider positions to values.
- `stepOf(value, range)` and `stepTo(position, current, range)` handle the native input's whole
  steps (Decision 3).
- `snap(value)` rounds a value to two significant figures.
- `formatBrl`, `formatCompact`, `fill` and `fillCount` format the numbers for display.

Money is computed per line and rounded to whole reais with `Math.round`. The total is the sum of
the rounded lines, so the breakdown always adds up (spec: "Monthly estimate"). The cost per student
divides that total and keeps cents.

- *Alternative:* keep prices in `home.ts` with the copy. Rejected: the content test only allows
  strings there, and numbers that drive math belong next to the math and its tests.

### 2. Copy with count placeholders stays in `home.ts`
Hints and labels that contain numbers are plain strings with placeholders, such as
`'≈ {count} alunos assistindo {hours} h por mês'`, with a separate singular form. `fillCount`
fills them from the pricing module. This keeps the rule that all visible copy lives in `home.ts`,
and it keeps the "8 h" in the hint tied to the minutes-per-student setting (spec: "One source for
published prices").

### 3. Native range inputs under custom visuals
Each slider is an `<input type="range">` with whole positions 0 to 100, mapped to values on a log10
scale.
- **The input:** it stretches across the track and is transparent. Its native thumb is sized to
  the 56px mascot, so the input and the drawing share the same travel from end to end.
- **The drawing:** the track, fill, mascot thumb and tooltip follow a `--p` CSS variable.
- **What the native input gives for free:** drag, touch, arrow keys, Home/End, the `<label>` and
  `aria-valuetext` (for example "200 horas guardadas").
- **Keyboard step:** one arrow step moves about 7% of the value (three decades in 100 steps).

Two details come from snapping values to two significant figures:
- **Neighboring positions can share a value** (positions 70 and 71 are both 130,000 minutes).
  `stepTo` keeps stepping in the same direction until the value changes, so every arrow press
  moves.
- **The input only holds whole positions.** It receives `stepOf(value)`, and `stepTo` measures the
  direction from that whole position. Otherwise the `change` event that follows `input` reads the
  rounded position as a step back.

- *Alternative:* a custom `role="slider"` div with pointer events. Rejected: more code to get
  keyboard, touch and assistive technology right, for no visual gain.

### 4. Server-rendered default, sliders enabled on mount
The calculator is a client component, but the static HTML already contains the default estimate
(120,000 minutes, 200 hours, R$ 715). The inputs render `disabled` and turn on in a mount effect.
Without JavaScript the visitor sees the default estimate and disabled sliders instead of controls
that do nothing (spec: "Pricing calculator without JavaScript"). The total sits in an
`<output aria-live="polite">`.

### 5. Mascot thumbs are two small dedicated images
The koala and play-button thumbs are circular crops of the existing art. They are exported once as
112px images (2x for the 56px thumb) into `public/landing/` (`thumb-koala.png`, `thumb-play.png`),
instead of cropping the 1264px `koala.png` with CSS on every load.

### 6. Anchor and token
- **Anchor:** the section gets `#precos`, and the footer "Preços" item gets `to: '#precos'`. The
  existing `scroll-padding-top` keeps the heading clear of the fixed header.
- **Token:** the slider's empty track uses `surface-muted`. That token exists as a Figma variable
  but was missing from `packages/ui/src/theme.css`, so it is added there.

### 7. Motion follows the existing rules
The heading and the calculator use `data-reveal` (opacity and transform only). The thumb follows
the cursor with no transition while dragging. With `prefers-reduced-motion`, the reveal already
turns off.

## Risks / Trade-offs

- [The example prices become a public offer] → The user decided to publish them. All prices sit
  in `src/pricing.ts`, and the proposal records the commitment for the billing context. Unit tests
  pin the prices the page shows.
- [Floating-point drift in money math (for example 119000 × 0.005)] → Each line is rounded to whole
  reais and the total sums the rounded lines (verified by unit tests at the default, minimum and
  maximum values).
- [A log slider with 100 steps cannot hit every exact value] → Values snap to two significant
  figures anyway, so every reachable value is a round number (verified by `snap`/`valueAt` tests).
- [Snapping makes some keyboard steps land on the same value] → `stepTo` skips to the next
  distinct value (verified by `stepTo`/`stepOf` tests and a browser check with arrow keys).
- [Each slider step announces the total through `aria-live`] → Polite announcements queue behind
  the slider's own value. This is accepted, because keyboard steps are discrete and infrequent.

## Test strategy

- **Unit (Vitest), `pricing.test.ts`:**
  - the default estimate (R$ 595 + R$ 120 = R$ 715, 250 students, R$ 2,86);
  - minutes below the allowance;
  - both sliders at their maximum (R$ 10.995);
  - the student floor and the one-student minimum;
  - `snap` (123,456 → 120,000);
  - `valueAt`/`positionOf` round trips and clamping at both ends;
  - `stepTo`/`stepOf`: skip repeated values, ignore a repeated event, stop at the ends;
  - hint pluralization ("1 curso").
- **Unit, `content.test.ts`:** the footer "Preços" item targets `#precos`.
- **E2E:** none. The site has no E2E suite, and the risky parts are pure functions covered above.
  Check in a browser at 1440 and 390px wide: dragging, the keyboard (arrows and Home/End),
  JavaScript disabled, and that the page does not scroll horizontally.
