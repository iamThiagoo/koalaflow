# Spec Delta

## Purpose

Lets people sign in to Koalaflow without a password, with a code sent to their email or with
Google, and keeps the resulting session and the abuse limits around sign-in safe.

## ADDED Requirements

### Requirement: Request a sign-in code by email
`POST /api/auth/email-otp/send-verification-otp` with an email and type `sign-in` SHALL email a
6-character code drawn from uppercase letters and digits without ambiguous characters
(`0`, `O`, `1`, `I`, `L`). The code SHALL be valid for 5 minutes, and requesting a new one SHALL
invalidate the previous one. The response SHALL be the same whether or not the email has an
account.

#### Scenario: Known email
- **WHEN** a client requests a code for the email of an existing user
- **THEN** the response is `200` and one email with a 6-character code from the allowed alphabet
  is sent to that address

#### Scenario: Unknown email gets the same response
- **WHEN** a client requests a code for an email with no account
- **THEN** the response status and body are identical to those for an existing user, and a code
  is sent

#### Scenario: Malformed email
- **WHEN** a client requests a code with `not-an-email` or an email longer than 254 characters
- **THEN** the response is `400` and no email is sent

#### Scenario: New code replaces the old one
- **WHEN** a client requests a second code for the same email and then signs in with the first
- **THEN** the sign-in is rejected and the second code still works

### Requirement: Sign in with an email code
`POST /api/auth/sign-in/email-otp` with the email and a valid code SHALL sign the user in and set
the session cookie, creating the user with a verified email when none exists. The code SHALL be
accepted in any letter case and with spaces or hyphens, and SHALL be usable only once.

#### Scenario: First sign-in creates the user
- **WHEN** a client signs in with a valid code for an email with no account
- **THEN** the response is `200`, a user with that email and a verified email exists, and the
  response sets the session cookie

#### Scenario: Code typed loosely
- **WHEN** the emailed code is `K7QM4X` and the client sends `k7q-m4x`
- **THEN** the sign-in succeeds

#### Scenario: Wrong code
- **WHEN** a client signs in with a code that was not issued for that email
- **THEN** the response is `400`, no session cookie is set and no user is created

#### Scenario: Expired code
- **WHEN** a client signs in with a correct code more than 5 minutes after it was issued
- **THEN** the sign-in is rejected and no session cookie is set

#### Scenario: Reused code
- **WHEN** a client signs in successfully and then sends the same email and code again
- **THEN** the second sign-in is rejected

### Requirement: A code is locked after three wrong attempts
After 3 wrong attempts for an email, the current code SHALL stop working, even when the correct
code is then sent; the user has to request a new code.

#### Scenario: Correct code after three wrong attempts
- **WHEN** a client sends 3 wrong codes for an email and then the correct one
- **THEN** the fourth attempt is rejected and no session cookie is set

#### Scenario: New code after a lockout
- **WHEN** a client is locked out and then requests a new code
- **THEN** signing in with the new code succeeds

### Requirement: Sign in with Google
`POST /api/auth/sign-in/social` with provider `google` SHALL return the Google authorization URL,
and `GET /api/auth/callback/google` SHALL complete the sign-in and redirect to the app. A Google
account whose verified email matches an existing user SHALL sign in as that user. The callback
SHALL reject requests whose `state` does not match the one issued to that browser.

#### Scenario: Existing email-code user signs in with Google
- **WHEN** a user who signed up by email code signs in with a Google account with the same verified
  email
- **THEN** they are signed in as the same user, with the same organization

#### Scenario: Forged callback
- **WHEN** a client calls the Google callback with a missing or different `state`
- **THEN** no session is created and the client is redirected with an error

#### Scenario: Redirect target outside the app
- **WHEN** a client starts a Google sign-in with `callbackURL` set to `https://evil.example/`
- **THEN** the request is rejected and no authorization URL is returned

### Requirement: Session cookie and lifetime
The session SHALL be an opaque token in an `HttpOnly`, `SameSite=Lax` cookie scoped to the app
host, `Secure` in production. A session SHALL expire 7 days after its last refresh and SHALL be
refreshed at most once a day while in use. Expired, revoked or tampered tokens SHALL be treated as
no session.

#### Scenario: Cookie attributes in production
- **WHEN** a user signs in on the production app
- **THEN** the session cookie has `HttpOnly`, `Secure` and `SameSite=Lax` and no `Domain`
  attribute

#### Scenario: Tampered token
- **WHEN** a client sends a session cookie with a modified value
- **THEN** `GET /api/auth/get-session` returns no session

#### Scenario: Expired session
- **WHEN** a client sends a session cookie more than 7 days after the session's last refresh
- **THEN** `GET /api/auth/get-session` returns no session

### Requirement: Sign out
`POST /api/auth/sign-out` SHALL revoke the current session so its token no longer works anywhere.
State-changing auth requests with an `Origin` other than the app SHALL be rejected.

#### Scenario: Token after sign-out
- **WHEN** a user signs out and the old session cookie is sent again
- **THEN** `GET /api/auth/get-session` returns no session

#### Scenario: Cross-origin sign-out
- **WHEN** a request to `POST /api/auth/sign-out` carries a valid session cookie and
  `Origin: https://evil.example`
- **THEN** the response is `403` and the session remains valid

### Requirement: Sign-in requests are rate limited
Code requests and sign-in attempts SHALL be limited to 3 per minute per client IP, answering `429`
beyond that. At most 5 codes per hour SHALL be emailed to one address; requests beyond that get
the normal response but send nothing. Forwarded-IP headers SHALL be honored only from configured
trusted proxies.

#### Scenario: Too many code requests from one IP
- **WHEN** one client IP requests a fourth code within a minute
- **THEN** the response is `429`

#### Scenario: Email bombing from many IPs
- **WHEN** clients from different IPs request a sixth code for the same email within an hour
- **THEN** the response matches a normal code request and no sixth email is sent

#### Scenario: Forged forwarded address
- **WHEN** a client that reached the rate limit retries with `X-Forwarded-For` set to a different
  address in front of the address added by the trusted proxy
- **THEN** the response is still `429`

### Requirement: Only the auth routes the product uses are served
Under `/api/auth/*` the api SHALL serve only the routes used by the sign-in, session, sign-out and
organization-read flows, and SHALL answer `404` with the uniform error body to any other path,
including password sign-up and sign-in, account updates and session listing.

#### Scenario: Password sign-up attempt
- **WHEN** a client sends `POST /api/auth/sign-up/email` with an email and password
- **THEN** the response is `404` and no user is created

#### Scenario: Account update attempt
- **WHEN** a signed-in client sends `POST /api/auth/update-user` with a new name
- **THEN** the response is `404` and the user is unchanged

### Requirement: Codes and credentials stay out of logs and responses
Sign-in codes, session tokens and email addresses SHALL NOT appear in api logs, and codes SHALL
appear only in the email sent to the user.

#### Scenario: Logs after a sign-in
- **WHEN** a user requests a code and signs in with it
- **THEN** no api log line contains the code, the session token or the email address

#### Scenario: Code not in the response
- **WHEN** a client requests a code
- **THEN** the response body and headers do not contain the code
