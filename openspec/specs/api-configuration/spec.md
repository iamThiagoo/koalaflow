# api-configuration Specification

## Purpose

Defines how the api reads its runtime configuration from the environment and keeps the database
connection encrypted unless TLS is explicitly turned off outside production.

## Requirements

### Requirement: Configuration comes from environment variables
The api SHALL read its configuration from environment variables where each setting is used, with
`PORT` defaulting to `3000` and `LOG_LEVEL` to `info`. Variables not used by the api SHALL be
ignored.

#### Scenario: Configured environment
- **WHEN** the api starts with the database variables set
- **THEN** it starts and listens on the configured port

### Requirement: Database TLS is on unless explicitly disabled
The api SHALL connect to the database with TLS unless `DB_SSL` is exactly `false`.

#### Scenario: TLS variable missing or mistyped
- **WHEN** the api starts with `DB_SSL` unset or set to any value other than `false`
- **THEN** it connects to the database with TLS

#### Scenario: Development without database TLS
- **WHEN** the api starts in development mode with `DB_SSL=false`
- **THEN** it starts normally without database TLS

### Requirement: Production requires an encrypted database connection
When running in production mode, the api SHALL refuse to start with database TLS disabled, and the
error SHALL name the variable without printing any configuration value.

#### Scenario: Production without database TLS
- **WHEN** the api starts in production mode with `DB_SSL=false`
- **THEN** it exits with a non-zero code before listening, naming `DB_SSL`
