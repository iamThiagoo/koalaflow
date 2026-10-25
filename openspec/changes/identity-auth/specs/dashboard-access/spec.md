# Spec Delta

## Purpose

Defines how the creator dashboard (`apps/app`) talks to the api from the browser's single origin,
keeps its pages behind a session and walks people through signing in and out.

## ADDED Requirements

### Requirement: The api is reached through the app origin
Requests to `<app>/api/*` SHALL be forwarded to the api with their method, path, query, body and
cookies, and the api's response, including `Set-Cookie`, SHALL be returned unchanged. The api's own
address SHALL NOT be exposed to browsers.

#### Scenario: Forwarded request
- **WHEN** a browser requests `<app>/api/health/live`
- **THEN** the response is `200` with `{"status":"ok"}`

#### Scenario: Session cookie set through the app
- **WHEN** a user completes a sign-in through `<app>/api/auth/...`
- **THEN** the session cookie is set for the app host

#### Scenario: Api address not exposed
- **WHEN** a browser loads any app page and its scripts
- **THEN** no response contains the api's internal address

#### Scenario: Api unavailable
- **WHEN** the api is down and a browser requests `<app>/api/health/live`
- **THEN** the response is an error status without the api's address or connection details

### Requirement: Dashboard pages require a session
Every app page except `/login` SHALL redirect to `/login` when the request has no valid session. A
signed-in user opening `/login` SHALL be redirected to `/`.

#### Scenario: Signed out
- **WHEN** a browser without a session cookie opens `/`
- **THEN** the response redirects to `/login`

#### Scenario: Expired or revoked session
- **WHEN** a browser opens `/` with a session cookie that the api no longer accepts
- **THEN** the response redirects to `/login`

#### Scenario: Signed in
- **WHEN** a signed-in browser opens `/`
- **THEN** the page shows the signed-in user's email and organization name

#### Scenario: Signed-in user opens the login page
- **WHEN** a signed-in browser opens `/login`
- **THEN** the response redirects to `/`

### Requirement: Sign in on the login page
`/login` SHALL ask for an email, send a code to it, then ask for the code and go to `/` once signed
in. It SHALL also offer signing in with Google. Errors SHALL be shown without revealing whether
the email has an account.

#### Scenario: Email code sign-in
- **WHEN** a person enters their email, receives the code and enters it
- **THEN** they land on `/` signed in

#### Scenario: Wrong code
- **WHEN** a person enters a wrong code
- **THEN** the page shows that the code is invalid and lets them try again or request a new code

#### Scenario: Too many attempts or requests
- **WHEN** the api rejects a code after too many attempts or answers `429`
- **THEN** the page shows a message asking to request a new code or wait, and stays on `/login`

#### Scenario: Google sign-in
- **WHEN** a person chooses Google and approves access
- **THEN** they land on `/` signed in

### Requirement: Sign out from the dashboard
The dashboard SHALL offer a sign-out action that revokes the session and returns to `/login`.

#### Scenario: Sign out
- **WHEN** a signed-in person signs out and then opens `/`
- **THEN** they are redirected to `/login`

### Requirement: Security headers on app responses
Every app response SHALL include `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin` and a `Content-Security-Policy` with
`frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'` and `object-src 'none'`.

#### Scenario: Login page cannot be framed
- **WHEN** a third-party page embeds `<app>/login` in an iframe
- **THEN** the browser refuses to render it because of `frame-ancestors 'none'`

#### Scenario: Headers on a redirect
- **WHEN** a browser without a session opens `/`
- **THEN** the redirect response includes the same security headers
