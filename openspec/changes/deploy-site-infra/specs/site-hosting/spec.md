# Spec Delta

## Purpose

Defines how the public marketing site is served on its domain and how a new build of it is
published, independent of how the site's pages are built.

## ADDED Requirements

### Requirement: Canonical HTTPS origin
The site SHALL be served only over HTTPS on the apex domain. Requests over HTTP and requests to
the `www` host SHALL be permanently redirected to the same path on the HTTPS apex domain. While no
domain is configured, the site SHALL be served over HTTPS on the CDN's default domain, with HTTP
redirected to HTTPS and no `www` host.

#### Scenario: No domain is configured yet
- **WHEN** the infrastructure is applied without a domain and a visitor requests the CDN's
  default domain over HTTP
- **THEN** the response is a permanent redirect to the same path over HTTPS on that domain, and
  the home page is then returned with status 200

#### Scenario: Visitor opens the apex domain over HTTPS
- **WHEN** a visitor requests `https://koalaflow.com/`
- **THEN** the home page is returned with status 200

#### Scenario: Visitor opens the site over HTTP
- **WHEN** a visitor requests `http://koalaflow.com/`
- **THEN** the response is a permanent redirect to `https://koalaflow.com/`

#### Scenario: Visitor opens the www host
- **WHEN** a visitor requests `https://www.koalaflow.com/some/path/?q=1`
- **THEN** the response is a 301 redirect to `https://koalaflow.com/some/path/?q=1`

### Requirement: Directory index paths
A request for a path ending in `/` SHALL return that directory's `index.html`. A request for a
path without a trailing slash and without a file extension SHALL be redirected to the same path
with a trailing slash.

#### Scenario: Visitor opens a directory path
- **WHEN** the build contains `about/index.html` and a visitor requests `/about/`
- **THEN** the content of `about/index.html` is returned with status 200

#### Scenario: Visitor omits the trailing slash
- **WHEN** a visitor requests `/some-page`
- **THEN** the response is a 301 redirect to `/some-page/`, keeping the query string

#### Scenario: Visitor requests a file
- **WHEN** a visitor requests `/robots.txt`
- **THEN** the file is returned without any redirect

### Requirement: Not-found status
Requests for paths that do not exist SHALL return the site's not-found page with HTTP status 404.
The storage behind the site SHALL NOT be reachable directly.

#### Scenario: Visitor opens an unknown path
- **WHEN** a visitor requests `/does-not-exist/`
- **THEN** the not-found page is returned with status 404

#### Scenario: Visitor opens the former English URL
- **WHEN** a visitor requests `/en/`
- **THEN** the not-found page is returned with status 404

#### Scenario: Someone requests the storage bucket directly
- **WHEN** a client requests an object from the site's storage bucket URL instead of the domain
- **THEN** access is denied

### Requirement: Cache lifetimes
Fingerprinted build assets under `/_next/static/` SHALL be served with a one-year immutable
browser cache. Every other file SHALL be served with a browser cache that revalidates on each
visit, so a new deploy is visible on the next page load.

#### Scenario: Browser loads a fingerprinted asset
- **WHEN** a browser requests a file under `/_next/static/`
- **THEN** the response has `Cache-Control: public, max-age=31536000, immutable`

#### Scenario: Browser loads a page
- **WHEN** a browser requests `/`
- **THEN** the response `Cache-Control` has `max-age=0` and requires revalidation

#### Scenario: Visitor returns after a deploy
- **WHEN** a new build is published and a visitor reloads `/`
- **THEN** the visitor receives the new build's HTML, not the previous one

### Requirement: Security response headers
Every response SHALL include `Strict-Transport-Security` (at least one year, including
subdomains), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` and
`Referrer-Policy: strict-origin-when-cross-origin`.

#### Scenario: Browser loads a page
- **WHEN** a browser requests `/`
- **THEN** the response includes all four security headers

#### Scenario: Browser receives a not-found page
- **WHEN** a browser requests an unknown path
- **THEN** the 404 response also includes all four security headers

#### Scenario: Another site frames the home page
- **WHEN** a third-party page embeds `https://koalaflow.com/` in an iframe
- **THEN** the browser refuses to render it

### Requirement: Publishing a build
A push to `main` that changes the site or its dependencies SHALL build the site and publish it,
replacing the previous version. A failed build SHALL NOT change what is served. Fingerprinted
assets from the previous build SHALL stay available so pages already open keep working.

#### Scenario: Site change is merged
- **WHEN** a commit changing `apps/site` is pushed to `main`
- **THEN** within the workflow run the new build is served on the site's canonical URL

#### Scenario: Site build fails
- **WHEN** the site build fails on `main`
- **THEN** nothing is uploaded and the previous version keeps being served

#### Scenario: Page loaded before a deploy requests an old asset
- **WHEN** a page loaded from the previous build requests one of its `/_next/static/` files after
  a new deploy
- **THEN** the file is still returned with status 200

#### Scenario: A page is removed from the site
- **WHEN** a deploy no longer contains a page that the previous build had
- **THEN** requests for that page return the not-found page with status 404
