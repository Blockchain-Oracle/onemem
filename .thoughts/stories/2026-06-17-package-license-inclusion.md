# Stories: Package License Inclusion

## Traceability

- Spec: `.thoughts/specs/2026-06-17-package-license-inclusion.md`
- Research: `.thoughts/research/2026-06-17-package-license-inclusion.md`
- Requirements: R1-R13
- Acceptance criteria: AC1-AC4

## Story 1: Maintainer Verifies Npm License Artifact

As a maintainer,
I want each publishable OneMem npm package tarball to include a license file,
so that release artifacts match their Apache-2.0 metadata and allowlists.

### Acceptance Criteria

- Each targeted package has a package-local `LICENSE`.
- Dry-pack output for each targeted package includes `LICENSE`.
- Package versions and runtime entrypoints are unchanged.

### Scenarios

```gherkin
Given a package manifest lists "LICENSE" in files
When npm pack --dry-run --json is run for that package
Then the returned file list includes "LICENSE"
```

### Notes

- The package-local `LICENSE` must contain full Apache-2.0 text because the npm
  tarball is consumed outside the monorepo checkout.

## Story 2: Future Agent Catches License Drift

As a future agent,
I want structure tests to fail when a publishable JS package lists `LICENSE` but
does not contain the file,
so that release metadata drift is caught before publishing.

### Acceptance Criteria

- `pnpm test:structure` includes a guard for package-local license presence.
- The guard covers the same TS package inventory used for JS package metadata.

### Scenarios

```gherkin
Given an @onemem package manifest includes "LICENSE" in files
And the package directory has no LICENSE file
When pnpm test:structure runs
Then the structure test fails with the package path in the error
```

### Notes

- This story does not require broader npm publish validation.

## Open Questions

- None blocking for this release-readiness slice.
