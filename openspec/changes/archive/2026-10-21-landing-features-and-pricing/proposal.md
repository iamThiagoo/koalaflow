# Proposal

## Why

The home page never says what Koalaflow costs, which is the first question a course creator asks.
An interactive pricing section designed in the project Figma file
([Koala.flow](https://www.figma.com/design/vVRqPEAfCAMqiwIT22ZecQ), page "Koalaflow · Landing")
answers it:

- `Preços` in the `Desktop` and `Mobile` landing frames (`116:1099`, `116:1191`)
- Components in the section "Landing · Preços · componentes" (`111:658`):
  `Koalaflow/usage-slider` (`115:1140`) and `Koalaflow/price-estimate` (`115:1141`)

A features section ("Recursos") was also designed and built in this change, then removed at the
user's request before archive. Its frames stay in the components section, marked as removed.

## What Changes

- Add an interactive pricing section ("**Quanto custa?** Arraste e descubra.") between
  "Como funciona" and the FAQ:
  - Two sliders on a logarithmic scale: minutes watched per month (1 thousand to 1 million),
    with the koala as the thumb, and hours of video stored (10 to 10 thousand), with the play
    button as the thumb.
  - A live estimate with the monthly total, the cost per student, a breakdown (delivery,
    storage, free allowance) and what every account includes, plus the primary call to action
    and a sales link.
  - Playful hints that translate the numbers ("≈ 250 alunos assistindo 8 h por mês",
    "≈ 25 cursos de 8 horas").
- Publish example prices, as the user decided: R$ 0,005 per minute watched, R$ 0,60 per stored
  hour per month, and the first 1,000 minutes free every month. All prices and limits live in
  one pricing module, so changing them is a one-file edit.
- Give the section the anchor `#precos` and link the footer "Preços" item to it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `marketing-site`: adds requirements for the pricing calculator (slider ranges, the estimate
  formula, keyboard and no-JavaScript behavior, and one source for published prices).

## Impact

- **Bounded contexts:** none. The site is presentation only. The calculator runs in the browser
  and calls no API. It does not touch the future billing context.
- **Code:** `apps/site`, plus one token in `packages/ui`:
  - in `apps/site`: the pricing section and slider components, a pricing module with its tests,
    copy in `src/content/home.ts`, the section order in `src/app/page.tsx`, and the footer
    "Preços" link;
  - in `packages/ui`: the `surface-muted` color token, which mirrors the Figma variable of the
    same name.
- **Dependencies:** none added.
- **Product commitment:** the published prices become a public offer. The future billing context
  must charge these prices or less, or this page must change first.
- **Security:** none. The section is static content plus a client-side calculation over two
  bounded slider values. There is no request, no input sent anywhere, no personal data and no
  new dependency.

## Out of Scope

- The billing context, real metering, invoices and checkout.
- Plans, tiers, annual discounts, taxes and currencies other than BRL.
- A features section. It was removed from this change.
- Dark mode, analytics events and A/B tests for the new section.
