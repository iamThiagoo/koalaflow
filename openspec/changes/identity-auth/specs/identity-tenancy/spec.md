# Spec Delta

## Purpose

Defines the tenant of every api request: the organization a signed-in user is an active member of,
created for them on first sign-in, with every api route closed unless it is explicitly public.

## ADDED Requirements

### Requirement: Personal organization on first sign-in
When a user signs in and belongs to no organization, the api SHALL create an organization with the
user as its `owner` and make it the session's active organization. A user who already belongs to an
organization SHALL get it as the active organization of each new session.

#### Scenario: First sign-in
- **WHEN** a new user signs in for the first time
- **THEN** the session's active organization is a new organization whose only member is that user
  with role `owner`

#### Scenario: Later sign-in
- **WHEN** the same user signs in again, by email code or by Google
- **THEN** the session's active organization is the same organization and no new organization is
  created

### Requirement: Api routes require a session by default
Every api route SHALL answer `401` with the uniform error body to requests without a valid session,
unless the route is explicitly public. Only the health routes and the auth routes under
`/api/auth/*` SHALL be public.

#### Scenario: No session
- **WHEN** a client calls a non-public api route without a session cookie
- **THEN** the response is `401` with the uniform error body

#### Scenario: Invalid session
- **WHEN** a client calls a non-public api route with an expired, revoked or tampered session token
- **THEN** the response is `401`

#### Scenario: Public routes
- **WHEN** a client without a session calls `/api/health/ready` or `/api/auth/get-session`
- **THEN** the request is served and not rejected with `401`

### Requirement: State-changing api requests come from the app origin
Non-public api routes SHALL answer `403` with the uniform error body to `POST`, `PUT`, `PATCH` and
`DELETE` requests whose `Origin` header is missing or differs from the app origin.

#### Scenario: Cross-site form post
- **WHEN** a signed-in browser sends `POST` to a non-public api route with
  `Origin: https://evil.example`
- **THEN** the response is `403` and the route does not run

#### Scenario: Missing origin
- **WHEN** a client sends `DELETE` to a non-public api route with a valid session and no `Origin`
- **THEN** the response is `403`

#### Scenario: Same-origin request
- **WHEN** a signed-in browser sends `POST` to a non-public api route with the app origin
- **THEN** the route runs

### Requirement: Tenant comes from a current membership
For an authenticated request, the tenant SHALL be the session's active organization, and only while
the user is still a member of it; otherwise the api SHALL answer `403`. Organization ids sent in the
path, query, body or headers SHALL NOT change the tenant.

#### Scenario: Member of the active organization
- **WHEN** a signed-in user calls a tenant-scoped route
- **THEN** the route runs with the session's active organization as the tenant and the user's role
  in it

#### Scenario: Membership removed during a session
- **WHEN** a user's membership in the active organization is removed and they call a tenant-scoped
  route with their existing session
- **THEN** the response is `403`

#### Scenario: Another organization's id in the request
- **WHEN** a signed-in user calls a tenant-scoped route with another organization's id in the query
  string, the body or an `X-Organization-Id` header
- **THEN** the route still runs with the session's active organization as the tenant

### Requirement: Organization management is not available
The api SHALL NOT let users create additional organizations, invite or remove members, change roles
or delete organizations.

#### Scenario: Create another organization
- **WHEN** a signed-in user sends `POST /api/auth/organization/create`
- **THEN** the response is `404` and no organization is created

#### Scenario: Delete the organization
- **WHEN** the owner sends `POST /api/auth/organization/delete` for their organization
- **THEN** the response is `404` and the organization still exists

#### Scenario: Invite a member
- **WHEN** the owner sends `POST /api/auth/organization/invite-member`
- **THEN** the response is `404` and no invitation is created

### Requirement: Identity ids are UUIDs
User, organization, membership and session ids SHALL be random UUIDs.

#### Scenario: Ids in the session
- **WHEN** a signed-in client calls `GET /api/auth/get-session`
- **THEN** the user id and the active organization id are UUIDs
