# api-logging Specification

## Purpose

Defines the structured logs the api writes for requests and errors, so incidents can be traced by
request id while credentials, signed URLs and personal data never reach the logs.

## Requirements

### Requirement: One structured log line per request
The api SHALL write one JSON log line per completed request with the request id, method, path,
status code and duration, at the configured log level.

#### Scenario: Successful request
- **WHEN** a client requests the liveness endpoint
- **THEN** one JSON log line is written with the request id from the response header, method
  `GET`, the path, status `200` and the duration

#### Scenario: Log level above info
- **WHEN** the log level is configured as `warn` and a request succeeds
- **THEN** no request log line is written for it

### Requirement: Logs never contain credentials or query strings
Request logs SHALL NOT contain the values of `Authorization`, `Cookie`, `Set-Cookie` or
`X-Api-Key` headers, request or response bodies, or the URL query string.

#### Scenario: Request with credentials
- **WHEN** a client sends a request with an `Authorization` header and a `Cookie` header
- **THEN** the log line does not contain either value

#### Scenario: Request with a signed query string
- **WHEN** a client requests `/api/health/live?signature=abc123&token=xyz`
- **THEN** the logged path is `/api/health/live` and neither `abc123` nor `xyz` appears in the log

### Requirement: Unexpected errors are logged server-side
When a request fails with an unexpected error, the api SHALL log the error with its stack trace
and the request id, at error level, so the generic client response can be traced.

#### Scenario: Unexpected error
- **WHEN** a handler fails with an unexpected error
- **THEN** an error-level log line contains the error stack and the same request id returned to
  the client

#### Scenario: Expected client error
- **WHEN** a request fails validation with `400`
- **THEN** no error-level log line with a stack trace is written for it
