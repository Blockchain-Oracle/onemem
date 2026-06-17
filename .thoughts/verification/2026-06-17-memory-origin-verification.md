# Verification Audit: Memory Origin Verification

Date: 2026-06-17

## Verdict

Pass.

The Memories drawer now exposes a user-triggered verification action for the
selected memory's originating `TraceSession`. The action reuses the existing
server verifier, posts only the selected `sessionId`, renders loading/error/pass
states distinctly, and keeps the proof boundary limited to Merkle-chain
integrity rather than plaintext or semantic correctness.

## Artifacts Checked

- `packages/dashboard/app/memories/MemoryDrawer.tsx`
- `packages/dashboard/app/memories/MemoriesView.tsx`
- `packages/dashboard/lib/memory-origin-verify.ts`
- `packages/dashboard/lib/memory-origin-verify.test.ts`
- `packages/dashboard/styles/dash.css`
- `.thoughts/research/2026-06-17-memory-origin-verification.md`
- `.thoughts/specs/2026-06-17-memory-origin-verification.md`
- `.thoughts/stories/2026-06-17-memory-origin-verification.md`
- `.thoughts/plans/2026-06-17-memory-origin-verification.md`

## Requirement Traceability

- R1: `MemoryDrawer` renders a `Verify originating trace` action for the
  selected memory.
- R2: `verifyMemoryOrigin()` posts exactly
  `{ "sessionIds": ["<selected session id>"] }` to `/api/sessions/verify`.
- R3: The drawer renders idle, loading, request-error, successful verification,
  and failed-verification states.
- R4: Result copy shows session short id, call count, status label, broken call
  index when present, and verifier error when present.
- R5: `MemoriesView` keys the drawer by selected `callId`, so changing memory
  selection resets local verification state.
- R6: Existing proof-boundary copy still states that the UI does not prove
  plaintext, semantic correctness, or access history.

## Acceptance Criteria Coverage

- AC1: Browser proof opened `/memories`, selected a memory, and displayed the
  verify-origin action.
- AC2: Unit test asserts the exact shared verifier POST payload.
- AC3: Browser proof returned `Trace verified 0x6ceaab...c080 - 1 calls -
  Completed` from the live local dashboard against real testnet data.
- AC4: Existing memory filters and metadata tests still passed.
- AC5: Focused dashboard typecheck, lint, test, and build passed.
- AC6: `/memories` HTTP-render check passed.

## Quality Gates

```bash
pnpm exec biome check --write packages/dashboard/app/memories/MemoryDrawer.tsx packages/dashboard/app/memories/MemoriesView.tsx packages/dashboard/lib/memory-origin-verify.ts packages/dashboard/lib/memory-origin-verify.test.ts packages/dashboard/styles/dash.css
pnpm --filter @onemem/dashboard typecheck
pnpm --filter @onemem/dashboard lint
pnpm --filter @onemem/dashboard test
pnpm --filter @onemem/dashboard build
```

All listed gates passed.

## Live Checks

```bash
curl -s -o /tmp/onemem-memories.http -w "%{http_code}\n" http://localhost:4044/memories
curl -s -X POST http://localhost:4044/api/sessions/verify \
  -H 'content-type: application/json' \
  -d '{"sessionIds":["0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080"]}'
```

Observed verifier response:

```json
{
  "ok": true,
  "verifiedCount": 1,
  "total": 1,
  "first": {
    "sessionId": "0x6ceaab0fe2961043d490326960dfd192e43c25ed655772d42c04c265ad3ec080",
    "shortId": "0x6ceaab...c080",
    "ok": true,
    "callCount": 1,
    "statusLabel": "Completed",
    "brokenAt": null,
    "error": null
  }
}
```

Browser interaction proof used the Codex `@chrome` plugin. It opened
`/memories`, selected the first memory row, clicked `Verify originating trace`,
waited for the final result, and captured the verified drawer state.

```text
Trace verified 0x6ceaab...c080 - 1 calls - Completed
```

## Deviations From Plan

- The original plan listed browser interaction automation as an open follow-up.
  That follow-up is now closed for this slice with a Chrome plugin browser
  proof.

## Gaps And Risks

- This is still a user-triggered verification, not automatic verification for
  every memory row.
- The result verifies the originating `TraceSession` chain. It intentionally
  does not decrypt or prove memory plaintext.
- The browser proof is not yet committed as a reusable test harness; it is a
  manual verification command.
