# Verification Audit: Multi-Agent Coordination Executable Demo

Date: 2026-06-17

## Verdict

Pass.

`demos/multi-agent-coordination` is now an executable safe testnet demo. It
records a mocked Claude Code orchestrator plus mocked Hermes and CrewAI
specialists as three real OneMem `TraceSession`s in one namespace, with the
specialist sessions linked to orchestrator delegate `ActionCall`s through
`parentCallId`.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-17-multi-agent-coordination-executable-demo.md`
- Spec:
  `.thoughts/specs/2026-06-17-multi-agent-coordination-executable-demo.md`
- Stories:
  `.thoughts/stories/2026-06-17-multi-agent-coordination-executable-demo.md`
- Plan:
  `.thoughts/plans/2026-06-17-multi-agent-coordination-executable-demo.md`
- Package:
  `demos/multi-agent-coordination/package.json`
- Trace model:
  `demos/multi-agent-coordination/src/trace-model.ts`
- Trace command:
  `demos/multi-agent-coordination/src/mock-multi-agent-trace.ts`
- Tests:
  `demos/multi-agent-coordination/src/trace-model.test.ts`
- Docs:
  `demos/multi-agent-coordination/README.md`
  `docs/05-our-architecture/08-demos-and-tests/README.md`
  `docs/05-our-architecture/08-demos-and-tests/demo-multi-agent-coordination.md`
- Structure guard:
  `tests/structure.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Private workspace package | `demos/multi-agent-coordination/package.json` declares `@onemem/demo-multi-agent-coordination` with `"private": true`. |
| R2: Package scripts | Manifest exposes `test`, `typecheck`, `lint`, `build`, and `demo:trace`. |
| R3: Testnet-only default | `mock-multi-agent-trace.ts` rejects non-testnet network selection; `--network mainnet` exits 1 with the expected fatal message. |
| R4: Three sessions in one namespace | Live artifact reports orchestrator, market specialist, and risk specialist sessions under namespace `0x6947b0d15c8c4be10912a0ccd0a9139ad7ea75750f9ace593c084758a3f5e136`. |
| R5: Market specialist parent link | Market first call parent is orchestrator market delegate call `0xf5d631edafd18e7956361fdbe0e14d45b30f27adbb4b4b8738a01cd6bc705a07`; artifact link reports `ok: true`. |
| R6: Risk specialist parent link | Risk first call parent is orchestrator risk delegate call `0x3333316e1f05a5f7c51e9be8f1cfbc122470ec877a4c78ce424ac1d686c32a15`; artifact link reports `ok: true`. |
| R7: Final synthesis references reports | Orchestrator final synthesis input contains both specialist report hashes and source session IDs. |
| R8: Every session verifies | Demo output reports `ok: true`; independent CLI verification passes for all three sessions. |
| R9: Docs state boundaries | README and architecture doc current note state mocked runtime boundaries and no finished cross-session tree claim. |
| R10: Structure guards | `tests/structure.test.ts` includes the demo in `DEMOS`, checks trace script/test files, and registers the CE artifacts. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: Package test passes | `pnpm --filter @onemem/demo-multi-agent-coordination test`: 2 passed. |
| AC2: Typecheck passes | `pnpm --filter @onemem/demo-multi-agent-coordination typecheck`: passed. |
| AC3: Lint passes | `pnpm --filter @onemem/demo-multi-agent-coordination lint`: passed after Biome safe fixes. |
| AC4: Build passes | `pnpm --filter @onemem/demo-multi-agent-coordination build`: passed. |
| AC5: Live `demo:trace --json` emits `ok: true` | Live run produced `ok: true`, three sessions, and one namespace. |
| AC6: Cross-runtime links match delegate call IDs | Artifact reports market and risk cross-runtime links with `ok: true`; child first calls retain the expected parent IDs. |
| AC7: TS CLI independently verifies sessions | `onemem verify` via TS CLI returned `ok: true` for all three session IDs. |
| AC8: Structure gate passes | `pnpm test:structure` passed 326 tests after this verification artifact was created. |

