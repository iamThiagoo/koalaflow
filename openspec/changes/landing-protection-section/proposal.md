# Proposal

## Why

The section right after the hero ("Feito para conteúdo que não pode vazar") is a generic grid of
four feature cards, and it does not stick in the visitor's mind. Our core promise is that a copied
link stops working. That promise is concrete and easy to show, so this section should land it with
one big claim, a brand pun (the koala clings to its branch the way the video clings to its domain),
and a demo the visitor can try. The visual direction is approved in the project Figma file
([Koala.flow](https://www.figma.com/design/vVRqPEAfCAMqiwIT22ZecQ)), on the page
"Koalaflow · Landing / Proteção":

- `Landing/Protection · Desktop` (`80:380`)
- `Landing/Protection · Mobile` (`80:405`)
- `Koalaflow/benefit-card` (`80:433`)

The "Koalaflow · Landing" page already uses these sections.

## What Changes

- Replace the current product protection section (`#produto`) on the home page with the new
  "coala agarrado" section:
  - A headline built on one claim: "**5 minutos.** É o que dura um link copiado.", with a short
    subtitle.
  - Two engraving-style illustrations framing the headline: a hand reaching from the left, and a
    koala on the right clinging to a eucalyptus branch while holding the player.
  - Four benefit cards with 3D clay icons and informal copy: private by default, resumable large
    uploads, embed with one iframe, adaptive streaming on weak connections.
  - A call to action, "Tenta roubar esse vídeo →", that opens a demo.
- Add the "tenta roubar" demo: a simulation that runs entirely in the browser. It shows a signed
  video link with a live five-minute countdown. The visitor can paste the link into an unauthorized
  site, or skip ahead until the link expires. Either way, the player refuses to load. The demo ends
  with a link into the dashboard.
- The "5 minutos" in the headline and the demo's link lifetime come from a single value, so the
  two can never disagree.
- The section keeps the `#produto` anchor, so the header's "Produto" navigation link keeps working.
- The current three SVG icons (`icon-shield`, `icon-play`, `icon-upload`) are removed if nothing
  else uses them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `marketing-site`: adds requirements for the protection section (one link-lifetime claim shared
  by the headline and the demo) and for the theft demo (blocked domain, expired link, works
  without JavaScript, reduced motion).

## Impact

- **Bounded contexts:** none. The site is presentation only and never calls `apps/api`. The demo
  is a simulation and does not touch the real playback context.
- **Code:** `apps/site` only. The changes touch `src/components/product-protection.tsx` (replaced),
  a new demo component plus its logic module and tests, `src/content/home.ts` (the `protection`
  copy), and new images in `public/landing/`.
- **Dependencies:** none added.
- **Product commitment:** the public "5 minutos" claim sets the maximum lifetime of signed
  playback URLs. When the playback context is built, its TTL must be 5 minutes or less, or this
  copy must change.

## Out of Scope

- Real signed URLs, CloudFront, or any call to `apps/api` from the demo.
- Writing to the visitor's clipboard. The demo simulates copy and paste.
- Pricing claims. The section uses no price until billing is decided.
- Changes to other home sections (hero, how it works, FAQ, final invitation) or to the header
  navigation.
- Dark mode, analytics events for the demo, and A/B testing.
- Redrawing the koala in the final invitation.
