# Reality Research: Memory Provenance

## Scope

Inspect the current dashboard Memories route, data helpers, Move event schema,
and One Mem 2 prototype to identify the real gap around memory provenance before
planning implementation.

## Sources Checked

- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- `/Users/abu/Downloads/One Mem 2/Memories.html`
- `packages/dashboard/app/memories/page.tsx`
- `packages/dashboard/app/memories/MemoriesView.tsx`
- `packages/dashboard/app/api/memories/route.ts`
- `packages/dashboard/lib/memory.ts`
- `packages/dashboard/lib/trace.ts`
- `packages/dashboard/styles/dash.css`
- `contracts/onemem/sources/events.move`
- `contracts/onemem/sources/trace.move`
- `packages/sdk-ts/src/memory.ts`
- `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Verified Facts

- The prototype Memories screen presents search, chips, a table, bulk bar, add
  modal, memory detail drawer, provenance, on-chain IDs, related memories, and an
  access log.
- The current dashboard `/memories` route reads real memory metadata through
  `fetchMemories(undefined, 200)` and renders a search box, table, and detail
  drawer.
- `packages/dashboard/lib/memory.ts` derives memory inventory from on-chain
  `ActionCallEmittedEvent` rows where `tool_name === "memwal_write"`.
- MemWal 0.0.5 has no list/update/delete/history endpoint, so dashboard memory
  inventory is metadata-only and chain-derived.
- Current `MemoryRef` includes `callId`, `sessionId`, `namespaceId`,
  `walrusBlobId`, `contentHash`, and `capturedAt`.
- `ActionCallEmittedEvent` also contains `parent_call_id`, `tool_name`,
  `tool_namespace`, `input_hash`, `prev_hash`, `new_session_merkle_root`,
  `captured_by_address`, and `label`.
- Sui events expose transaction metadata such as event timestamp and transaction
  digest through the RPC event object.
- `TraceSession` exposes `agent_id`, `environment`, `sdk_version`, status,
  call count, Merkle root, and captured-by address, but enriching every memory
  row with `fetchSession()` would be expensive if done on page load.
- `packages/dashboard/styles/dash.css` already contains prototype classes for
  memory table rows, chips, drawer, key-value provenance blocks, related memory
  rows, and bulk bar.
- Current `/memories` drawer correctly says plaintext is Seal-encrypted and not
  available through a get-by-blob primitive.

## Inferences

- A valuable v0.1 slice is to expose all provenance already present in the
  `memwal_write` event and Sui event metadata, without adding fake class/tier,
  edit/delete, or add-memory UI.
- Table filtering can be honest if it filters by fields actually present in
  on-chain metadata: blob presence, namespace, session, call, hash, runtime/tool
  namespace, captured address, and recent timestamp.
- The drawer can show proof boundaries: the event proves a memory write was
  anchored into a TraceSession Merkle chain; it does not prove plaintext,
  semantic correctness, or access history.
- Related memories can be derived from the same namespace or session, but should
  be labeled as same-session/same-namespace related metadata, not semantic
  similarity.

## Unknowns And Questions

- Whether future memory rows should perform lazy per-memory session verification
  when the drawer opens.
- Whether semantic search through MemWal recall should be added to this route or
  remain SDK/CLI-only until credentials and decrypt permissions are available.
- Whether add/edit/delete memory should ever be exposed in the dashboard without
  a signer/session boundary.

## Not Included

- Creating, editing, deleting, or tier-moving memories.
- Plaintext decryption or semantic recall.
- Real access logs; no access-log event exists in the checked contract schema.
- Hosted dashboard parity.
