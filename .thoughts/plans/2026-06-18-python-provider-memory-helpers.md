# Plan: Python Provider Memory Helpers

## Inputs

- Reality research:
  `.thoughts/research/2026-06-18-python-provider-memory-helpers.md`
- Spec:
  `.thoughts/specs/2026-06-18-python-provider-memory-helpers.md`
- Stories:
  `.thoughts/stories/2026-06-18-python-provider-memory-helpers.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current repo state on branch `pillar-3-plugins`.

## Assumptions

- Explicit helper parity is acceptable for v0.1 because TypeScript providers use
  the same explicit memory boundary.
- Tests should inject fake memory clients and avoid live MemWal writes.
- `onemem-sdk-python` is the correct dependency for provider memory helpers.

## Open Questions

- None blocking this slice.

## Phase 1: Shared Helper Pattern

### Goal

Define a small explicit memory helper API in each Python provider package.

### Work

- Add provider-local `memory.py` modules.
- Use `onemem.memory.MemoryClient` by default.
- Export `create_onemem_memory` from each provider package.

### Checks

- Provider package unit tests.
- Python typecheck for affected packages.

### Acceptance Criteria Covered

- AC1, AC2, AC3.

### Stop Condition

- Each provider helper supports recall, recall context, and capture with
  injected fake-client tests.

## Phase 2: Package Dependencies And Docs

### Goal

Make installed packages resolve the helper dependency and update current docs.

### Work

- Add `onemem-sdk-python` dependency to affected Python provider packages.
- Update provider READMEs and framework overview.
- Update structure docs test to guard the new current boundary.
- Register CE artifacts in `tests/structure/context-artifacts.test.ts`.

### Checks

- Structure tests.
- Python lint/typecheck.

### Acceptance Criteria Covered

- AC4, AC5.

### Stop Condition

- Docs no longer call Python explicit memory helpers deferred, while still
  reserving automatic/native framework integrations for future work.

## Phase 3: Verification

### Goal

Prove the implementation matches the spec and does not weaken existing gates.

### Work

- Run affected Python package tests.
- Run Python lint/typecheck for affected packages.
- Run structure tests.
- Run package build checks if dependency metadata changes.
- Write verification audit.

### Checks

- `mise exec -- uv run pytest packages/provider-crewai packages/provider-livekit packages/provider-elevenlabs`
- `mise exec -- uv run ruff check packages/provider-crewai packages/provider-livekit packages/provider-elevenlabs`
- `mise exec -- uv run pyright packages/provider-crewai packages/provider-livekit packages/provider-elevenlabs`
- `mise exec -- pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

- AC1-AC5.

### Stop Condition

- Verification audit has pass/conditional-pass evidence and remote CI is green
  after push.

## Verification Checkpoint

Use the `verification-audit` skill before claiming completion.

## Handoff Notes

Do not claim CrewAI `memory_config`, LiveKit memory subclassing, or ElevenLabs
native memory adapter support. This slice ships explicit helpers only.
