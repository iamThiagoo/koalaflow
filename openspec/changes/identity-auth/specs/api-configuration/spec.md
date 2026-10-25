# Spec Delta

## ADDED Requirements

### Requirement: Production requires an encrypted Redis connection
When running in production mode, the api SHALL refuse to start unless the Redis URL uses TLS
(`rediss:`), and the error SHALL name the variable without printing its value.

#### Scenario: Production with plain Redis
- **WHEN** the api starts in production mode with `REDIS_URL=redis://cache:6379`
- **THEN** it exits with a non-zero code before listening, naming `REDIS_URL` and not printing the
  URL

#### Scenario: Development with plain Redis
- **WHEN** the api starts in development mode with `REDIS_URL=redis://127.0.0.1:6379`
- **THEN** it starts normally

### Requirement: Production requires an auth secret
When running in production mode, the api SHALL refuse to start without an auth secret of at least
32 characters, and the error SHALL name the variable without printing its value.

#### Scenario: Missing secret in production
- **WHEN** the api starts in production mode without `BETTER_AUTH_SECRET`
- **THEN** it exits with a non-zero code before listening, naming `BETTER_AUTH_SECRET`

#### Scenario: Short secret in production
- **WHEN** the api starts in production mode with a 16-character `BETTER_AUTH_SECRET`
- **THEN** it exits with a non-zero code before listening and the value does not appear in the
  output
