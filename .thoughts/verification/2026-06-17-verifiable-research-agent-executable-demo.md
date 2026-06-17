# Verification Audit: Verifiable Research Agent Executable Demo

Date: 2026-06-17

## Verdict

Pass.

`demos/verifiable-research-agent` is now an executable safe testnet demo. It
records a mocked three-day research workflow as three real OneMem
`TraceSession`s in one namespace and verifies each session from chain data.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-17-verifiable-research-agent-executable-demo.md`
- Spec:
  `.thoughts/specs/2026-06-17-verifiable-research-agent-executable-demo.md`
- Stories:
  `.thoughts/stories/2026-06-17-verifiable-research-agent-executable-demo.md`
- Plan:
  `.thoughts/plans/2026-06-17-verifiable-research-agent-executable-demo.md`
- Package:
  `demos/verifiable-research-agent/package.json`
- Trace model:
  `demos/verifiable-research-agent/src/trace-model.ts`
- Trace command:
  `demos/verifiable-research-agent/src/mock-research-trace.ts`
- Tests:
  `demos/verifiable-research-agent/src/trace-model.test.ts`
- Docs:
  `demos/verifiable-research-agent/README.md`
  `docs/05-our-architecture/08-demos-and-tests/README.md`
- Structure guard:
  `tests/structure.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Private workspace package | `demos/verifiable-research-agent/package.json` declares `@onemem/demo-verifiable-research-agent` with `"private": true`. |
| R2: Package scripts | Manifest exposes `test`, `typecheck`, `lint`, `build`, and `demo:trace`. |
| R3: Testnet-only default | `mock-research-trace.ts` rejects non-testnet network selection; `--network mainnet` exits 1 with the expected fatal message. |
| R4: Three sessions under one namespace | Live artifact reports day-1/day-2/day-3 sessions under namespace `0xbc2a0e293cd05eae4c428754dad518b9d9e57662bbda42483b3ba56744fc07dd`. |
| R5: Every session verifies | Demo output reports `ok: true`; independent CLI verification passes for all three sessions. |
| R6: JSON artifact includes proof data | Live output includes namespace, memory references, session IDs, call IDs, Merkle roots, Suiscan URLs, dashboard paths, public verifier paths, continuity, and proof boundaries. |
| R7: Docs state boundaries | README has "What It Proves" and "What It Does Not Prove"; demo matrix says runtime/tools are mocked. |
| R8: Structure guards | `tests/structure.test.ts` includes the demo in `DEMOS` and checks the trace script/model test files. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: Package test passes | `pnpm --filter @onemem/demo-verifiable-research-agent test`: 2 passed. |
| AC2: Typecheck passes | `pnpm --filter @onemem/demo-verifiable-research-agent typecheck`: passed. |
| AC3: Lint passes | `pnpm --filter @onemem/demo-verifiable-research-agent lint`: passed after Biome safe fixes. |
| AC4: Build passes | `pnpm --filter @onemem/demo-verifiable-research-agent build`: passed. |
| AC5: Live `demo:trace --json` emits `ok: true` | Live run produced `ok: true`, three sessions, and same-namespace continuity. |
| AC6: TS CLI independently verifies sessions | `onemem verify` via TS CLI returned `ok: true` for all three session IDs. |
| AC7: Structure gate passes | `pnpm test:structure` passed 321 tests after this verification artifact was added to the guarded inventory. |

## Quality Gates

Executed:

```bash
pnpm install --lockfile-only
pnpm install
pnpm exec biome check --write demos/verifiable-research-agent
pnpm --filter @onemem/demo-verifiable-research-agent test
pnpm --filter @onemem/demo-verifiable-research-agent typecheck
pnpm --filter @onemem/demo-verifiable-research-agent lint
pnpm --filter @onemem/demo-verifiable-research-agent build
pnpm --filter @onemem/demo-verifiable-research-agent exec tsx src/mock-research-trace.ts --network mainnet
pnpm test:structure
pnpm --filter @onemem/demo-verifiable-research-agent demo:trace --json
pnpm --filter @onemem/cli exec tsx src/index.ts --network testnet --json verify <session-id>
```

Live testnet proof:

- Namespace:
  `0xbc2a0e293cd05eae4c428754dad518b9d9e57662bbda42483b3ba56744fc07dd`
- Day 1 session:
  `0x78f425ce0dc09429e04101fa8281c73985fdf5ab7c243b1e459bd7d820a015f3`
  - CLI verify: `ok: true`, `callCount: 2`.
- Day 2 session:
  `0x4e3fdb55e768fa631afb19d6ef93fa741cf68fa35d73bd66b4e527c08069b00e`
  - CLI verify: `ok: true`, `callCount: 3`.
- Day 3 session:
  `0x8190f5619b5f315bde621bb0bc1532fa62370becfd794535cf6bdc67b506b031`
  - CLI verify: `ok: true`, `callCount: 2`.

## Deviations From Plan

- The plan expected `pnpm --filter ...` gates to run immediately. The first
  typecheck/build run failed because the new workspace package had not been
  installed/linked yet. Running `pnpm install` fixed the workspace link and the
  rerun passed.
- Biome formatting was applied with `pnpm exec biome check --write
  demos/verifiable-research-agent`.

## Gaps And Risks

- This is a mocked research workflow. It does not prove real web search, PDF
  extraction, Hermes execution, MemWal semantic recall, Walrus plaintext
  availability, or Seal decryptability.
- `src/mock-research-trace.ts` is 280 lines. This is under the current 400-line
  cap but should be split before adding more behavior.

## Follow-ups

- Build the remaining Multi-agent Coordination executable demo.
- Decide whether a future high-volume stress demo should generate many sessions
  and memory records.
- If real Hermes/web/PDF execution becomes a requirement, write a separate spec
  and live integration test rather than extending this mocked harness silently.

## Evidence Log

- `pnpm --filter @onemem/demo-verifiable-research-agent test`: passed, 2 tests.
- `pnpm --filter @onemem/demo-verifiable-research-agent typecheck`: passed.
- `pnpm --filter @onemem/demo-verifiable-research-agent lint`: passed.
- `pnpm --filter @onemem/demo-verifiable-research-agent build`: passed.
- Negative guard: `--network mainnet` exited 1 with `FATAL:
  verifiable-research-agent demo defaults to testnet; pass --network testnet`.
- `pnpm test:structure`: passed, 321 tests, after this verification artifact
  was added to the guarded inventory.
- Live `demo:trace --json`: `ok: true`.
- Independent TS CLI verify: all three generated sessions `ok: true`.
