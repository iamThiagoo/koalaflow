# Spec Delta

## MODIFIED Requirements

### Requirement: Calls to action into the product
The home page SHALL link its primary call to action to the dashboard URL and its secondary
call to action to sales contact. Both targets SHALL come from build configuration, not hardcoded
per page or in code. The build SHALL fail when a target is not configured.

#### Scenario: Visitor clicks the primary call to action
- **WHEN** a visitor clicks the primary call to action
- **THEN** the browser navigates to the configured dashboard URL

#### Scenario: Visitor clicks the sales contact call to action
- **WHEN** a visitor clicks the secondary call to action
- **THEN** the browser opens the configured sales contact target

#### Scenario: Dashboard URL is not configured
- **WHEN** the site is built without a dashboard URL setting
- **THEN** the build fails with an error naming the missing setting, and nothing is published
