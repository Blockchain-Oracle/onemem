# Stories: Npm Bin Executable Integrity

## Traceability

- Spec: `.thoughts/specs/2026-06-17-npm-bin-executable-integrity.md`
- Research: `.thoughts/research/2026-06-17-npm-bin-executable-integrity.md`
- Requirements: R1-R6
- Acceptance criteria: AC1-AC4

## Story 1: Maintainer Verifies Npm Bin Artifact

As a maintainer,
I want every npm `bin` entry to ship as an executable Node script,
so that command-line package installs do not depend on installer repair or
manual chmod.

### Acceptance Criteria

- Each bin file exists.
- Each bin file starts with `#!/usr/bin/env node`.
- Each bin file has owner execute bit set.
- Dry-pack output reports executable mode for each bin entry.

### Scenarios

```gherkin
Given a package declares a bin entry
When npm pack --dry-run --json runs for that package
Then the bin file appears in the tarball file list
And its mode is executable
```

### Notes

- This story does not require publishing to npm.

## Story 2: Future Agent Catches Bin Drift

As a future agent,
I want structure tests to validate package bin files,
so that a missing shebang or executable bit fails before release.

### Acceptance Criteria

- `pnpm test:structure` checks every package `bin` entry.
- The guard fails with the package and command path when a bin target is invalid.

### Scenarios

```gherkin
Given a package bin target lacks owner execute permission
When pnpm test:structure runs
Then the structure test fails before publish
```

### Notes

- The guard covers all current `@onemem/*` npm package manifests.

## Open Questions

- None blocking for this slice.
