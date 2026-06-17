# Verification Audit: Grouped Session Replay Export

## Verdict

Pass.

Dashboard-derived unified session groups now have a real grouped replay/export
surface. The implementation is read-only, proof-scoped, and backed by existing
TraceSession reads and verification data.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-17-grouped-session-replay-export.md`
- Spec: `.thoughts/specs/2026-06-17-grouped-session-replay-export.md`
- Stories:
  `.thoughts/stories/2026-06-17-grouped-session-replay-export.md`
- Plan: `.thoughts/plans/2026-06-17-grouped-session-replay-export.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Code:
  - `packages/dashboard/lib/session-export.ts`
  - `packages/dashboard/app/api/sessions/export/route.ts`
  - `packages/dashboard/app/sessions/GroupedReplayModal.tsx`
  - `packages/dashboard/app/sessions/SessionsView.tsx`
  - `packages/dashboard/lib/session-export.test.ts`

## Requirement Traceability

- R1 Sessions page grouped action:
  - `SessionsView.tsx` adds `Replay/export` per group card.
- R2 Grouped replay metadata:
  - `GroupedReplayModal.tsx` renders session rows and ordered call rows with
    runtime, session, tool, status, hash, and Walrus metadata.
- R3 Export JSON:
  - `session-export.ts` emits schema, generated timestamp, network, source
    session IDs, summary, per-session verification, calls, hashes, blobs, and
    proof boundary text.
- R4 Invalid input:
  - `normalizeExportSessionIds()` rejects missing, non-array, non-string, and
    empty inputs.
  - `POST /api/sessions/export` returns 400 for invalid input.
- R5 Request cap:
  - `MAX_GROUPED_EXPORT_IDS = 25`, matching grouped verification's bounded
    safety model.
- R6 Read-only:
  - Export builder uses `fetchSession()` only; no signer, mutation, Walrus
    plaintext fetch, or Seal decrypt path.
- R7 Tests:
  - `session-export.test.ts` covers input normalization, cap behavior, export
    shape, proof-boundary text, and partial failure retention.

## Acceptance Criteria Coverage

- AC1: Chrome plugin proof found `Replay/export` buttons on live `/sessions`.
- AC2: Chrome plugin proof opened `Grouped session replay` and loaded real
  grouped export content.
- AC3: Modal exposes `Download JSON` and `Copy JSON` once export data loads.
- AC4: Loaded modal contained proof-boundary copy including "does not prove
  plaintext".
- AC5: Invalid input behavior covered by `normalizeExportSessionIds()` tests and
  route 400 code path.
- AC6: `pnpm --filter @onemem/dashboard test` passed with 16 tests.
- AC7: Dashboard lint, typecheck, build, and structure checks passed.
- AC8: Chrome plugin browser proof:
  - URL: `http://localhost:4040/sessions`
  - First group: `Mon, Jun 15`, 6 sub-sessions.
  - Modal excerpt showed schema `onemem.grouped-session-export.v1`,
    `Verified sessions 6 / 6`, `Calls 10`, `Download JSON`, `Copy JSON`, and
    proof-boundary text.
  - Browser console error log count: 0.

## Quality Gates

- `pnpm --filter @onemem/dashboard test`: 6 files, 16 tests passed.
- `pnpm --filter @onemem/dashboard typecheck`: passed.
- `pnpm --filter @onemem/dashboard lint`: passed.
- `pnpm --filter @onemem/dashboard build`: passed.
- Chrome plugin live check of `/sessions`: passed.
- Temporary dashboard dev server stopped; nothing is listening on port 4040.

## Deviations From Plan

- The initial `pnpm test:structure` run failed because this verification file
  did not exist yet after registering it in `tests/structure.test.ts`. That is
  expected during artifact creation and is resolved by the final rerun.

## Gaps And Risks

- JSON export is not cryptographically signed as a separate grouped receipt.
- Grouped replay is metadata replay only; plaintext replay remains dependent on
  future client-side Seal SessionKey flow.
- Hosted dashboard parity is not implemented in this slice.

## Follow-ups

- Decide whether grouped exports should become importable by the public verifier.
- Continue remaining prototype queue: delegate-key lifecycle, hosted share/revoke
  UX, and reusable browser regression coverage.

## Evidence Log

- Context7 documentation check:
  - `npx ctx7@latest library Next.js "Next.js App Router route handler POST JSON response current docs"`
  - `npx ctx7@latest docs /vercel/next.js "App Router route handler POST JSON response current docs"`
- Chrome plugin modal inspection returned:
  - `found: true`
  - `hasDownload: true`
  - `hasCopy: true`
  - `hasSchema: true`
  - `hasProofBoundary: true`
- Dev server log:
  - `GET /sessions 200`
  - `POST /api/sessions/export 200`
