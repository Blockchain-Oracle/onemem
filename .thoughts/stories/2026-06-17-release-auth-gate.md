# Stories: Release Auth Gate

Date: 2026-06-17

## Traceability

- Spec: `.thoughts/specs/2026-06-17-release-auth-gate.md`
- Requirements covered: R1-R7.

## Story 1: Main Stays Green Without Registry Auth

As a maintainer,
I want Release to skip npm/PyPI uploads when credentials are absent,
so that `main` does not stay red for a known external registry setup blocker.

### Acceptance Criteria

- Covers R1, R2, R5, R6.
- Workflow maps secrets to env before condition checks.
- A version-only Changesets action runs when npm publish is disabled.
- A notice explains why npm publish was skipped.

### Scenario

Given `NPM_TOKEN` is empty and trusted publishing is not enabled,
when the Release workflow runs,
then it can create/update the Changesets release PR without attempting npm
publish.

## Story 2: Publishing Still Works When Auth Is Configured

As a release operator,
I want the publish path to activate only when registry auth is deliberately
available,
so that real package uploads are explicit and traceable.

### Acceptance Criteria

- Covers R3 and R4.
- The publish-capable Changesets action runs when `NPM_TOKEN` exists.
- The publish-capable Changesets action can also run when the trusted-publisher
  opt-in variable is enabled.
- Python publish only runs after TS publish succeeds and `PYPI_TOKEN` exists.

### Scenario

Given `NPM_TOKEN` is configured,
when the Release workflow runs on `main`,
then Changesets can publish npm packages through `scripts/publish-all.sh ts`.

## Story 3: Docs Match Release Reality

As a future agent,
I want release docs to state the credential gate,
so that I do not misread a skipped upload as a published package.

### Acceptance Criteria

- Covers R7.
- `.changeset/README.md` names the npm and PyPI gates.
- The docs keep the "do not claim published until registry lookup" boundary.

### Scenario

Given package publication is blocked,
when I read release docs,
then I can tell which credentials or npm-side settings must be added before
publishing will happen.
