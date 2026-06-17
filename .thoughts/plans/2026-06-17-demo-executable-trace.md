# Plan: Executable Demo Trace

## Inputs

- Reality research:
  `.thoughts/research/2026-06-17-demo-executable-trace.md`
- Spec:
  `.thoughts/specs/2026-06-17-demo-executable-trace.md`
- Stories:
  `.thoughts/stories/2026-06-17-demo-executable-trace.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Prototype discovery:
  `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`

## Assumptions

- Testnet trace writes are acceptable for demo proof.
- Payment execution is deliberately mocked; moving real assets is out of scope.
- Placeholder Walrus IDs are acceptable for the first executable demo as long as
  proof boundaries are explicit.

## Open Questions

- Whether a later slice should add a WAL-funded Walrus content variant.

## Phase 1: Repair Generic SDK Smoke

### Goal

Make `scripts/sdk-smoke-testnet.ts` compile and run against the current SDK
trace API.

### Work

- Replace stale `openSession`, `emitCall`, and `closeSession` usage with
  `startSession`, `appendCall`, `closeCall`, and `endSession`.
- Preserve current live-testnet behavior and output.

### Checks

- `pnpm exec tsx scripts/sdk-smoke-testnet.ts`

### Acceptance Criteria Covered

- AC5.

### Stop Condition

The script creates and verifies a live testnet session.

## Phase 2: Add Agent Sends Money Demo Package

### Goal

Provide an executable demo command that writes a real trace for mocked payment
tool calls.

### Work

- Add `demos/agent-sends-money/package.json` and `tsconfig.json`.
- Add source helpers and CLI entrypoint.
- Add unit tests for call model and hashes.
- Update demo README with run commands and proof boundaries.

### Checks

- `pnpm --filter @onemem/demo-agent-sends-money test`
- `pnpm --filter @onemem/demo-agent-sends-money typecheck`
- `pnpm --filter @onemem/demo-agent-sends-money lint`
- `pnpm --filter @onemem/demo-agent-sends-money demo:trace --json`

### Acceptance Criteria Covered

- AC1, AC2, AC3, AC6.

### Stop Condition

The demo command creates and verifies a live testnet session and writes a JSON
run artifact.

## Phase 3: Guard And Document Demo Status

### Goal

Make the executable demo visible to maintainers and prevent silent removal.

### Work

- Update the Pillar 11 demo status table.
- Add structure-test assertions for the demo package.
- Add verification audit and wiki/project-map note.

### Checks

- `pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

- AC4 and AC7.

### Stop Condition

Docs and structure tests both reflect the executable demo surface.

## Verification Checkpoint

Write
`.thoughts/verification/2026-06-17-demo-executable-trace.md`
before claiming the slice done.

## Handoff Notes

Do not claim real payment execution, Walrus plaintext storage, MemWal memory
recall, or trusted runtime hook capture from this slice.
