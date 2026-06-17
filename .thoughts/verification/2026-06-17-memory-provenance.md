# Verification Audit: Memory Provenance

Date: 2026-06-17

## Verdict

Conditional pass.

The Memories route now exposes richer read-only provenance from real on-chain
`memwal_write` events, and focused dashboard gates passed. The conditional note
is limited to manual interaction evidence: Chrome rendered the upgraded table,
but the local automation path could not complete a drawer row-click because
Computer Use/Chrome click automation was unstable and Chrome blocks JavaScript
from Apple Events by default.

## Artifacts Checked

- `packages/dashboard/lib/memory.ts`
- `packages/dashboard/lib/memory-view.ts`
- `packages/dashboard/lib/memory-view.test.ts`
- `packages/dashboard/app/memories/page.tsx`
- `packages/dashboard/app/memories/MemoriesView.tsx`
- `packages/dashboard/app/memories/MemoryDrawer.tsx`
- `packages/dashboard/app/api/memories/route.ts`
- `.thoughts/research/2026-06-17-memory-provenance.md`
- `.thoughts/specs/2026-06-17-memory-provenance.md`
- `.thoughts/stories/2026-06-17-memory-provenance.md`
- `.thoughts/plans/2026-06-17-memory-provenance.md`

## Requirement Traceability

- R1: `MemoryRef` now includes parent call, tool name, tool namespace, input
  hash, previous hash, session Merkle root, captured-by address, event timestamp,
  transaction digest, and label in addition to the existing memory fields.
- R2: `filterMemories()` searches across real provenance fields including
  session, namespace, call, hashes, runtime/tool namespace, label, captured
  address, and transaction digest.
- R3: `/memories` renders honest filters for all, with blob, no blob, recent,
  and active namespace when configured.
- R4: The table shows origin/runtime context and an `anchored` proof badge,
  without claiming plaintext verification.
- R5: `MemoryDrawer` renders event provenance, on-chain receipt fields, canonical
  `/trace/[session_id]` links, Sui transaction/object links, and related metadata
  derived from same session or same namespace.
- R6: Drawer copy explicitly states that the flow proves the chain-anchored
  memory write and does not prove plaintext, semantic correctness, or access
  history.
- R7: Empty, error, and no-search-results states remain explicit.

## Acceptance Criteria Coverage

- AC1: Covered by enriched API payload and rendered table markers.
- AC2: Covered by `MemoryDrawer` implementation; manual click verification is
  the conditional gap.
- AC3: Drawer links use `/trace/${sessionId}` and current-network Suiscan URLs.
- AC4: Covered by `memory-view.test.ts`.
- AC5: Prototype-only add/edit/delete/decrypt/semantic-search actions are not
  present in the route.
- AC6: Focused dashboard gates passed.
- AC7: `/memories` was HTTP-render checked and visually checked in Chrome.

## Quality Gates

```bash
pnpm --filter @onemem/dashboard typecheck
pnpm --filter @onemem/dashboard test
pnpm --filter @onemem/dashboard lint
pnpm --filter @onemem/dashboard build
pnpm exec biome check packages/dashboard/lib/memory.ts packages/dashboard/lib/memory-view.ts packages/dashboard/lib/memory-view.test.ts packages/dashboard/app/memories/page.tsx packages/dashboard/app/memories/MemoriesView.tsx packages/dashboard/app/memories/MemoryDrawer.tsx
```

All listed gates passed.

## Deviations From Plan

- I did not add lazy selected-session verification. It remains a separate
  follow-up because this pass is metadata/provenance only.
- I did not implement hosted dashboard parity.
- I did not expose add/edit/delete/bulk actions from the prototype because there
  is no dashboard signer/session boundary for those mutations in this route.

## Gaps And Risks

- The drawer click should use the Codex `@chrome` plugin for local Codex
  verification. A reusable repo-owned browser harness can be added later if the
  project needs CI-level browser regression coverage.
- Related memory rows are metadata-derived, not semantic recommendations.
- The route still does not decrypt memory plaintext or perform MemWal semantic
  recall.

## Follow-ups

- Lazy "verify selected session" from the drawer was completed in
  `.thoughts/verification/2026-06-17-memory-origin-verification.md`.
- Add a stable browser interaction test harness for dashboard client islands.
- Decide whether hosted dashboard should reuse this exact provenance UI.

## Evidence Log

- `/api/memories` returned `ok: true`, two memory records, and the first record
  contained enriched fields: `toolNamespace`, `txDigest`, `sessionMerkleRoot`,
  `capturedByAddress`, and `inputHash`.
- `/memories` returned HTTP 200.
- Rendered `/memories` HTML contained `Encrypted memory writes`,
  `Search metadata`, `With blob`, `metadata-only`, `memory events`, and
  `anchored`.
- Chrome visual state showed two memory events, filter chips, runtime origin,
  namespace, and `anchored` proof badges.
