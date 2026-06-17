# Spec: Executable Demo Trace

## Objective

Make the first demo in Pillar 11 executable by adding a safe, repeatable
"Agent Sends Money" script that creates a real OneMem testnet TraceSession with
mocked payment tool calls and verifies it.

## Background And Current Reality

The prototype and demo docs identify trace verification as the product's
strongest proof moment. The current demo directories are README stubs, and the
existing SDK smoke script uses stale trace API names. The SDK can already create
real on-chain trace sessions and verify them using placeholder Walrus IDs plus
content hashes.

## Users

- Hackathon demo operator preparing a recording.
- Reviewer or judge running a reproducible trace/verify demo.
- Maintainer checking that SDK trace docs and scripts still match current API.

## Goals

- Add an executable `demos/agent-sends-money` workspace demo.
- Use real OneMem Sui testnet trace writes and read-only verification.
- Keep the payment action mocked and impossible to confuse with a real transfer.
- Repair the stale generic SDK smoke script to current trace API.
- Add tests/structure guard so the demo does not quietly return to README-only.

## Non-goals

- Do not transfer SUI, USDC, or any real asset.
- Do not require MemWal credentials.
- Do not require Walrus writes or Seal decrypt.
- Do not claim semantic correctness, model intent, or real-world payment proof.
- Do not build final video assets in this slice.

## Requirements

- R1: The demo package must expose a command that can create a real testnet
  TraceSession for the mock payment flow.
- R2: The command must verify the created TraceSession and fail non-zero if
  verification fails.
- R3: The demo must write a machine-readable run artifact containing session ID,
  call IDs, verification summary, Suiscan URL, and proof boundaries.
- R4: The demo must be safe: no real payment transfer and no hidden dependency
  on MemWal credentials.
- R5: The demo README must provide exact run commands and proof boundaries.
- R6: The old SDK smoke script must compile against the current SDK API.
- R7: Unit tests must cover the pure demo call model and hash generation.
- R8: Structure tests must assert the executable demo files exist.

## Acceptance Criteria

- AC1: `pnpm --filter @onemem/demo-agent-sends-money test` passes.
- AC2: `pnpm --filter @onemem/demo-agent-sends-money typecheck` passes.
- AC3: `pnpm --filter @onemem/demo-agent-sends-money lint` passes.
- AC4: `pnpm test:structure` passes.
- AC5: `pnpm exec tsx scripts/sdk-smoke-testnet.ts` creates and verifies a live
  testnet TraceSession.
- AC6: `pnpm --filter @onemem/demo-agent-sends-money demo:trace --json`
  creates and verifies a live testnet TraceSession.
- AC7: `git diff --check` passes.

## Constraints

- Use existing SDK/runtime helpers instead of new ad hoc Sui wiring.
- Keep files under the current structure-test source line cap.
- Avoid printing private keys, delegate keys, or credentials.
- Use testnet only by default.

## Stories Needed

- Demo operator runs a safe payment-trace demo.
- Maintainer verifies SDK smoke stays current with the public trace API.
- Reviewer reads proof boundaries before interpreting the output.

## Open Questions

- None blocking for the first executable demo.

## Source References

- `.thoughts/research/2026-06-17-demo-executable-trace.md`
- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- `.thoughts/quality/2026-06-17-project-quality-profile.md`
- `docs/05-our-architecture/08-demos-and-tests/demo-agent-sends-money.md`
- `packages/sdk-ts/src/traces.ts`
