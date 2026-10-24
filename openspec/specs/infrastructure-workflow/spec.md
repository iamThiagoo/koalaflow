# infrastructure-workflow Specification

## Purpose

Defines how cloud infrastructure changes are proposed, reviewed and applied, and how automation
authenticates to the cloud account, for every deployable component of Koalaflow.

## Requirements

### Requirement: Plan on pull request
A pull request that changes infrastructure code SHALL get a plan for each affected
infrastructure root, published on the pull request, without changing any cloud resource.

#### Scenario: Pull request changes the site infrastructure
- **WHEN** a pull request changes files under the site's infrastructure root or a module it uses
- **THEN** a plan for that root is posted on the pull request and no resource is modified

#### Scenario: Pull request does not touch infrastructure
- **WHEN** a pull request only changes application code
- **THEN** no infrastructure plan runs

#### Scenario: Infrastructure code is invalid
- **WHEN** a pull request contains unformatted or invalid infrastructure code
- **THEN** the checks fail and the pull request shows the failure

### Requirement: Gated apply
Infrastructure changes SHALL be applied only from `main` and only after a maintainer approves
the run in the protected `production` environment.

#### Scenario: Infrastructure change is merged
- **WHEN** an infrastructure change is merged to `main`
- **THEN** an apply run waits for approval and changes resources only after it is approved

#### Scenario: Apply is not approved
- **WHEN** the apply run is rejected or never approved
- **THEN** no resource is modified

#### Scenario: Apply is attempted from another branch
- **WHEN** a workflow on a branch other than `main` tries to assume the apply credentials
- **THEN** the cloud account denies it

### Requirement: Locked remote state
Infrastructure state SHALL be stored remotely, encrypted and versioned, with one state per
environment and component, and concurrent operations on the same state SHALL be prevented.

#### Scenario: Two applies run at the same time
- **WHEN** a second operation starts on a state that another operation holds
- **THEN** the second operation fails with a lock error and changes nothing

#### Scenario: State is corrupted by a bad apply
- **WHEN** a state file must be recovered
- **THEN** a previous version of it can be restored

#### Scenario: Changing one component
- **WHEN** the site root is applied
- **THEN** no other component's state is read for writing or modified

### Requirement: Keyless automation credentials
Automation SHALL authenticate to the cloud account with short-lived credentials issued through
the repository's identity federation, with no long-lived access keys stored anywhere. Each
workflow SHALL only receive the permissions its job needs.

#### Scenario: Deploy workflow publishes the site
- **WHEN** the site deploy workflow runs on `main`
- **THEN** it can upload site files and invalidate the site cache, and nothing else

#### Scenario: Workflow from a fork or another repository
- **WHEN** a workflow outside this repository requests the deploy or apply credentials
- **THEN** the cloud account denies it

#### Scenario: Plan workflow tries to change a resource
- **WHEN** the pull request plan credentials are used to modify a resource
- **THEN** the cloud account denies it
