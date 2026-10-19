# Spec Delta

## Purpose

The public marketing website presents Koalaflow to prospects in Brazilian Portuguese and English
and sends them into the product dashboard or to sales contact.

## ADDED Requirements

### Requirement: Localized home page
The site SHALL serve the home page in Brazilian Portuguese at `/` and in English at `/en/`. Each
version SHALL present the same sections (hero, product highlights, how it works, calls to action,
footer), and all visible text SHALL be in that page's language.

#### Scenario: Visitor opens the root URL
- **WHEN** a visitor requests `/`
- **THEN** the home page is returned in Brazilian Portuguese with the document language `pt-BR`

#### Scenario: Visitor opens the English URL
- **WHEN** a visitor requests `/en/`
- **THEN** the home page is returned in English with the document language `en`

#### Scenario: Visitor uses a Portuguese browser on the English URL
- **WHEN** a visitor whose browser prefers Portuguese requests `/en/`
- **THEN** the English page is returned without any redirect

#### Scenario: A translation is missing
- **WHEN** a text exists in one language but not in the other
- **THEN** the site build fails instead of publishing a page with missing or mixed-language text

### Requirement: Language switcher
Every page SHALL offer a control that links to the same page in the other supported language.

#### Scenario: Switching from Portuguese to English
- **WHEN** a visitor on `/` selects English
- **THEN** the visitor lands on `/en/`

#### Scenario: Switching from English to Portuguese
- **WHEN** a visitor on `/en/` selects Portuguese
- **THEN** the visitor lands on `/`

#### Scenario: Current language is not offered as a target
- **WHEN** a visitor views the switcher on a Portuguese page
- **THEN** Portuguese is shown as the current language and is not a link

### Requirement: Calls to action into the product
The home page SHALL link its primary call to action to the dashboard URL and its secondary
call to action to sales contact. Both targets SHALL come from build configuration, not hardcoded
per page.

#### Scenario: Visitor clicks the primary call to action
- **WHEN** a visitor clicks the primary call to action in either language
- **THEN** the browser navigates to the configured dashboard URL

#### Scenario: Visitor clicks the sales contact call to action
- **WHEN** a visitor clicks the secondary call to action
- **THEN** the browser opens the configured sales contact target

#### Scenario: Dashboard URL is not configured
- **WHEN** the site is built without a dashboard URL setting
- **THEN** the primary call to action points to the production default `https://app.koalaflow.com`

### Requirement: Search engine metadata
Each page SHALL declare a localized title and description, an absolute canonical URL, `hreflang`
alternates for every supported language plus `x-default` pointing to the Portuguese page, and Open
Graph title, description, URL and locale.

#### Scenario: Crawler reads the Portuguese home page
- **WHEN** a crawler fetches `/`
- **THEN** the page declares canonical `https://koalaflow.com/`, alternates `pt-BR` → `/`,
  `en` → `/en/`, `x-default` → `/`, and Open Graph locale `pt_BR`

#### Scenario: Crawler reads the English home page
- **WHEN** a crawler fetches `/en/`
- **THEN** the page declares canonical `https://koalaflow.com/en/` and Open Graph locale `en_US`

#### Scenario: Site is built for a non-production origin
- **WHEN** the site is built with a different site URL setting (for example, a staging origin)
- **THEN** canonical, alternate and Open Graph URLs use that origin

### Requirement: Crawler files
The site SHALL publish `/sitemap.xml` listing every public page in every language with its language
alternates, and `/robots.txt` that allows crawling and references the sitemap.

#### Scenario: Crawler fetches the sitemap
- **WHEN** a crawler requests `/sitemap.xml`
- **THEN** it receives entries for `/` and `/en/`, each listing both language alternates

#### Scenario: Crawler fetches robots.txt
- **WHEN** a crawler requests `/robots.txt`
- **THEN** it allows all paths and points to the absolute sitemap URL

#### Scenario: The 404 page is not listed
- **WHEN** the sitemap is generated
- **THEN** it does not contain the not-found page

### Requirement: Not-found page
Requests for paths that do not exist SHALL show a single not-found page with a short message in both
languages and links back to both home pages. The page SHALL ask crawlers not to index it.

#### Scenario: Visitor opens an unknown path
- **WHEN** a visitor requests `/does-not-exist/`
- **THEN** the not-found page is shown with text in Portuguese and English and links to `/` and `/en/`

#### Scenario: Visitor opens an unsupported locale prefix
- **WHEN** a visitor requests `/es/`
- **THEN** the not-found page is shown instead of falling back to another language

#### Scenario: Crawler reaches the not-found page
- **WHEN** a crawler fetches an unknown path
- **THEN** the page declares `noindex`

### Requirement: Static delivery without a runtime server
The site SHALL be produced as static files only (HTML, CSS, JS, images and crawler files) that any
static file host can serve. It SHALL NOT need a server, cookies or per-request logic to render any page.

#### Scenario: Site is built
- **WHEN** the site build runs
- **THEN** it outputs a directory with `index.html`, `en/index.html`, `404.html`, `sitemap.xml` and
  `robots.txt`

#### Scenario: A page uses a server-only feature
- **WHEN** a page is changed to depend on per-request data such as cookies or request headers
- **THEN** the site build fails

#### Scenario: Visitor has JavaScript disabled
- **WHEN** a visitor with JavaScript disabled opens any page
- **THEN** all content, the language switcher and the calls to action are still visible and usable
