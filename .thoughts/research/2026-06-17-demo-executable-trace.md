# Reality Research: Executable Demo Trace

## Scope

Current reality for turning the demo/e2e pillar from README-only plans into at
least one executable, verifiable OneMem demo. Focus is the "Agent Sends Money"
demo because it is the clearest trace/verify wedge and can be safely mocked
without transferring real assets.

## Sources Checked

- `demos/*/README.md`
- `docs/05-our-architecture/08-demos-and-tests/README.md`
- `docs/05-our-architecture/08-demos-and-tests/demo-agent-sends-money.md`
- `docs/05-our-architecture/08-demos-and-tests/e2e-test-plan.md`
- `scripts/sdk-smoke-testnet.ts`
- `packages/sdk-ts/src/traces.ts`
- `packages/sdk-ts/src/runtime.ts`
- `packages/sdk-ts/tests/sdk.integration.test.ts`
- `packages/cli-ts/src/commands/verify.ts`
- Local Sui state checked without printing private keys:
  `sui client active-env`, `sui client active-address`, `sui client gas --json`

## Verified Facts

- The four demo directories currently contain README stubs only.
- The demo architecture README still marks all demos and the e2e matrix as
  pending.
- `scripts/sdk-smoke-testnet.ts` exists and is intended to create a live testnet
  TraceSession, but it uses stale SDK names: `openSession`, `emitCall`, and
  `closeSession`.
- The current TS SDK trace API uses `startSession`, `appendCall`, `closeCall`,
  `endSession`, and `verifySession`.
- The SDK can write a trace without Walrus writes by using pre-supplied
  `{ walrusBlob, hash }` payloads. This still creates real on-chain
  TraceSession/ActionCall objects and verifies the Merkle chain, but it does not
  prove blob plaintext or Walrus availability.
- The local Sui CLI is on `testnet`, the active address matches the configured
  testnet deployer, and the address has testnet SUI gas.
- No MemWal env credentials are present in the shell, so memory add/search is
  not the safest first executable demo path.
- The repo already has dashboard verifier and replay surfaces that can consume a
  produced session ID.

## Inferences

- The highest-leverage first executable demo is a safe "Agent Sends Money"
  mock-payment trace: resolve SuiNS, fetch oracle, estimate gas, execute mocked
  payment, and summarize. It demonstrates trace tree + verify without risking
  real fund transfer.
- This demo should state its proof boundary: real Sui trace and Merkle
  verification, no real payment, no Walrus plaintext proof.
- Repairing `scripts/sdk-smoke-testnet.ts` is part of demo readiness because it
  is the generic live testnet trace smoke path and currently drifts from SDK API.

## Unknowns And Questions

- Whether future demo recordings should upgrade this mock trace to real Walrus
  content storage after WAL funding is confirmed.
- Whether the final video should use this script's generated session directly or
  a preselected canonical demo session.

## Not Included

- No real Sui payment or USDC transfer.
- No MemWal memory add/search path.
- No Claude/Codex trusted hook session proof.
- No video recording or hosted deployment.
