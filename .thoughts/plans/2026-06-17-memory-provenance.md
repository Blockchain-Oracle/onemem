# Plan: Memory Provenance

## Inputs

- Reality research:
  `.thoughts/research/2026-06-17-memory-provenance.md`
- Spec: `.thoughts/specs/2026-06-17-memory-provenance.md`
- Stories: `.thoughts/stories/2026-06-17-memory-provenance.md`
- Prototype discovery:
  `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current route: `packages/dashboard/app/memories/page.tsx`

## Assumptions

- v0.1 should remain read-only because dashboard memory mutation would require
  signer/session semantics not present in the current route.
- Enriching `fetchMemories()` from the existing event payload is cheaper and
  safer than fetching every referenced session on page load.
- Related memories can be derived locally from same session or same namespace.

## Open Questions

- Whether lazy selected-session verification should be added after this slice.
- Whether hosted dashboard should share the same provenance UI immediately.

## Phase 1: Data Model Enrichment

### Goal

Expose all useful `memwal_write` provenance fields already present in Sui events.

### Work

- Extend `MemoryRef` in `packages/dashboard/lib/memory.ts`.
- Preserve existing fields while adding parent call, tool, hashes, event time,
  captured address, label, and transaction digest.
- Add unit tests for memory filtering/related-memory helpers in a new small module
  or alongside the data helper.

### Checks

```bash
pnpm --filter @onemem/dashboard typecheck
pnpm --filter @onemem/dashboard test
```

### Acceptance Criteria Covered

AC1, AC2, AC4.

### Stop Condition

The UI can receive richer memory metadata without additional Sui calls.

## Phase 2: Memories UI Translation

### Goal

Translate the prototype's provenance/detail depth into the current Next.js route
without copying fake actions.

### Work

- Replace the thin drawer with a proof-focused provenance drawer.
- Add real metadata filters and stronger search.
- Show runtime/tool namespace, capture time, session link, event/receipt fields,
  and same-session/same-namespace related rows.
- Remove or avoid prototype-only add/edit/delete/bulk mutation controls.
- Add proof-boundary copy.

### Checks

```bash
pnpm --filter @onemem/dashboard typecheck
pnpm --filter @onemem/dashboard lint
pnpm --filter @onemem/dashboard build
```

### Acceptance Criteria Covered

AC1, AC2, AC3, AC4, AC5, AC7.

### Stop Condition

`/memories` is a real memory provenance explorer over current chain metadata.

## Phase 3: Verification And Context Update

### Goal

Prove the slice and preserve the result in `.thoughts`.

### Work

- Run focused dashboard gates and structure tests.
- HTTP-render or browser-check `/memories`.
- Write verification audit.
- Update wiki index/log/status and structure artifact list.

### Checks

```bash
pnpm test:structure
```

### Acceptance Criteria Covered

AC6, AC7.

### Stop Condition

Implementation, tests, route output, and Context Engineering artifacts line up.

## Verification Checkpoint

Use the `verification-audit` skill before claiming this scope complete.

## Handoff Notes

This scope intentionally leaves add/edit/delete memories, semantic recall, lazy
session verification, and hosted-dashboard parity for later slices.
