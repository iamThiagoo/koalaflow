# Spec Delta

## ADDED Requirements

### Requirement: Protection section after the hero
The home page SHALL show, right after the hero, a protection section under the `#produto` anchor.
The section has three parts. A headline states how long a copied link lasts. Four benefit cards
cover private-by-default videos, resumable large uploads, embedding with one iframe, and adaptive
streaming. A call to action opens the theft demo. The section's illustrations and icons are
decorative.

#### Scenario: Visitor scrolls past the hero
- **WHEN** a visitor scrolls below the hero on `/`
- **THEN** the section's headline reads "5 minutos. É o que dura um link copiado."
- **AND** the four benefit cards follow it
- **AND** the call to action "Tenta roubar esse vídeo" follows the cards

#### Scenario: Visitor uses the header navigation
- **WHEN** a visitor clicks "Produto" in the header
- **THEN** the page scrolls to the protection section

#### Scenario: Screen reader reads the section
- **WHEN** a screen reader user reaches the protection section
- **THEN** the illustrations and card icons are not announced
- **AND** the headline, card texts and call to action are announced in reading order

#### Scenario: Visitor on a narrow phone
- **WHEN** a visitor opens `/` on a 360px-wide viewport
- **THEN** the cards stack vertically
- **AND** the illustrations are cropped at the screen edges
- **AND** the page does not scroll horizontally

### Requirement: One link lifetime for the claim and the demo
The link lifetime stated in the protection headline SHALL be the same value the theft demo uses for
its countdown and expiry. Both SHALL come from one setting, so they cannot disagree.

#### Scenario: Default lifetime
- **WHEN** a visitor reads the headline and then opens the demo
- **THEN** the headline says "5 minutos"
- **AND** the demo countdown starts at 05:00

#### Scenario: Lifetime is changed
- **WHEN** the link lifetime setting is changed to 3 minutes and the site is rebuilt
- **THEN** the headline says "3 minutos"
- **AND** the demo countdown starts at 03:00

### Requirement: Theft demo opens from the protection section
The protection call to action SHALL open the theft demo on the home page, without navigating to
another page. With JavaScript disabled, the visitor SHALL still be able to reach a static version of
the demo. That version explains that a copied link fails outside authorized domains and after it
expires.

#### Scenario: Visitor opens the demo
- **WHEN** a visitor activates "Tenta roubar esse vídeo"
- **THEN** the demo appears on the page
- **AND** it shows a protected video playing on an authorized site, next to its signed link and a running countdown

#### Scenario: Keyboard user opens and closes the demo
- **WHEN** a keyboard user activates the call to action, tabs through the demo controls and then closes the demo
- **THEN** every control can be reached and used with the keyboard
- **AND** focus returns to the call to action

#### Scenario: Visitor has JavaScript disabled
- **WHEN** a visitor with JavaScript disabled activates the call to action
- **THEN** the static version of the demo is shown
- **AND** it states the blocked-domain and expired-link outcomes, with no inert interactive controls

### Requirement: Theft demo countdown
The demo SHALL show the signed link's remaining lifetime as `mm:ss`, counting down once per second
from the configured lifetime. The visitor SHALL be able to skip straight to expiry. The countdown
SHALL never go below `00:00`.

#### Scenario: Countdown runs
- **WHEN** the demo has been open for 65 seconds
- **THEN** a 5-minute link shows `03:55`

#### Scenario: Visitor skips to expiry
- **WHEN** the visitor activates the control to skip the 5 minutes
- **THEN** the countdown shows `00:00`
- **AND** the link is marked as expired

#### Scenario: Countdown reaches zero on its own
- **WHEN** the full lifetime elapses
- **THEN** the countdown stays at `00:00`
- **AND** the link is marked as expired

### Requirement: Theft demo outcomes
The demo SHALL simulate playback of the copied link. It plays only on the authorized domain while
the link is still valid. On any other domain it SHALL refuse with a blocked-domain message. On the
authorized domain after expiry it SHALL refuse with an expired-link message. When both apply, the
blocked-domain message wins.

#### Scenario: Link pasted on an unauthorized site
- **WHEN** the visitor pastes the copied link into the simulated unauthorized site before it expires
- **THEN** the player shows "Esse vídeo não carrega aqui."
- **AND** it explains that the domain is not authorized

#### Scenario: Expired link on the authorized site
- **WHEN** the visitor opens the copied link on the authorized site after it expires
- **THEN** the player refuses to load
- **AND** it explains that the link expired

#### Scenario: Valid link on the authorized site
- **WHEN** the visitor opens the link on the authorized site before it expires
- **THEN** the simulated video plays

#### Scenario: Expired link on an unauthorized site
- **WHEN** the visitor pastes an expired link into the unauthorized site
- **THEN** the blocked-domain message is shown

#### Scenario: Link expires at the exact boundary
- **WHEN** exactly the full lifetime has elapsed
- **THEN** the link counts as expired

### Requirement: Theft demo ending
After the visitor has seen a refusal, the demo SHALL offer to start again with a fresh link and SHALL
link to the configured dashboard URL. Refusal messages SHALL be announced to screen readers when they
appear. The demo SHALL NOT read or write the visitor's clipboard and SHALL NOT make network requests.

#### Scenario: Visitor sees a refusal
- **WHEN** the player refuses the copied link
- **THEN** the refusal message is announced to screen readers
- **AND** a "Começar agora" link to the configured dashboard URL is shown

#### Scenario: Visitor restarts the demo
- **WHEN** the visitor chooses to try again
- **THEN** the demo returns to the authorized site with a new link
- **AND** the countdown starts again from the full lifetime

#### Scenario: Visitor copies the link in the demo
- **WHEN** the visitor activates the demo's copy control
- **THEN** the visitor's clipboard is not changed and no permission prompt appears

#### Scenario: Visitor prefers reduced motion
- **WHEN** a visitor with reduced motion enabled uses the demo
- **THEN** scenes change without animated transitions
- **AND** the countdown text still updates
