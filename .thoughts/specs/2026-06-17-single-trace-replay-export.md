# Spec: Single Trace Replay Export

## Objective

Upgrade the individual trace replay modal from metadata-only playback to a
proof-scoped single-session JSON export while keeping plaintext/decrypt
boundaries honest.

## Background And Current Reality

Grouped session replay already has a JSON export backed by server-side
verification and call serialization. The single trace replay modal only walks
metadata frames and tells users full content replay is separate client-side
decrypt work.

## Users

- Demo viewers inspecting one TraceSession.
- Developers and reviewers who need a portable single-session evidence JSON.
- Future agents extending trace replay without weakening proof boundaries.

## Goals

- Add a single-session export schema and proof-boundary string.
- Add a server route for exporting one TraceSession by ID.
- Add Download JSON and Copy JSON actions to the single replay modal.
- Keep the replay modal clear that exports contain no plaintext.
- Add unit/browser coverage for the new export path.

## Non-goals

- Do not export decrypted Walrus/Seal plaintext.
- Do not add new protocol objects.
- Do not remove grouped session export.
- Do not build a hosted or public export route in this slice.

## Requirements

- R1: A single trace export must use a distinct schema, not the grouped schema.
- R2: The export must include session metadata, verify result, call metadata,
  hashes, and Walrus blob IDs from the existing server fetch/verify path.
- R3: The export must include proof-boundary copy stating what it proves and
  does not prove.
- R4: The trace replay modal must expose Download JSON and Copy JSON actions.
- R5: The trace replay modal must state that no plaintext is included.
- R6: Tests must cover the single trace export builder.
- R7: Browser smoke must visit a trace page and verify the single replay/export
  UI.
- R8: Context Engineering artifacts and wiki/log must record the slice.

## Acceptance Criteria

- AC1: `pnpm --filter @onemem/dashboard test` passes.
- AC2: `pnpm --filter @onemem/dashboard typecheck` passes.
- AC3: `pnpm --filter @onemem/dashboard lint` passes.
- AC4: `pnpm --filter @onemem/dashboard build` passes.
- AC5: `pnpm --filter @onemem/dashboard browser:smoke` passes.
- AC6: `pnpm test:structure` passes.
- AC7: `git diff --check` passes.

## Constraints

- Existing dirty worktree must be preserved.
- Browser checks should use the Chrome plugin when exposed; otherwise record the
  repo-owned smoke harness fallback.
- Keep source files under the current 400-line structure cap.

## Stories Needed

- Trace viewer downloads single-session evidence JSON.
- Trace viewer copies single-session evidence JSON.
- Maintainer gets test coverage for the single export builder.

## Open Questions

- None blocking.

## Source References

- `.thoughts/research/2026-06-17-single-trace-replay-export.md`
- `packages/dashboard/lib/session-export.ts`
- `packages/dashboard/app/trace/[session_id]/ReplayModal.tsx`
- `packages/dashboard/scripts/browser-smoke.mjs`
