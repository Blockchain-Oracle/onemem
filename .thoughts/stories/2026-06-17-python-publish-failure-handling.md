# Stories: Python Publish Failure Handling

## Traceability

- Spec: `.thoughts/specs/2026-06-17-python-publish-failure-handling.md`
- Research: `.thoughts/research/2026-06-17-python-publish-failure-handling.md`
- Requirements: R1-R8
- Acceptance criteria: AC1-AC4

## Story 1: Maintainer Gets Honest PyPI Release Failure

As a maintainer,
I want Python publish failures to fail the release job,
so that CI does not claim a successful release when PyPI artifacts were not
uploaded.

### Acceptance Criteria

- The publish script no longer has a fallback that echoes success after
  `uv publish` fails.
- Structure tests guard against the old swallowed-error pattern.

### Scenarios

```gherkin
Given uv publish exits non-zero
When scripts/publish-all.sh python runs in release mode
Then the script exits non-zero
And the release job fails
```

### Notes

- This story does not require running a real failed PyPI upload.

## Story 2: Future Agent Dry-runs Python Publishing

As a future agent,
I want a dry-run mode for Python publishing,
so that package build and publish-command wiring can be verified without
uploading to PyPI.

### Acceptance Criteria

- `PUBLISH_ALL_DRY_RUN=1 bash scripts/publish-all.sh python` invokes
  `uv publish --dry-run`.
- The dry-run path builds all six Python packages.

### Scenarios

```gherkin
Given PUBLISH_ALL_DRY_RUN=1
When scripts/publish-all.sh python runs
Then each Python package is built
And uv publish is invoked with --dry-run
```

### Notes

- Build outputs may be created in each package `dist/` during the dry run.

## Story 3: Release Docs Match Reality

As a future agent,
I want release docs to name the real Python publish script and behavior,
so that I do not chase nonexistent tooling.

### Acceptance Criteria

- Docs reference `scripts/publish-all.sh python`.
- Docs do not claim changeset-note parsing exists.
- Docs do not reference missing `scripts/publish-python.py`.

### Scenarios

```gherkin
Given a future agent reads release docs
When they look for the Python publish path
Then they find scripts/publish-all.sh python
And no missing publish-python.py reference is presented as current
```

### Notes

- A real changeset parser can be designed later if Python selective publishing
  becomes necessary.

## Open Questions

- None blocking for this slice.
