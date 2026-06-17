# Verification: Executable Demo Trace

Date: 2026-06-17

## Scope

Implemented the first executable demo package:
`demos/agent-sends-money`. The demo records a mocked payment flow as a real
OneMem Sui testnet `TraceSession`, verifies the Merkle chain, and writes a JSON
run artifact.

Also repaired the generic SDK smoke script to the current trace API and changed
the SDK memory layer to lazy-load MemWal's manual entrypoint so trace-only SDK
imports do not fail when MemWal is not being used.

## Live Chain Proof

### Generic SDK Smoke

Command:

```bash
mise exec -- pnpm exec tsx scripts/sdk-smoke-testnet.ts
```

Result: passed.

- Session:
  `0x531cc098fc0cc8d0dd82c63710cb8aa8b50cd6c331502f41064e6630724b3ac0`
- Calls: 3
- Status: Completed
- Expected root:
  `0x7308cd2f8907589b57da4e1888652f2fb92db2fc19b4a45c94c02446b71bf0ef`
- Computed root:
  `0x7308cd2f8907589b57da4e1888652f2fb92db2fc19b4a45c94c02446b71bf0ef`

### Agent Sends Money Demo

Command:

```bash
mise exec -- pnpm --filter @onemem/demo-agent-sends-money demo:trace --json
```

Result: passed.

- Session:
  `0xc173d0abc33f51bef8f489c9e928e2d956a290419edc7e3924b79a39bec56d59`
- Namespace:
  `0x6551bc7bb305a200794ac6ec43e8ae4116ad6e720a501505feb6fd988b930b0a`
- Calls: 4
- Status: Completed
- Expected root:
  `0x6c963d157122b69ee57ec6c082867e16d0df6ed4ccc74cbad1c58c04f7f7b42e`
- Computed root:
  `0x6c963d157122b69ee57ec6c082867e16d0df6ed4ccc74cbad1c58c04f7f7b42e`
- Artifact:
  `demos/agent-sends-money/out/latest-trace.json`

The chain event read confirmed these tool names in order:

1. `resolve_suins`
2. `fetch_pyth_oracle`
3. `check_gas_estimate`
4. `execute_payment`

Independent CLI verification command:

```bash
mise exec -- pnpm --filter @onemem/cli exec tsx src/index.ts --network testnet --json verify 0xc173d0abc33f51bef8f489c9e928e2d956a290419edc7e3924b79a39bec56d59
```

Result: passed with `ok: true`, `callCount: 4`, and matching expected/computed
Merkle roots.

Event-chain read command:

```bash
mise exec -- pnpm --filter @onemem/cli exec tsx src/index.ts --network testnet --json trace events 0xc173d0abc33f51bef8f489c9e928e2d956a290419edc7e3924b79a39bec56d59
```

Result: passed and showed the four linked payment-demo calls above.

## Local Gates

Passed:

- `mise exec -- pnpm --filter @onemem/sdk-ts typecheck`
- `mise exec -- pnpm --filter @onemem/sdk-ts lint`
- `mise exec -- pnpm --filter @onemem/demo-agent-sends-money typecheck`
- `mise exec -- pnpm --filter @onemem/demo-agent-sends-money lint`
- `mise exec -- pnpm --filter @onemem/demo-agent-sends-money test`
- `mise exec -- pnpm --filter @onemem/demo-agent-sends-money build`
- `mise exec -- node --import tsx --input-type=module -e "import('./packages/sdk-ts/src/index.ts').then(...)"`
- `mise exec -- pnpm test:structure`
- `git diff --check`

Not counted as passed:

- `mise exec -- pnpm --filter @onemem/sdk-ts build`
  - Started `tsup` and then idled at 0% CPU with esbuild service alive.
  - Interrupted manually to avoid leaving a stuck process.
  - A narrower `tsup src/runtime.ts ...` run behaved the same way.
- `ONEMEM_DASHBOARD_TRACE_SMOKE_SESSION=... pnpm --filter @onemem/dashboard browser:smoke`
  - Next dev server started and served `/`, but headless Chrome launch timed out.
- `ONEMEM_HOSTED_VERIFY_SMOKE_SESSION=... pnpm --filter @onemem/hosted-dashboard browser:smoke`
  - Next dev server started and expected missing-sponsorship API checks ran, but
    headless Chrome launch timed out.

No browser-smoke servers were left running after cleanup checks.

## Proof Boundaries

This slice proves:

- A real Sui testnet OneMem `TraceSession` and `ActionCall` chain can be
  created from an executable demo command.
- The resulting Merkle chain verifies from chain data.
- The call sequence matches the mocked payment workflow.
- A read-only CLI verifier independently verifies the resulting session.

This slice does not prove:

- A real payment transfer occurred.
- Walrus plaintext blobs exist for the placeholder IDs.
- Seal decryptability of payment payloads.
- Model intent or semantic truthfulness.
- Trusted Codex or Claude Code hooks automatically captured a session.

## Follow-ups

- Investigate local `tsup` idling for `@onemem/sdk-ts` builds.
- Replace or repair the Playwright-core browser smoke path with the Codex Chrome
  plugin path when callable tools are available in the session.
- Add a later demo variant with real Walrus writes if WAL funding and plaintext
  proof are needed for the recording.
