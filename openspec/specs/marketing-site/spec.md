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
per page.

#### Scenario: Visitor clicks the primary call to action
- **WHEN** a visitor clicks the primary call to action
- **THEN** the browser navigates to the configured dashboard URL

#### Scenario: Visitor clicks the sales contact call to action
- **WHEN** a visitor clicks the secondary call to action
- **THEN** the browser opens the configured sales contact target

#### Scenario: Dashboard URL is not configured
- **WHEN** the site is built without a dashboard URL setting
- **THEN** the primary call to action points to the production default `https://app.koalaflow.com`

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

### Requirement: Pricing section before the FAQ
The home page SHALL show a pricing section under the `#precos` anchor, right before the FAQ. The
footer's "Preços" link SHALL scroll to it.

#### Scenario: Visitor scrolls toward the FAQ
- **WHEN** a visitor scrolls down to the FAQ on `/`
- **THEN** the pricing section with the heading "Quanto custa? Arraste e descubra." comes right before it

#### Scenario: Visitor uses the footer link
- **WHEN** a visitor activates "Preços" in the footer
- **THEN** the page scrolls to the pricing section

### Requirement: Usage sliders
The pricing section SHALL offer two sliders on a logarithmic scale: minutes watched per month,
from 1,000 to 1,000,000, and hours of video stored, from 10 to 10,000. They SHALL start at
120,000 minutes and 200 hours. Values SHALL snap to two significant figures and never leave
their range.

#### Scenario: Visitor opens the pricing section
- **WHEN** a visitor reaches the pricing section
- **THEN** the minutes slider shows "120 mil min" and the hours slider shows "200 h"

#### Scenario: Visitor drags past the ends
- **WHEN** a visitor drags the minutes slider beyond either end
- **THEN** the value stays at 1,000 or 1,000,000 minutes

#### Scenario: Value snaps to a round number
- **WHEN** a visitor moves the minutes slider to a position worth 123,456 minutes
- **THEN** the value shown is 120,000 minutes

### Requirement: Monthly estimate
The pricing section SHALL show a monthly estimate in reais: delivery for the minutes watched above
the free allowance, plus storage for the hours stored, each line rounded to whole reais. The
total SHALL equal the sum of the lines shown, and SHALL update as the sliders move.

#### Scenario: Default usage
- **WHEN** the sliders are at 120,000 minutes and 200 hours with the published prices
- **THEN** delivery shows R$ 595, storage shows R$ 120, the free allowance shows R$ 0 and the total shows R$ 715 per month

#### Scenario: Usage below the free allowance
- **WHEN** the minutes slider is at 1,000 minutes
- **THEN** delivery shows R$ 0
- **AND** the total equals the storage line

#### Scenario: Maximum usage
- **WHEN** both sliders are at their maximum
- **THEN** the total shows R$ 10.995 per month

### Requirement: Cost per student
The estimate SHALL show the cost per student, assuming each student watches 8 hours (480 minutes)
per month. The student count is the minutes watched divided by 480, rounded down, and never less
than one. The cost per student is the total divided by that count, shown with cents.

#### Scenario: Default usage
- **WHEN** the sliders are at 120,000 minutes and 200 hours
- **THEN** the estimate shows "≈ R$ 2,86 por aluno por mês"

#### Scenario: Fewer minutes than one student watches
- **WHEN** the minutes slider is at 1,000 minutes and the hours slider at 10 hours
- **THEN** the student count is 2 and the estimate shows "≈ R$ 3,00 por aluno por mês"

### Requirement: Playful usage hints
Each slider SHALL show a hint that turns its value into something concrete: the minutes slider
shows how many students watching 8 hours per month it equals, and the hours slider shows how many
8-hour courses it equals. Counts SHALL be whole numbers, never below one, with singular wording
for one.

#### Scenario: Default usage
- **WHEN** the sliders are at 120,000 minutes and 200 hours
- **THEN** the hints read "≈ 250 alunos assistindo 8 h por mês" and "≈ 25 cursos de 8 horas"

#### Scenario: Hours below one course
- **WHEN** the hours slider is at 10 hours
- **THEN** the hint reads "≈ 1 curso de 8 horas"

### Requirement: One source for published prices
The prices per minute and per stored hour, the free allowance and the hours per student SHALL come
from one setting. The breakdown, the estimate and any price shown on the page SHALL use it.

#### Scenario: A price changes
- **WHEN** the price per minute is changed in that setting and the site is rebuilt
- **THEN** the breakdown, the total and the cost per student shown on the page all use the new price

#### Scenario: Free allowance changes
- **WHEN** the free allowance is changed to 2,000 minutes and the site is rebuilt
- **THEN** the breakdown labels the allowance as 2.000 minutes and delivery starts after 2,000 minutes

### Requirement: Accessible pricing calculator
Both sliders SHALL be usable with the keyboard and SHALL expose their current value as text to
assistive technology. The monthly total SHALL be announced politely when it changes. The mascot
thumbs are decorative.

#### Scenario: Keyboard user adjusts a slider
- **WHEN** a keyboard user focuses the minutes slider and presses the right arrow key
- **THEN** the value moves one step up
- **AND** Home and End move it to 1,000 and 1,000,000 minutes

#### Scenario: Screen reader reads a slider
- **WHEN** a screen reader user focuses the hours slider at 200 hours
- **THEN** it announces the slider's label and "200 horas guardadas"

### Requirement: Pricing calculator without JavaScript
With JavaScript disabled, the pricing section SHALL still show the default estimate, its breakdown
and the calls to action, and SHALL NOT present sliders that do not work.

#### Scenario: Visitor has JavaScript disabled
- **WHEN** a visitor with JavaScript disabled reaches the pricing section
- **THEN** the estimate for 120,000 minutes and 200 hours (R$ 715 per month) is shown with its breakdown
- **AND** the sliders are shown disabled at their default values
- **AND** the primary call to action works
