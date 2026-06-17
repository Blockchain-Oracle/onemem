# Stories: Python Package License Inclusion

## Traceability

- Spec: `.thoughts/specs/2026-06-17-python-package-license-inclusion.md`
- Research: `.thoughts/research/2026-06-17-python-package-license-inclusion.md`
- Requirements: R1-R10
- Acceptance criteria: AC1-AC5

## Story 1: Maintainer Verifies PyPI License Artifacts

As a maintainer,
I want every OneMem Python wheel and sdist to include license text,
so that PyPI release artifacts match their Apache-2.0 metadata.

### Acceptance Criteria

- All six Python package directories contain package-local `LICENSE` files.
- `uv build` succeeds for all six packages.
- Archive inspection finds `LICENSE` entries in each wheel and sdist.

### Scenarios

```gherkin
Given a OneMem Python package declares Apache-2.0 metadata
When its wheel and sdist are built
Then both artifacts include a LICENSE archive entry
```

### Notes

- Metadata-only `License: Apache-2.0` is not enough for this story.

## Story 2: Future Agent Catches Python License Drift

As a future agent,
I want structure tests to fail when a Python package lacks package-local
license text,
so that release artifact hygiene remains visible before PyPI publishing.

### Acceptance Criteria

- `pnpm test:structure` checks Python package-local `LICENSE` files.
- The guard verifies the files contain Apache-2.0 text.

### Scenarios

```gherkin
Given a Python package pyproject declares Apache-2.0
And the package directory has no LICENSE file
When pnpm test:structure runs
Then the structure test fails with the package path in the error
```

### Notes

- The guard complements, but does not replace, archive inspection.

## Open Questions

- None blocking for this slice.
