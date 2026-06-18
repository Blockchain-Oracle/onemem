# Spec: Python Provider Memory Helpers

## Objective

Expose explicit memory recall/capture helpers in the Python CrewAI, LiveKit, and
ElevenLabs providers, backed by the existing `onemem-sdk-python` `MemoryClient`,
without claiming full automatic provider memory integration.

## Background And Current Reality

The TypeScript Vercel AI and OpenAI Agents providers already expose explicit
`createOneMemMemory(...)` helpers. The Python providers currently ship
trace-only wrappers and their docs say memory recall/capture remains follow-up
work. The Python SDK has a tested `MemoryClient` bridge for MemWal add/search.

## Users

- Python CrewAI developers who want explicit memory recall before kickoff and
  capture after results.
- Python voice-agent developers using LiveKit or ElevenLabs who want a small
  context block from prior conversations and a defensive capture helper.
- OneMem maintainers who need current docs to distinguish shipped helpers from
  deferred automatic integrations.

## Goals

- Add explicit, testable helper APIs to all three Python provider packages.
- Keep memory failures non-fatal to host framework execution.
- Reuse `onemem-sdk-python` instead of duplicating bridge code.
- Update docs/status so the shipped helper boundary is current.

## Non-goals

- Do not implement CrewAI provider entry-point registration or
  `memory_config={"provider": "onemem"}`.
- Do not implement LiveKit or ElevenLabs framework memory subclasses/adapters.
- Do not add automatic memory extraction from trace callbacks.
- Do not perform live MemWal writes during tests.

## Requirements

- R1: Each Python provider package exports `create_onemem_memory`.
- R2: The returned helper supports `recall(query, top_k=...)`,
  `recall_context(query, top_k=...)`, and `capture(text)`.
- R3: `recall` returns a list of memory hits from `MemoryClient.search(...)`.
- R4: `recall_context` formats hits into a concise context block and returns
  the original input unchanged when memory is disabled, failed, or empty.
- R5: `capture` calls `MemoryClient.add(...)` and returns `True` on success,
  `False` on disabled or failed memory writes.
- R6: Helpers accept injected `MemoryClient` instances for tests and custom
  bridge configuration for users.
- R7: Provider docs state explicit memory helpers are shipped and automatic
  framework memory integration remains deferred.
- R8: Structure/docs tests no longer describe Python memory helpers as deferred.

## Acceptance Criteria

- AC1: Unit tests cover recall formatting, capture success, disabled mode, and
  failure swallowing for each provider package.
- AC2: Python provider package tests pass.
- AC3: Python lint/typecheck for affected packages pass.
- AC4: Structure tests pass and guard the new docs boundary.
- AC5: No docs claim CrewAI `memory_config`, LiveKit memory subclassing, or
  ElevenLabs memory adapter support has shipped.

## Constraints

- Keep files under the repository source line cap.
- Use ASCII unless editing existing non-ASCII prose.
- Use mocked `MemoryClient` behavior in tests.
- Keep host-framework dependencies optional; provider packages should not import
  CrewAI, LiveKit, or ElevenLabs at module import time.

## Stories Needed

- CrewAI explicit memory helper.
- Voice-agent context helper for LiveKit and ElevenLabs.
- Docs/status boundary update.

## Open Questions

- Should a later v0.2 slice implement CrewAI `memory_config` via official entry
  points after current CrewAI docs are rechecked?
- Should LiveKit/ElevenLabs memory adapters share a common package once their
  framework-native APIs are implemented?

## Source References

- `.thoughts/research/2026-06-18-python-provider-memory-helpers.md`
- `packages/sdk-python/onemem/memory.py`
- `packages/provider-openai-agents/src/index.ts`
- `packages/provider-vercel-ai/src/index.ts`
- `docs/04-framework-providers/README.md`
