# Plan: Multi-Agent Coordination Executable Demo

Date: 2026-06-17

## Inputs

- Research:
  `.thoughts/research/2026-06-17-multi-agent-coordination-executable-demo.md`
- Spec:
  `.thoughts/specs/2026-06-17-multi-agent-coordination-executable-demo.md`
- Stories:
  `.thoughts/stories/2026-06-17-multi-agent-coordination-executable-demo.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Existing demo patterns:
  `demos/agent-sends-money`, `demos/switch-laptops`, and
  `demos/verifiable-research-agent`.

## Assumptions

- Testnet writes are acceptable for live proof.
- Placeholder Walrus blob IDs are acceptable when the proof boundary says
  plaintext/Walrus/Seal proof is out of scope.
- The available testnet signer has enough gas for three sessions plus calls.

## Open Questions

- True cross-session dashboard tree rendering remains a separate future slice.

## Phase 1: Package And Deterministic Model

### Goal

Create the private workspace package and deterministic multi-agent workflow
model.

### Work

- Add package manifest and tsconfig.
- Add `src/trace-model.ts` with orchestrator calls, specialist calls, stable
  hashing, report references, and proof boundaries.
- Add node:test coverage for call ordering, report hashes, and parent-link
  expectations.

### Checks

- Package test.
- Package typecheck.

### Acceptance Criteria Covered

- AC1, AC2.

### Stop Condition

The deterministic model proves the intended composition shape without network
work.

## Phase 2: Testnet Trace Command

### Goal

Record the mocked multi-agent workflow as real OneMem testnet traces.

### Work

- Add `src/mock-multi-agent-trace.ts`.
- Reuse `resolveNetwork`, `resolveSigner`, `ensureNamespace`, and `OneMem`.
- Create orchestrator, Hermes market specialist, and CrewAI risk specialist
  sessions in one namespace.
- Seed specialist first calls with orchestrator delegate call IDs.
- Verify all sessions and write the JSON artifact.
- Fail closed for non-testnet network selection.

### Checks

- Negative `--network mainnet` guard.
- Live `demo:trace --json`.
- Independent CLI verification for generated session IDs.

### Acceptance Criteria Covered

- AC5, AC6, AC7.

### Stop Condition

The artifact reports `ok: true`, cross-runtime link parent IDs match, and the
CLI independently verifies every generated session.

## Phase 3: Docs, Guards, Wiki, Verification

### Goal

Make the demo discoverable and prevent status drift.

### Work

- Rewrite demo README.
- Update demo matrix and architecture demo caveat.
- Add structure tests for package files and CE artifacts.
- Update wiki index/project map/log.
- Write verification audit.

### Checks

- Package lint.
- Package build.
- `pnpm test:structure`.
- `git diff --check`.

### Acceptance Criteria Covered

- AC3, AC4, AC8.

### Stop Condition

The slice is verified, committed, and pushed.

## Verification Checkpoint

Use `abu-context-engineering:verification-audit` before claiming completion.

## Handoff Notes

Do not claim real Claude Code hooks, Hermes, CrewAI, LangGraph, parallel
execution, MemWal semantic recall, Walrus plaintext, Seal decrypt, or a finished
cross-session dashboard tree from this demo.
