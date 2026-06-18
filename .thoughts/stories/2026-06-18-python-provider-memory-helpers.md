# Stories: Python Provider Memory Helpers

## Traceability

- Spec:
  `.thoughts/specs/2026-06-18-python-provider-memory-helpers.md`
- Requirements: R1-R8.
- Acceptance criteria: AC1-AC5.

## Story 1: CrewAI Explicit Recall And Capture

As a CrewAI developer,
I want an explicit OneMem memory helper,
so that I can recall context before `crew.kickoff()` and capture the result
afterwards without waiting for full CrewAI memory-provider registration.

### Acceptance Criteria

- Covers R1-R6 and AC1.
- `create_onemem_memory(...).recall_context("question")` formats recalled hits.
- `capture("answer")` returns `True` only when the memory bridge succeeds.

### Scenarios

- Given two recalled memories, when recall context is requested, then the helper
  returns a context-prefixed prompt.
- Given the memory bridge fails, when recall or capture is called, then the
  helper does not raise into the CrewAI workflow.

### Notes

- This does not implement CrewAI `memory_config={"provider": "onemem"}`.

## Story 2: Voice Provider Memory Context

As a LiveKit or ElevenLabs voice-agent developer,
I want a short context block from prior memories,
so that I can inject it into my agent prompt without adding framework-specific
adapter code.

### Acceptance Criteria

- Covers R1-R6 and AC1.
- LiveKit and ElevenLabs packages both export `create_onemem_memory`.
- Empty, disabled, or failed recall returns the input unchanged.

### Scenarios

- Given no memories match, when recall context is requested, then the original
  user text is returned unchanged.
- Given capture is disabled, when capture is called, then it returns `False`.

### Notes

- This does not implement LiveKit or ElevenLabs framework memory subclasses.

## Story 3: Honest Provider Status

As a OneMem maintainer,
I want docs to say exactly what shipped,
so that future agents do not treat Python memory helpers as both deferred and
complete.

### Acceptance Criteria

- Covers R7-R8 and AC4-AC5.
- Framework overview and package READMEs describe explicit helpers as shipped.
- Architecture docs still reserve automatic/native integrations for later work.

### Scenarios

- Given a future docs audit, when it scans the provider overview, then it does
  not find Python memory helpers listed as deferred.

### Notes

- Registry publication remains a separate credential-bound slice.

## Open Questions

- None blocking this explicit-helper slice.
