# api-health Specification

## Purpose

Defines the liveness and readiness endpoints that local tooling, load balancers and orchestrators
use to decide whether the api process is running and able to serve traffic.

## Requirements

### Requirement: Liveness endpoint
The api SHALL answer `GET /api/health/live` with `200` and `{"status":"ok"}` whenever the process is
running, without checking dependencies and without authentication.

#### Scenario: Process running with the database down
- **WHEN** a client requests `/api/health/live` while Postgres is unreachable
- **THEN** the response is `200` with `{"status":"ok"}`

#### Scenario: Wrong method
- **WHEN** a client sends `POST /api/health/live`
- **THEN** the response is `404` with the uniform error body

### Requirement: Readiness endpoint
The api SHALL answer `GET /api/health/ready` without authentication, checking Postgres with a
timeout of at most 2 seconds. It SHALL return `200` when every check passes and `503` otherwise,
with `status` and each dependency as `up` or `down`.

#### Scenario: Database reachable
- **WHEN** a client requests `/api/health/ready` and Postgres answers
- **THEN** the response is `200` with `{"status":"ok","checks":{"database":"up"}}`

#### Scenario: Database unreachable
- **WHEN** a client requests `/api/health/ready` and Postgres does not answer within the timeout
- **THEN** the response is `503` with `{"status":"error","checks":{"database":"down"}}` within
  3 seconds

### Requirement: Health responses disclose no internals
Health responses SHALL NOT include versions, hostnames, connection strings, error messages or
timing details.

#### Scenario: Readiness failure details
- **WHEN** the readiness check fails because the database rejects the credentials
- **THEN** the response body contains only the status and `down` for the database, and the
  rejection reason appears only in the server log
