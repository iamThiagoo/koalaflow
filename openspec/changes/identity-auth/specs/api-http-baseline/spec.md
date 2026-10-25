# Spec Delta

## MODIFIED Requirements

### Requirement: Uniform error response
Every error response SHALL be JSON with `statusCode`, `error` (the HTTP reason phrase), `message`
and `requestId` equal to the `X-Request-Id` header, except errors produced by the auth routes under
`/api/auth/*`, which SHALL be JSON with `code` and `message`. Responses SHALL NOT contain stack
traces, SQL, file paths, framework names or messages from unexpected errors.

#### Scenario: Unknown route
- **WHEN** a client requests a path that does not exist
- **THEN** the response is `404` with the uniform error body

#### Scenario: Unexpected server error
- **WHEN** a handler fails with an unexpected error whose message contains internal details
- **THEN** the response is `500` with the message `Internal server error` and the internal message
  does not appear anywhere in the response

#### Scenario: Error body matches the header
- **WHEN** any error response outside `/api/auth/*` is returned
- **THEN** its `requestId` equals the response's `X-Request-Id` header

#### Scenario: Auth route error
- **WHEN** a client signs in with a wrong code
- **THEN** the response is JSON with `code` and `message`, carries an `X-Request-Id` header and
  contains no stack trace, SQL or file path

### Requirement: Input validation rejects unknown and invalid fields
Endpoints that accept input SHALL validate it against a declared schema and SHALL reject unknown
fields and invalid values with `400` and the uniform error body with the message
`Validation failed`. The error body SHALL NOT list fields or echo the submitted values. Auth routes
under `/api/auth/*` SHALL reject invalid values with `400` and SHALL ignore unknown fields.

#### Scenario: Unknown field
- **WHEN** a client sends a body with a field the endpoint's schema does not declare
- **THEN** the response is `400` with the message `Validation failed`

#### Scenario: Invalid value is not echoed
- **WHEN** a client sends a value that fails validation, such as a 10,000-character string or
  `../../etc/passwd` in a field restricted to a name format
- **THEN** the response is `400` and does not contain the submitted value

#### Scenario: Unknown field on an auth route
- **WHEN** a client signs in with a valid code and adds `"emailVerified": false` or `"role": "admin"`
  to the body
- **THEN** the extra fields have no effect on the created user or session
