# Spec Delta

## MODIFIED Requirements

### Requirement: Readiness endpoint
The api SHALL answer `GET /api/health/ready` without authentication, checking Postgres and Redis,
each with a timeout of at most 2 seconds. It SHALL return `200` when every check passes and `503`
otherwise, with `status` and each dependency as `up` or `down`.

#### Scenario: Database reachable
- **WHEN** a client requests `/api/health/ready` and Postgres and Redis answer
- **THEN** the response is `200` with `{"status":"ok","checks":{"database":"up","cache":"up"}}`

#### Scenario: Database unreachable
- **WHEN** a client requests `/api/health/ready` and Postgres does not answer within the timeout
- **THEN** the response is `503` with `{"status":"error","checks":{"database":"down","cache":"up"}}`
  within 3 seconds

#### Scenario: Redis unreachable
- **WHEN** a client requests `/api/health/ready` and Redis does not answer within the timeout
- **THEN** the response is `503` with `{"status":"error","checks":{"database":"up","cache":"down"}}`
  within 3 seconds
