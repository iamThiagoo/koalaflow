# Spec Delta

## Purpose

Defines the HTTP behavior every api endpoint shares: request identification, the error response
contract, request body limits, input validation, security headers and the cross-origin policy.

## ADDED Requirements

### Requirement: Every response carries a request id
The api SHALL return an `X-Request-Id` header on every response. It SHALL reuse an incoming
`X-Request-Id` only when it is a well-formed UUID and SHALL generate a new UUID otherwise.

#### Scenario: Request without an id
- **WHEN** a client sends a request without `X-Request-Id`
- **THEN** the response has an `X-Request-Id` header with a newly generated UUID

#### Scenario: Request with a valid id
- **WHEN** a client sends a request with `X-Request-Id` set to a well-formed UUID
- **THEN** the response has the same `X-Request-Id`

#### Scenario: Request with a malformed id
- **WHEN** a client sends `X-Request-Id` with a non-UUID value, such as text with line breaks or a
  string longer than 36 characters
- **THEN** the response has a newly generated UUID in `X-Request-Id`, not the value sent

### Requirement: Uniform error response
Every error response SHALL be JSON with `statusCode`, `error` (the HTTP reason phrase), `message`
and `requestId` equal to the `X-Request-Id` header. Responses SHALL NOT contain stack traces, SQL,
file paths, framework names or messages from unexpected errors.

#### Scenario: Unknown route
- **WHEN** a client requests a path that does not exist
- **THEN** the response is `404` with the uniform error body

#### Scenario: Unexpected server error
- **WHEN** a handler fails with an unexpected error whose message contains internal details
- **THEN** the response is `500` with the message `Internal server error` and the internal message
  does not appear anywhere in the response

#### Scenario: Error body matches the header
- **WHEN** any error response is returned
- **THEN** its `requestId` equals the response's `X-Request-Id` header

### Requirement: Request bodies are bounded and well-formed
The api SHALL accept request bodies only up to 1 MB and SHALL answer malformed or oversized bodies
with the uniform error body, without echoing the body or parser details.

#### Scenario: Malformed JSON
- **WHEN** a client sends `Content-Type: application/json` with an invalid JSON body
- **THEN** the response is `400` with the uniform error body and no parser message

#### Scenario: Oversized body
- **WHEN** a client sends a body larger than 1 MB
- **THEN** the response is `413` with the uniform error body

### Requirement: Input validation rejects unknown and invalid fields
Endpoints that accept input SHALL validate it against a declared schema and SHALL reject unknown
fields and invalid values with `400` and the uniform error body with the message
`Validation failed`. The error body SHALL NOT list fields or echo the submitted values.

#### Scenario: Unknown field
- **WHEN** a client sends a body with a field the endpoint's schema does not declare
- **THEN** the response is `400` with the message `Validation failed`

#### Scenario: Invalid value is not echoed
- **WHEN** a client sends a value that fails validation, such as a 10,000-character string or
  `../../etc/passwd` in a field restricted to a name format
- **THEN** the response is `400` and does not contain the submitted value

### Requirement: Security headers on every response
Every api response SHALL include `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`,
`Referrer-Policy: no-referrer` and a `Content-Security-Policy` that denies all content and
framing, and SHALL NOT include `X-Powered-By`.

#### Scenario: Headers on a successful response
- **WHEN** a client requests the liveness endpoint
- **THEN** the response includes the security headers and no `X-Powered-By` header

#### Scenario: Headers on an error response
- **WHEN** a client requests a path that does not exist
- **THEN** the `404` response includes the same security headers

### Requirement: No cross-origin browser access
The api SHALL NOT grant cross-origin access to browsers: it SHALL NOT send
`Access-Control-Allow-Origin` for any origin.

#### Scenario: Cross-origin preflight
- **WHEN** a browser sends an `OPTIONS` preflight with `Origin: https://evil.example`
- **THEN** the response has no `Access-Control-Allow-Origin` header
