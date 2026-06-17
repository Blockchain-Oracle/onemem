# Plan: CLI Command Surface Refresh

## Inputs

- Research:
  `.thoughts/research/2026-06-17-cli-command-surface-refresh.md`
- Spec:
  `.thoughts/specs/2026-06-17-cli-command-surface-refresh.md`
- Stories:
  `.thoughts/stories/2026-06-17-cli-command-surface-refresh.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- `packages/cli-ts/src/index.ts` is the authoritative TS command registry.
- `packages/cli-python/onemem_cli/main.py` is the authoritative Python command
  registry.
- This slice is docs/status cleanup.

## Open Questions

- None blocking.

## Phase 1: Refresh CLI Docs

### Goal

Make current-facing CLI docs match the shipped command surface.

### Work

- Update `docs/05-our-architecture/05-cli/README.md` implementation status.
- Rewrite `docs/05-our-architecture/05-cli/command-surface.md` around the
  current TS CLI and Python read-only mirror.
- Refresh `packages/cli-ts/README.md`, `apps/docs/reference/cli.mdx`, and TS
  CLI help text so namespace commands, signer prerequisites, and `local`
  network support match code.

### Checks

- Targeted `rg` for stale pending/current command headings.

### Acceptance Criteria Covered

R1, R2, R3, R5, AC3.

### Stop Condition

Docs no longer advertise deferred commands as current commands.

## Phase 2: Add Guard

### Goal

Prevent the stale planned command surface from returning silently.

### Work

- Add a structure test rejecting known deferred commands as current headings.
- Add a structure test ensuring current-facing docs expose namespace commands
  and `local`.
- Register the new Context Engineering artifacts in structure tests.

### Checks

- `pnpm test:structure`

### Acceptance Criteria Covered

R4, R5, AC1.

### Stop Condition

Structure tests pass and include the new guard.

## Phase 3: Verification

### Goal

Record evidence and update durable status.

### Work

- Add verification audit.
- Update wiki index/status/log.

### Checks

- `pnpm test:structure`
- `pnpm --filter @onemem/cli test`
- `pnpm --filter @onemem/cli typecheck`
- `pnpm --filter @onemem/cli build`
- `pnpm --filter @onemem/cli lint`
- `git diff --check`

### Acceptance Criteria Covered

R5, AC2, AC4.

### Stop Condition

Verification audit has pass/fail evidence and residual risk.

## Verification Checkpoint

Write `.thoughts/verification/2026-06-17-cli-command-surface-refresh.md` before
claiming this slice complete.

## Handoff Notes

Do not implement deferred commands in this slice. If a later slice wants
`onemem dashboard`, runtime installers, replay, or export, write separate
research/spec/plan first.
