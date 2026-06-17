# Plan: Switch Laptops Executable Demo

## Inputs

- Research:
  `.thoughts/research/2026-06-17-switch-laptops-executable-demo.md`
- Spec:
  `.thoughts/specs/2026-06-17-switch-laptops-executable-demo.md`
- Stories:
  `.thoughts/stories/2026-06-17-switch-laptops-executable-demo.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Existing demo pattern:
  `demos/agent-sends-money`

## Assumptions

- Testnet writes are acceptable for live proof.
- Placeholder Walrus blob IDs are acceptable if proof boundaries are explicit.
- Same-namespace continuity is enough for the first executable switch-laptops
  slice; real cross-device/real-hook proof is a later layer.

## Open Questions

- Whether final recording needs real MemWal recall after this deterministic
  trace proof lands.

## Phase 1: Add Demo Package

### Goal

Create the `@onemem/demo-switch-laptops` workspace package.

### Work

- Add `demos/switch-laptops/package.json`.
- Add `demos/switch-laptops/tsconfig.json`.
- Add pure model helpers for Laptop A and Laptop B calls.
- Add model tests.

### Checks

- `pnpm --filter @onemem/demo-switch-laptops test`
- `pnpm --filter @onemem/demo-switch-laptops typecheck`
- `pnpm --filter @onemem/demo-switch-laptops lint`

### Acceptance Criteria Covered

- AC1, AC2, AC3.

### Stop Condition

The package passes local unit/type/lint checks.

## Phase 2: Add Live Testnet Trace Command

### Goal

Make one command write and verify the same-namespace two-session trace.

### Work

- Add `src/mock-switch-trace.ts`.
- Reuse `resolveSigner`, `resolveNetwork`, `ensureNamespace`, and `OneMem`.
- Start and end a Laptop A session with context-capture calls.
- Start and end a Laptop B session with recall/answer calls.
- Verify both sessions and write `out/latest-trace.json`.

### Checks

- `pnpm --filter @onemem/demo-switch-laptops demo:trace --json`
- CLI `verify` for both resulting session IDs.
- CLI `trace events` for both resulting session IDs.

### Acceptance Criteria Covered

- AC4, AC5.

### Stop Condition

Both live sessions verify and show expected tool names.

## Phase 3: Guard And Document

### Goal

Make the executable demo visible and durable.

### Work

- Update `demos/switch-laptops/README.md`.
- Update `docs/05-our-architecture/08-demos-and-tests/README.md`.
- Add switch-laptops to structure-test executable demo guard.
- Update project map and context status.
- Write verification audit.

### Checks

- `pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

- AC6, AC7.

### Stop Condition

Docs, guardrails, and verification artifact reflect the new executable demo.

## Verification Checkpoint

Write
`.thoughts/verification/2026-06-17-switch-laptops-executable-demo.md`
before claiming completion.

## Handoff Notes

Do not claim real cross-device login, real Claude/Hermes hooks, real MemWal
recall, Walrus plaintext availability, or Seal decryptability from this slice.