## Quality Gates

Executed:

```bash
mise exec -- pnpm install --lockfile-only
mise exec -- pnpm install
mise exec -- pnpm exec biome check --write demos/multi-agent-coordination
mise exec -- pnpm --filter @onemem/demo-multi-agent-coordination test
mise exec -- pnpm --filter @onemem/demo-multi-agent-coordination typecheck
mise exec -- pnpm --filter @onemem/demo-multi-agent-coordination lint
mise exec -- pnpm --filter @onemem/demo-multi-agent-coordination build
mise exec -- pnpm --filter @onemem/demo-multi-agent-coordination exec tsx src/mock-multi-agent-trace.ts --network mainnet
mise exec -- pnpm --filter @onemem/demo-multi-agent-coordination demo:trace --json
mise exec -- pnpm --filter @onemem/cli exec tsx src/index.ts --network testnet --json verify <session-id>
mise exec -- pnpm test:structure
```

Live testnet proof:

- Namespace:
  `0x6947b0d15c8c4be10912a0ccd0a9139ad7ea75750f9ace593c084758a3f5e136`
- Orchestrator session:
  `0x6b46e45c49000e632a6e8dce3701fce71f06eee1a9971f67a9a1e3b68d4db542`
  - CLI verify: `ok: true`, `callCount: 4`.
- Hermes market specialist session:
  `0x1dadb4c3a543d1ce490d94f583868dc3304b6b6adeb944b0ff4d9d4f79256bb3`
  - CLI verify: `ok: true`, `callCount: 3`.
  - First call parent:
    `0xf5d631edafd18e7956361fdbe0e14d45b30f27adbb4b4b8738a01cd6bc705a07`.
- CrewAI risk specialist session:
  `0x4ce84658ec1c89d59948e194e2b2d2c1ff894dbd8ab747c8e7e388605f050de1`
  - CLI verify: `ok: true`, `callCount: 3`.
  - First call parent:
    `0x3333316e1f05a5f7c51e9be8f1cfbc122470ec877a4c78ce424ac1d686c32a15`.

## Deviations From Plan

- The original architecture storyboard names LangGraph as the third layer. The
  executable v0.1 harness uses CrewAI instead, matching the existing caveat in
  `demo-multi-agent-coordination.md` that recommends a v0.1-supported
  substitute until LangGraph support ships.
- `src/mock-multi-agent-trace.ts` landed at exactly 400 lines after formatting.
  This is within the hard cap but should be split before future behavior is
  added.

## Gaps And Risks

- This is a mocked runtime workflow. It does not prove real Claude Code hooks,
  Hermes, CrewAI, LangGraph, real parallel execution, MemWal semantic recall,
  Walrus plaintext availability, or Seal decryptability.
- The dashboard can group and verify multiple sessions and marks linked calls,
  but `/trace/[id]` is not yet a full cross-session tree walker.

## Follow-ups

- Build a real cross-session dashboard tree walker from `parent_call_id`
  relationships.
- Add a separate live runtime integration if real Hermes/CrewAI hook execution
  becomes required.
- Split `mock-multi-agent-trace.ts` before extending it beyond the current
  executable harness.

## Evidence Log

- `mise exec -- pnpm --filter @onemem/demo-multi-agent-coordination test`:
  passed, 2 tests.
- `mise exec -- pnpm --filter @onemem/demo-multi-agent-coordination
  typecheck`: passed.
- `mise exec -- pnpm --filter @onemem/demo-multi-agent-coordination lint`:
  passed.
- `mise exec -- pnpm --filter @onemem/demo-multi-agent-coordination build`:
  passed.
- Negative guard: `--network mainnet` exited 1 with `FATAL:
  multi-agent-coordination demo defaults to testnet; pass --network testnet`.
- Live `demo:trace --json`: `ok: true`.
- Independent TS CLI verify: all three generated sessions `ok: true`.
- `mise exec -- pnpm test:structure`: passed, 326 tests.
