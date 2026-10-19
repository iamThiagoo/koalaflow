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
