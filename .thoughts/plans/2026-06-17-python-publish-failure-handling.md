# Plan: Python Publish Failure Handling

## Inputs

- Reality research:
  `.thoughts/research/2026-06-17-python-publish-failure-handling.md`
- Spec:
  `.thoughts/specs/2026-06-17-python-publish-failure-handling.md`
- Stories:
  `.thoughts/stories/2026-06-17-python-publish-failure-handling.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- PyPI duplicate handling and uv's `--check-url` option are enough to avoid
  needing a changeset metadata parser in this slice.
- A dry-run publish command is sufficient verification because real PyPI uploads
  would consume external release credentials and mutate registry state.

## Open Questions

- Trusted publishing migration is out of scope.

## Phase 1: Patch Publish Script

### Goal

Make Python publishing fail honestly and support dry-run verification.

### Work

- Edit `scripts/publish-all.sh`.
- Remove the `|| echo` skeleton fallback.
- Add `PUBLISH_ALL_DRY_RUN=1` handling that passes `--dry-run` to `uv publish`.
- Clean package-local `dist/` before `uv build`.
- Keep the six-package Python loop.

### Checks

- Text scan rejects old swallowed-error pattern.
- Dry-run script execution succeeds.

### Acceptance Criteria Covered

- R1-R4, AC1, AC2.

### Stop Condition

The script exits non-zero on command failure and can dry-run Python publish.

## Phase 2: Align Docs And Guards

### Goal

Keep release docs and structure checks aligned with actual automation.

### Work

- Update `.changeset/README.md`.
- Update `docs/05-our-architecture/00-overview/TOOLING_DECISIONS.md`.
- Add structure tests for:
  - no swallowed `uv publish` skeleton fallback;
  - dry-run publish wiring;
  - no current docs reference to missing `publish-python.py`;
  - CE artifact registration.

### Checks

- `pnpm test:structure`.

### Acceptance Criteria Covered

- R5-R8, AC3.

### Stop Condition

Structure tests pass and guard the corrected release path.

## Phase 3: Verification Audit

### Goal

Record evidence that script behavior, docs, and tests match the spec.

### Work

- Run dry-run publish command.
- Run structure and whitespace gates.
- Write verification audit.
- Update wiki index/status/log.

### Checks

- `PUBLISH_ALL_DRY_RUN=1 bash scripts/publish-all.sh python`
- `pnpm exec biome check tests/structure.test.ts`
- `pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

- AC2-AC4.

### Stop Condition

All gates pass and verification audit records evidence.

## Verification Checkpoint

Write:
`.thoughts/verification/2026-06-17-python-publish-failure-handling.md`.

## Handoff Notes

Do not publish or bump versions in this slice.
