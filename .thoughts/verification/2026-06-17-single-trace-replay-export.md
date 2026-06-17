# Verification: Single Trace Replay Export

## Verdict

Pass.

Single-trace replay/export is implemented and verified. The local dashboard
`/trace/[session_id]` replay modal now fetches a proof-scoped export from
`GET /api/trace/[session_id]/export`, renders the
`onemem.trace-session-export.v1` schema, and exposes Download JSON / Copy JSON
actions without including plaintext.

## Artifacts To Check

- `.thoughts/research/2026-06-17-single-trace-replay-export.md`
- `.thoughts/specs/2026-06-17-single-trace-replay-export.md`
- `.thoughts/stories/2026-06-17-single-trace-replay-export.md`
- `.thoughts/plans/2026-06-17-single-trace-replay-export.md`
- `packages/dashboard/lib/session-export.ts`
- `packages/dashboard/lib/session-export.test.ts`
- `packages/dashboard/app/api/trace/[session_id]/export/route.ts`
- `packages/dashboard/app/trace/[session_id]/ReplayModal.tsx`
- `packages/dashboard/app/trace/[session_id]/TraceView.tsx`
- `packages/dashboard/scripts/browser-smoke.mjs`
- `tests/structure.test.ts`

## Gates

- `pnpm --filter @onemem/dashboard test` - passed, 6 files / 21 tests.
- `pnpm --filter @onemem/dashboard typecheck` - passed.
- `pnpm --filter @onemem/dashboard lint` - passed.
- `pnpm --filter @onemem/dashboard build` - passed; route table includes
  `/api/trace/[session_id]/export`.
- `pnpm --filter @onemem/dashboard browser:smoke` - passed, 26 checks,
  including grouped replay, single-trace replay, export schema, copy/download
  controls, no-plaintext boundary, and no console/resource errors.
- Chrome plugin manual proof - passed against
  `http://127.0.0.1:4056/trace/0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080`;
  modal rendered `onemem.trace-session-export.v1`, proof boundary, Download
  JSON, and Copy JSON.
- `curl http://127.0.0.1:4056/api/trace/0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080/export`
  - passed with `{ "ok": true }` and schema
  `onemem.trace-session-export.v1`.
- `pnpm test:structure` - passed, 234 tests.
- `git diff --check` - passed.

## Debug Note

The first browser-smoke run failed after opening the trace page because the
script clicked server-rendered `Replay session` text before React hydration had
reliably attached the handler. Chrome plugin inspection and a direct API curl
proved the product path worked. The smoke script now waits for the concrete
dialog and retries the click before asserting export text, so the regression
gate tracks the real UI state instead of a hydration race.

## Gaps And Risks

- This slice intentionally exports proof metadata only. Plaintext replay remains
  separate client-side decrypt work.
- The export proves TraceSession/Merkle metadata, not semantic correctness,
  model intent, or decrypted Walrus content.
