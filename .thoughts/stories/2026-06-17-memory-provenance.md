# Stories: Memory Provenance

## Traceability

- Spec: `.thoughts/specs/2026-06-17-memory-provenance.md`
- Research: `.thoughts/research/2026-06-17-memory-provenance.md`
- Prototype discovery: `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`

## Story 1: Search And Filter Memory Proof Metadata

As an agent operator,
I want to search and filter encrypted memory records by real provenance fields,
so that I can find the memory write I need without pretending plaintext search
is available.

### Acceptance Criteria

- Covers R2, R3, R4, and R7.
- Search checks blob ID, namespace ID, session ID, call ID, hashes, runtime/tool
  namespace, label, and captured address.
- Filter chips only represent data that exists in the current metadata.
- Empty and no-results states are distinct.

### Scenarios

- Given memory events exist, when I search by session ID or hash, then matching
  rows remain visible.
- Given I choose the "with blob" filter, when a memory lacks a Walrus blob, then
  it is excluded.
- Given a query has no matches, when the table renders, then I see a no-results
  state rather than the global empty state.

### Notes

This is metadata search, not MemWal semantic recall.

## Story 2: Inspect A Memory Provenance Drawer

As an auditor,
I want a selected memory's drawer to show the event receipt and related trace,
so that I can understand where the memory came from and how to verify it.

### Acceptance Criteria

- Covers R1, R5, and R6.
- The drawer lists event provenance and on-chain receipt fields from the selected
  memory.
- The drawer links to `/trace/[session_id]`.
- Related memories are derived from same session first, then same namespace.

### Scenarios

- Given I open a memory with a session ID, then I can navigate to its trace page.
- Given another memory shares the same session or namespace, then the drawer can
  show it as related metadata.

### Notes

Related memory rows are not semantic recommendations.

## Story 3: Understand Memory Proof Boundaries

As a demo viewer,
I want the Memories page to say what the proof does and does not prove,
so that I do not confuse encrypted metadata with visible plaintext.

### Acceptance Criteria

- Covers R4, R5, R6, and R7.
- The table and drawer use "anchored" or "chain event" language instead of
  claiming plaintext verification.
- The drawer states that plaintext, semantic correctness, and access history are
  not proven in this flow.
- Prototype-only mutation controls are absent or explicitly replaced with
  real CLI/SDK guidance.

### Scenarios

- Given I inspect a memory, when I read the proof copy, then I understand that
  OneMem has proof of an encrypted memory write anchored in a TraceSession.

### Notes

This mirrors the verifier honesty rule already applied to trace verification.

## Open Questions

- Whether lazy selected-session verification should become Story 4.
