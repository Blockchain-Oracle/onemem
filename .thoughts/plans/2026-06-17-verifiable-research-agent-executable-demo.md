# Plan: Verifiable Research Agent Executable Demo

Date: 2026-06-17

## Inputs

- Research:
  `.thoughts/research/2026-06-17-verifiable-research-agent-executable-demo.md`
- Spec:
  `.thoughts/specs/2026-06-17-verifiable-research-agent-executable-demo.md`
- Stories:
  `.thoughts/stories/2026-06-17-verifiable-research-agent-executable-demo.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Existing patterns:
  `demos/agent-sends-money` and `demos/switch-laptops`

## Assumptions

- Testnet writes are acceptable for live demo proof.
- Placeholder Walrus blob IDs plus hashes are acceptable when the proof boundary
  says plaintext/Walrus/Seal proof is out of scope.
- A funded testnet signer remains available through the existing
  `@onemem/sdk-ts/runtime` resolver.

## Open Questions

- Whether a future high-volume stress demo should write dozens of sessions and
  memory records remains separate from this executable v0.1 harness.

## Phase 1: Package And Model

### Goal

Create the private workspace package and deterministic research workflow model.

### Work

- Add package manifest and tsconfig.
- Add `src/trace-model.ts` with day-labeled calls, memory references, stable
  hashing, and proof boundaries.
- Add node:test model tests.

### Checks

- Package test.
- Typecheck.

### Acceptance Criteria Covered

- AC1, AC2.

### Stop Condition

The deterministic model proves continuity without network work.

## Phase 2: Testnet Trace Command

### Goal

Record the mocked workflow as real OneMem testnet traces.

### Work

- Add `src/mock-research-trace.ts`.
- Reuse `resolveNetwork`, `resolveSigner`, `ensureNamespace`, `OneMem`.
- Record three sessions under one namespace.
- Verify every session and write an artifact.
- Fail closed for non-testnet network selection.

### Checks

- `demo:trace --json`
- independent CLI `verify` for generated session IDs.

### Acceptance Criteria Covered

- AC5, AC6.

### Stop Condition

The artifact reports `ok: true` and all sessions independently verify.

## Phase 3: Docs, Guards, Verification

### Goal

Make the demo discoverable and prevent status drift.

### Work

- Rewrite demo README.
- Update demo matrix from pending to executable mocked testnet harness.
- Add structure tests for the new demo package files.
- Write verification audit and wiki updates.

### Checks

- `lint`
- `build`
- `pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

- AC3, AC4, AC7.

### Stop Condition

The slice is verified, committed, and pushed.

## Verification Checkpoint

Use `abu-context-engineering:verification-audit` before claiming the demo
complete.

## Handoff Notes

Do not claim real research, PDF ingestion, Hermes runtime execution, MemWal
semantic recall, Walrus plaintext, or Seal decrypt proof from this demo.

