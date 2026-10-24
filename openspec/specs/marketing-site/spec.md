# marketing-site Specification

## Purpose

The public marketing website presents Koalaflow to prospects in Brazilian Portuguese and sends them
into the product dashboard or to sales contact.

## Requirements

### Requirement: Portuguese home page
The site SHALL serve the home page only in Brazilian Portuguese at `/`, with the document language
`pt-BR`. It SHALL present the hero, product highlights, how it works, calls to action and footer
sections, and SHALL NOT offer any other language version.

#### Scenario: Visitor opens the root URL
- **WHEN** a visitor requests `/`
- **THEN** the home page is returned in Brazilian Portuguese with the document language `pt-BR`

#### Scenario: Visitor whose browser prefers English opens the root URL
- **WHEN** a visitor whose browser prefers English requests `/`
- **THEN** the Portuguese home page is returned without any redirect

#### Scenario: Visitor opens the former English URL
- **WHEN** a visitor requests `/en/`
- **THEN** the not-found page is shown

### Requirement: Calls to action into the product
The home page SHALL link its primary call to action to the dashboard URL and its secondary
call to action to sales contact. Both targets SHALL come from build configuration, not hardcoded
per page or in code. The build SHALL fail when a target is not configured.

#### Scenario: Visitor clicks the primary call to action
- **WHEN** a visitor clicks the primary call to action
- **THEN** the browser navigates to the configured dashboard URL

#### Scenario: Visitor clicks the sales contact call to action
- **WHEN** a visitor clicks the secondary call to action
- **THEN** the browser opens the configured sales contact target

#### Scenario: Dashboard URL is not configured
- **WHEN** the site is built without a dashboard URL setting
- **THEN** the build fails with an error naming the missing setting, and nothing is published

### Requirement: Search engine metadata
Each page SHALL declare a Portuguese title and description, an absolute canonical URL, and Open
Graph title, description, URL and locale `pt_BR`. Pages SHALL NOT declare `hreflang` alternates or
Open Graph alternate locales.

#### Scenario: Crawler reads the Portuguese home page
- **WHEN** a crawler fetches `/`
- **THEN** the page declares canonical `https://koalaflow.com/` and Open Graph locale `pt_BR`, with
  no `hreflang` alternate links and no Open Graph alternate locale

#### Scenario: Crawler reads the English home page
- **WHEN** a crawler fetches the former English URL `/en/`
- **THEN** it receives the not-found page marked `noindex`, with no canonical URL for `/en/`

#### Scenario: Site is built for a non-production origin
- **WHEN** the site is built with a different site URL setting (for example, a staging origin)
- **THEN** canonical and Open Graph URLs use that origin

### Requirement: Crawler files
The site SHALL publish `/sitemap.xml` listing every public page, and `/robots.txt` that allows
crawling and references the sitemap.

#### Scenario: Crawler fetches the sitemap
- **WHEN** a crawler requests `/sitemap.xml`
- **THEN** it receives a single entry for `/`, with no language alternates

#### Scenario: Crawler fetches robots.txt
- **WHEN** a crawler requests `/robots.txt`
- **THEN** it allows all paths and points to the absolute sitemap URL

#### Scenario: The 404 page is not listed
- **WHEN** the sitemap is generated
- **THEN** it does not contain the not-found page

### Requirement: Not-found page
Requests for paths that do not exist SHALL show a not-found page with a short message in Brazilian
Portuguese and a link back to the home page. The page SHALL ask crawlers not to index it.

#### Scenario: Visitor opens an unknown path
- **WHEN** a visitor requests `/does-not-exist/`
- **THEN** the not-found page is shown in Portuguese with a link to `/`

#### Scenario: Visitor opens an unsupported locale prefix
- **WHEN** a visitor requests `/en/` or `/es/`
- **THEN** the not-found page is shown instead of the home page

#### Scenario: Crawler reaches the not-found page
- **WHEN** a crawler fetches an unknown path
- **THEN** the page declares `noindex`

### Requirement: Static delivery without a runtime server
The site SHALL be produced as static files only (HTML, CSS, JS, images and crawler files) that any
static file host can serve. It SHALL NOT need a server, cookies or per-request logic to render any page.

#### Scenario: Site is built
- **WHEN** the site build runs
- **THEN** it outputs a directory with `index.html`, `404.html`, `sitemap.xml` and `robots.txt`, and
  no `en/` directory

#### Scenario: A page uses a server-only feature
- **WHEN** a page is changed to depend on per-request data such as cookies or request headers
- **THEN** the site build fails

#### Scenario: Visitor has JavaScript disabled
- **WHEN** a visitor with JavaScript disabled opens any page
- **THEN** all content and the calls to action are still visible and usable

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
