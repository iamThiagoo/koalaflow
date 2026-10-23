# Spec Delta

## Purpose

Defines how the api reads its runtime configuration from the environment and refuses to run with
missing, invalid or unsafe values, without exposing those values.

## ADDED Requirements

### Requirement: Configuration is validated at startup
The api SHALL read its configuration from environment variables and validate every value (type,
range, format, allowed values) before it accepts any request. Variables not used by the api SHALL
be ignored.

#### Scenario: Valid configuration
- **WHEN** the api starts with every required variable set to a valid value
- **THEN** it starts and listens on the configured port

#### Scenario: Missing required variable
- **WHEN** the api starts without the database host set
- **THEN** it exits with a non-zero code before listening, naming the missing variable

#### Scenario: Out-of-range value
- **WHEN** the api starts with the port set to `70000` or to `abc`
- **THEN** it exits with a non-zero code before listening, naming the invalid variable

#### Scenario: Unknown log level
- **WHEN** the api starts with the log level set to a value outside the allowed list
- **THEN** it exits with a non-zero code before listening

### Requirement: Configuration errors never reveal values
When configuration is invalid, the api SHALL report only the variable names and the kind of
problem, never the provided values, so secrets such as the database password are never printed.

#### Scenario: Invalid database password type
- **WHEN** the api starts with an invalid configuration that includes the database password
- **THEN** the startup error lists variable names and problems and does not contain the value of
  any variable

### Requirement: Production requires an encrypted database connection
When running in production mode, the api SHALL refuse to start unless the database connection is
configured to use TLS.

#### Scenario: Production without database TLS
- **WHEN** the api starts in production mode with database TLS disabled
- **THEN** it exits with a non-zero code before listening, naming the database TLS variable

#### Scenario: Development without database TLS
- **WHEN** the api starts in development mode with database TLS disabled
- **THEN** it starts normally
