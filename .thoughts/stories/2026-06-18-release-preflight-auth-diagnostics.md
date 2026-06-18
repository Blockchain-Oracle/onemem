# Stories: Release Preflight Auth Diagnostics

## Traceability

Stories derive from
`.thoughts/specs/2026-06-18-release-preflight-auth-diagnostics.md` requirements
R1-R9 and acceptance criteria AC1-AC7.

## Story 1: Maintainer Release Preflight

As a OneMem maintainer,
I want one release preflight command,
so that I can see missing registry packages and missing publish credentials
before claiming a release is live.

### Acceptance Criteria

- `pnpm release:preflight` prints npm and PyPI packages needing publication.
- The command prints whether npm and PyPI auth gates are available without
  printing secret values.
- The default command is read-only and exits zero for reporting.

### Scenarios

- Given packages are missing and credentials are absent, when the maintainer
  runs the preflight, then the output identifies both the package drift and auth
  gaps.

## Story 2: Strict Handoff Gate

As a future release agent,
I want strict modes,
so that handoff checks can fail when packages still need publication or auth is
missing.

### Acceptance Criteria

- `--require-auth` fails when publication is needed and auth is unavailable.
- `--strict` fails unless registries are current and required auth is present.
- `--json` emits machine-readable status for automation.

## Story 3: Release Workflow Visibility

As a reviewer of GitHub Release logs,
I want registry/auth preflight output before publish decisions,
so that a green workflow cannot be mistaken for package publication.

### Acceptance Criteria

- `.github/workflows/release.yml` runs `pnpm release:preflight`.
- Structure tests assert the workflow step exists.
- Release docs mention the preflight.

## Story 4: Stale Provider Artifact Repair

As a maintainer publishing provider packages,
I want local package versions to advance when the registry artifact lacks
current helpers,
so that the next publish can deliver the actual repo source instead of being
blocked by same-version immutability.

### Acceptance Criteria

- Provider packages with stale current registry artifacts have fresh local patch
  versions.
- Python providers require `onemem-sdk-python>=0.2.0` for the memory bridge.
- Framework docs name both local pending versions and stale registry evidence.
- Structure tests guard the version and artifact-marker expectations.

## Open Questions

- Should strict mode become mandatory in Release once repository secrets and npm
  trusted publishing are configured?
