# Plan: Architecture Reference Alignment

## Inputs

- Reality research:
  `.thoughts/research/2026-06-18-architecture-reference-alignment.md`
- Previous architecture status refresh:
  `.thoughts/research/2026-06-18-architecture-status-refresh.md`
- Current architecture docs and structure test coverage.

## Assumptions

- The already refreshed architecture overview, protocol README, and SDK README
  are the current source of truth for this slice.
- Deep future-work rows such as mainnet deployment, PyPI publication, marketing,
  and stretch vision should remain pending where they are accurate.

## Open Questions

- None blocking this small docs-alignment slice.

## Phase 1: Update Reference Claims

### Goal

Remove stale "architecture not started" language from reference surfaces.

### Work

- Update `docs/06-references/CANONICAL_URLS.md`.
- Update `.thoughts/wiki/project-map.md`.

### Checks

- Targeted search for the old stale phrases.

### Acceptance Criteria Covered

- Readers no longer get routed to a false design-phase/not-started summary.

### Stop Condition

- Canonical/reference wording points to current scoped status instead.

## Phase 2: Add Regression Guard

### Goal

Prevent the stale reference wording from returning.

### Work

- Extend `tests/structure/architecture-status.test.ts`.

### Checks

- Run the targeted architecture-status structure test.
- Run full `pnpm test:structure`.
- Confirm structure shard line counts stay under the 300-line cap.

### Acceptance Criteria Covered

- Stale canonical/reference status claims are guarded by a test.

### Stop Condition

- Local gates pass and verification is recorded.

## Verification Checkpoint

Write a verification audit before committing, including commands, results, and
any intentionally preserved pending rows.

## Handoff Notes

This slice is documentation/status alignment only. It should not broaden into
registry publishing, mainnet deployment, or UI changes.
