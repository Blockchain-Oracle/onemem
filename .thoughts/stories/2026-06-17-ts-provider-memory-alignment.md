# Stories: TS Provider Memory Alignment

## Traceability

- Spec:
  `.thoughts/specs/2026-06-17-ts-provider-memory-alignment.md`
- Requirements: R1-R7.

## Story 1: Vercel AI Developer Uses Explicit OneMem Memory

As a Vercel AI SDK developer,
I want package docs to show the explicit OneMem memory helper,
so that I can recall memories before a model call and capture durable facts
afterward without guessing from source.

### Acceptance Criteria

- Covers R3, R5, AC1, AC2, AC3.
- README imports `createOneMemMemory`.
- README shows `recallInto(...)` and `capture(...)`.
- Unit tests cover both helper paths without network.

### Scenarios

- Given recalled memories exist,
  when `recallInto("what next?")` is called,
  then the returned prompt contains a "Relevant memories" context block.
- Given a memory recorder capture succeeds,
  when `capture("remember this")` is called,
  then the helper returns `true`.

### Notes

- This story is about explicit helper usage, not middleware-driven automatic
  memory extraction.

## Story 2: OpenAI Agents Developer Sees Accurate Memory Scope

As an OpenAI Agents SDK developer,
I want docs and comments to match the existing helper API,
so that I understand tracing is automatic through Runner events while memory
recall/capture is an explicit wrapper step.

### Acceptance Criteria

- Covers R2, R4, R5, AC1.
- README imports `createOneMemMemory`.
- README states verify/replay tools and automatic extraction are still
  follow-ups.

### Scenarios

- Given an OpenAI Agents app,
  when the developer reads the package README,
  then they can see the sequence: recall input, run agent, capture final output.

### Notes

- Existing OpenAI Agents tests already cover helper behavior.

## Story 3: Maintainer Catches Future Drift

As a OneMem maintainer,
I want Vercel provider memory helper behavior covered by tests and artifacts
registered in structure tests,
so that current-facing docs cannot drift silently again.

### Acceptance Criteria

- Covers R6, R7, AC2, AC3, AC5.
- `pnpm --filter @onemem/vercel-ai-provider test` covers memory helper paths.
- `pnpm test:structure` includes this artifact set.

### Scenarios

- Given a future edit removes `createOneMemMemory` behavior from Vercel provider,
  when package tests run,
  then the memory helper tests fail.

## Open Questions

- Whether to add live provider memory smoke later depends on stable credential
  management and cost boundaries.
