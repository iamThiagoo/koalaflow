# Tasks

## 1. Pricing logic

- [x] 1.1 Add `src/pricing.ts` with the published prices, the free allowance, minutes per student,
  hours per course and the two slider ranges, plus `estimate`, `snap`, `valueAt`, `positionOf`,
  `stepOf`, `stepTo`, `formatBrl`, `formatCompact`, `fill` and `fillCount` (design Decision 1). Add
  `Rule:` comments for line rounding, the total as the sum of the rounded lines, the one-student
  minimum and the keyboard stepping. Verify that `src/pricing.test.ts` covers:
  - the default estimate: R$ 595 + R$ 120 + R$ 0 = R$ 715, 250 students, R$ 2,86 per student
  - 1,000 minutes and 10 hours: delivery R$ 0, total R$ 6, 2 students, R$ 3,00 per student
  - both sliders at their maximum: R$ 10.995
  - `snap(123456)` gives 120,000, and the ranges clamp below 1,000 and above 1,000,000 minutes
  - `valueAt(positionOf(v))` round trips for 1,000, 120,000 and 1,000,000 minutes and 10, 200 and
    10,000 hours
  - `stepTo` skips positions that snap to the current value, ignores a repeated event at the
    current whole position and stops at the ends
  - a changed allowance (2,000 minutes) moves where delivery starts
  - `formatCompact` gives "120 mil" and "1 mi", and `fillCount` uses the singular for one

  Then verify `pnpm nx test @koalaflow/site` passes.

## 2. Content

- [x] 2.1 Add `home.pricing` to `src/content/home.ts`:
  - the heading and subtitle
  - the slider labels, value texts and tick templates
  - the hint templates, with `{count}`/`{hours}` placeholders and singular forms
  - the estimate labels, the included items, the calls to action and the fine print

  Set the footer "Preços" item to `to: '#precos'`. Verify `src/content/content.test.ts` passes,
  with a new test that the footer "Preços" item targets `#precos`.

## 3. Pricing section

- [x] 3.1 Export the koala and play-button thumbs from Figma as 112px circular crops into
  `apps/site/public/landing/thumb-koala.png` and `thumb-play.png` (design Decision 5). Verify each
  file is 112×112 and shows the koala's face and the play button centered.
- [x] 3.2 Add `src/components/usage-slider.tsx` (design Decisions 3 and 4):
  - a transparent native range input (0–100) with a 56px native thumb, over the decorative track,
    fill, mascot thumb and tooltip, which follow `--p`
  - a `<label>` and `aria-valuetext`
  - rendered `disabled` until mount

  Add the `surface-muted` token to `packages/ui/src/theme.css`. Verify in the browser that:
  - drag works
  - arrows move one value per press (120 → 130 → 140 mil), and Home/End reach the ends
  - the thumb, fill and tooltip follow the value
- [x] 3.3 Add `src/components/pricing.tsx` (`#precos`) and render it between `HowItWorks` and
  `Faq` in `src/app/page.tsx`. It contains:
  - the heading and the two sliders with their hints
  - the estimate panel: the total in `<output aria-live="polite">`, the cost per student, the
    breakdown, the included items, the primary call to action to the app and the sales link
  - the fine print

  Verify in the browser:
  - the default shows R$ 715 and R$ 2,86, and moving either slider updates the total, the
    breakdown and the hints
  - with JavaScript disabled, the default estimate shows and the sliders are disabled
  - the layout matches Figma `116:1099` at 1440px and `116:1191` at 390px

## 4. Features section removal

- [x] 4.1 Remove the features section, which was built in this change and then dropped at the
  user's request:
  - its components, copy and content tests, plus the hero `#inicio` anchor, the secondary
    `ButtonLink` variant and the `success`/`badge-pending` tokens that only it used
  - the spec requirements and design decisions that described it

  Verify that `#recursos` is absent from the built `out/index.html` and that `pnpm nx test
  @koalaflow/site` passes.

## 5. Design sync

- [x] 5.1 In Figma, place `Preços` in the `Desktop` and `Mobile` landing frames between "How it
  works" and "FAQ". Move the removed "Recursos" frames into the components section, marked as
  removed. Verify the frame order with a screenshot of each frame.

## 6. Verification

- [x] 6.1 Run `pnpm check` and `pnpm nx affected -t typecheck build test`, and fix any failure. Then
  confirm the pricing section renders in the built `out/index.html`.
