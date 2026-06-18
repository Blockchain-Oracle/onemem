# Plan: Registry-Aware Current Docs

## Inputs

- Registry research:
  `.thoughts/research/2026-06-18-registry-aware-current-docs.md`
- Existing registry preflight:
  `.thoughts/research/2026-06-18-registry-publication-preflight.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current package READMEs and public docs.

## Assumptions

- This is a docs/context-only change.
- Target install commands may remain visible if they are clearly marked as
  target/current-source paths and not as proven registry availability.

## Open Questions

- Exact npm/PyPI credential owner remains outside this slice.

## Phase 1: Patch Package READMEs

### Goal

Mark missing/drifted packages without removing source API examples.

### Work

- Add publication notes to CLI, dashboard, Python CLI/SDK, provider, Hermes,
  and Claude plugin READMEs.
- Keep current package README APIs as source truth.

### Checks

- Structure docs tests.
- Biome formatting on touched docs/tests.

### Acceptance Criteria Covered

- Requirements 1, 2, and 3.

### Stop Condition

Every missing/drifted package README touched by this slice states the registry
boundary.

## Phase 2: Patch Public Docs

### Goal

Prevent public quickstart/runtime/provider docs from overclaiming registry
availability.

### Work

- Add publication notes to public quickstart, CLI reference, runtime docs, and
  provider docs.
- Refresh architecture status summaries around runtime/framework registry
  evidence.

### Checks

- `pnpm test:structure`

### Acceptance Criteria Covered

- Requirements 1, 2, 3, and 4.

### Stop Condition

Public docs include registry-status language near install examples.

## Phase 3: Guard And Verify

### Goal

Make the warning boundary durable.

### Work

- Add structure tests for package/public docs publication notes.
- Register Context Engineering artifacts.
- Write verification audit.

### Checks

- `pnpm test:structure`
- `pnpm exec biome check` on touched docs/tests/context artifacts
- `git diff --check`

### Acceptance Criteria Covered

- Requirement 5.

### Stop Condition

All checks pass and verification evidence is recorded.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-18-registry-aware-current-docs.md` before
claiming this slice done.

## Handoff Notes

This does not solve publication. The follow-up remains configuring npm/PyPI auth
or trusted publishing and rerunning `pnpm registry:status -- --strict` after
publish.
