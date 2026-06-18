# Plan: Codex Hook Matcher And Proof Boundary

## Inputs

- Reality research:
  `.thoughts/research/2026-06-18-codex-hook-proof-boundary.md`
- Spec:
  `.thoughts/specs/2026-06-18-codex-hook-proof-boundary.md`
- Stories:
  `.thoughts/stories/2026-06-18-codex-hook-proof-boundary.md`
- Current package:
  `packages/plugin-codex`
- Current runtime docs:
  `docs/03-target-runtimes/codex-cli-deep.md` and
  `docs/05-our-architecture/03-runtimes/codex-cli-integration.md`

## Assumptions

- The local plugin validator remains authoritative for this repo until updated.
- The existing Sui bootstrap trace is sufficient proof that the trace CLI can
  mint and verify a real OneMem trace.

## Open Questions

- Codex CLI 0.141 hook behavior is untested.
- Interactive `/hooks` proof still needs a TUI session.

## Phase 1: Matcher And Wording

### Goal

Make package behavior broad and docs honest.

### Work

- Keep `SessionStart` matcher empty in `hooks/hooks.json`.
- Rename unit test wording so it does not imply `codex exec` currently runs
  hooks.
- Patch docs to say `SessionStart` arms local state and `Stop` performs the
  trace CLI flush.
- Move Codex-specific matcher language out of the Claude Code section.

### Checks

- `mise exec -- pnpm --filter @onemem/codex-plugin test`
- Targeted Biome check.

### Acceptance Criteria Covered

- AC1, AC4.

### Stop Condition

- Package test and docs formatting pass.

## Phase 2: Structural Guards

### Goal

Prevent the same claim boundary regressions.

### Work

- Add structure tests for empty matcher, unsupported manifest `hooks` field, and
  README wording.
- Register the new CE artifacts in the context artifact shard.

### Checks

- `mise exec -- pnpm test:structure`
- Structure shard line-count guard.

### Acceptance Criteria Covered

- AC2, AC3.

### Stop Condition

- Structure tests pass with all shards under 300 lines.

## Verification Checkpoint

Run plugin unit tests, plugin validation, targeted docs lint, structure tests,
and `git diff --check`. Record evidence in a verification audit before commit.

## Handoff Notes

The remaining proof is interactive trusted Codex `/hooks` execution into a real
OneMem `TraceSession`. Do not substitute `codex exec` on CLI 0.140 for that
proof.
