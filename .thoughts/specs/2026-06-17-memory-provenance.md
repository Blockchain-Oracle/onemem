# Spec: Memory Provenance

## Objective

Upgrade the dashboard Memories surface from a minimal encrypted-memory list to a
read-only provenance explorer over real on-chain `memwal_write` events.

## Background And Current Reality

The One Mem 2 prototype shows memories as encrypted facts with provenance,
proof metadata, related memories, and activity context. Current production code
already lists memory metadata from `ActionCallEmittedEvent` rows, but only shows
blob, namespace, content hash, and a short on-chain receipt. The contract event
contains richer provenance that the UI does not currently expose.

## Users

- Agent operators inspecting what their runtimes wrote to memory.
- Auditors checking whether a memory write is anchored to a trace session.
- Demo viewers who need to understand that memory plaintext is encrypted while
  proof metadata remains verifiable.

## Goals

- Expose all relevant `memwal_write` event provenance already available from Sui.
- Improve search and filters using real metadata fields.
- Make the drawer a proof-focused memory receipt with clear "proves / does not
  prove" copy.
- Link each memory to its canonical trace/session and Sui transaction/object
  views where possible.
- Avoid fake mutation actions from the prototype.

## Non-goals

- Do not implement add/edit/delete/move-tier actions in the dashboard.
- Do not invent memory class, tier, app name, or access-log data when it is not
  present on chain.
- Do not decrypt memory plaintext.
- Do not call every session verifier on page load.

## Requirements

- R1: Memory inventory must include richer event provenance: session, namespace,
  call ID, parent call, tool name, tool namespace, Walrus blob, input hash,
  content hash, previous hash, session Merkle root after the call, captured-by
  address, captured time, event timestamp, transaction digest, and label.
- R2: `/memories` must search across provenance fields, not only blob,
  namespace, and content hash.
- R3: `/memories` must provide honest filters for all memories, memories with a
  Walrus blob, memories without a blob, recent memories, and the active
  namespace when configured.
- R4: The table must show runtime/provenance context and proof status without
  implying plaintext verification.
- R5: The drawer must show memory proof metadata, on-chain receipt fields,
  same-session or same-namespace related memory links, and canonical trace links.
- R6: The UI must state that the flow proves a chain-anchored encrypted memory
  write, not plaintext, semantic correctness, or access history.
- R7: Empty/error/no-search-results states must remain explicit.

## Acceptance Criteria

- AC1: With memory events, `/memories` renders searchable rows with runtime,
  namespace/session context, and proof status.
- AC2: Clicking a memory opens a drawer with event provenance and on-chain
  receipt fields sourced from the selected memory row.
- AC3: Drawer trace links point to `/trace/[session_id]`; Sui links use current
  network URLs.
- AC4: Search and filters produce deterministic client-side results over the
  provided metadata.
- AC5: No UI action claims to add, edit, delete, decrypt, or semantically search
  memories unless backed by real functionality.
- AC6: Focused dashboard typecheck/test/lint/build and structure checks pass.
- AC7: The affected route is browser or HTTP-render checked with representative
  data.

## Constraints

- Use Next.js App Router in `packages/dashboard`.
- Keep files under the repository hard cap and split client UI if needed.
- Preserve the read-only trust model for this pass.
- Keep plaintext out of server responses.

## Stories Needed

- Story 1: Search and filter memory proof metadata.
- Story 2: Inspect a memory provenance drawer.
- Story 3: Understand memory proof boundaries.

## Open Questions

- Should future drawer opening trigger lazy session verification for the selected
  session?
- Should MemWal semantic recall appear as a separate credential-gated control?

## Source References

- `.thoughts/research/2026-06-17-memory-provenance.md`
- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- `/Users/abu/Downloads/One Mem 2/Memories.html`
