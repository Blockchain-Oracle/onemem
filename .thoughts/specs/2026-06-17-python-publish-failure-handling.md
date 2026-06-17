# Spec: Python Publish Failure Handling

## Objective

Make Python package publishing fail honestly in release automation, while
keeping a non-uploading dry-run path for verification and aligning release docs
with the actual script.

## Background And Current Reality

The release workflow calls `scripts/publish-all.sh python` with
`UV_PUBLISH_TOKEN` after Changesets publishes npm packages. The script currently
wraps `uv build && uv publish` in `|| echo`, so PyPI upload failures can become
successful release runs. Docs also describe a missing `publish-python.py` script
and changeset-note parsing that does not exist.

Source:
`.thoughts/research/2026-06-17-python-publish-failure-handling.md`.

## Users

- Maintainers cutting releases.
- Future agents reading release status from CI.
- Package consumers expecting PyPI packages to publish when CI says release
  succeeded.

## Goals

- Remove swallowed Python publish failures.
- Keep Python package builds clean per package before publishing.
- Add an explicit dry-run mode for local verification without uploading.
- Keep duplicate-upload behavior compatible with PyPI and configurable for other
  registries through uv's existing environment/options.
- Add structure tests that guard against reintroducing swallowed publish errors.
- Align release docs with the actual script.

## Non-goals

- Do not publish to PyPI.
- Do not bump package versions.
- Do not implement a changeset metadata parser in this slice.
- Do not change npm/Changesets publishing behavior.

## Requirements

- R1: `scripts/publish-all.sh` must not swallow `uv publish` failures.
- R2: The Python publish path must remove package-local `dist/` before building
  to avoid stale artifacts.
- R3: The script must support a dry-run mode that passes `--dry-run` to
  `uv publish`.
- R4: The script must keep publishing all six Python packages in python/all
  modes.
- R5: Structure tests must reject the old `uv publish || echo` skeleton pattern.
- R6: Release docs must refer to `scripts/publish-all.sh` instead of missing
  `scripts/publish-python.py`.
- R7: Release docs must not claim changeset-note metadata parsing exists.
- R8: Context Engineering artifacts must be registered in structure tests.

## Acceptance Criteria

- AC1: A script text check shows no `uv publish ||` or skeleton publish fallback.
- AC2: `PUBLISH_ALL_DRY_RUN=1 bash scripts/publish-all.sh python` builds all
  six Python packages and runs `uv publish --dry-run` without uploading.
- AC3: `pnpm test:structure` passes with release-script guards.
- AC4: `git diff --check` passes.

## Constraints

- Preserve unrelated dirty worktree changes.
- Do not require live PyPI credentials for verification.
- Keep release script shell-only and dependency-free.

## Stories Needed

- Maintainer sees CI fail when a Python upload fails.
- Future agent dry-runs Python publishing without uploading.
- Future agent reads docs that match the actual release script.

## Open Questions

- Trusted publishing migration is deferred.

## Source References

- `.thoughts/research/2026-06-17-python-publish-failure-handling.md`
- `scripts/publish-all.sh`
- `.github/workflows/release.yml`
- `.changeset/README.md`
- `docs/05-our-architecture/00-overview/TOOLING_DECISIONS.md`
- `tests/structure.test.ts`
