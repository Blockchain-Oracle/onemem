# Demo: Agent Sends Money

Executable safe demo for OneMem's trace + verify wedge.

This demo records a mocked payment workflow as a real OneMem `TraceSession` on
Sui testnet:

1. `resolve_suins`
2. `fetch_pyth_oracle`
3. `check_gas_estimate`
4. `execute_payment`

The final step is deliberately mocked. It does **not** build, sign, submit, or
transfer any real SUI, USDC, or other asset.

## Run

From the repo root:

```bash
pnpm --filter @onemem/demo-agent-sends-money demo:trace
```

Machine-readable output:

```bash
pnpm --filter @onemem/demo-agent-sends-money demo:trace --json
```

The command writes the latest run artifact to:

```text
demos/agent-sends-money/out/latest-trace.json
```

That file is ignored by git. It includes the session ID, call IDs, verification
summary, Suiscan URL, dashboard route, public verifier route, and proof
boundaries.

## Requirements

- Sui CLI active environment set to `testnet`.
- A funded testnet signer in `~/.sui/sui_config/sui.keystore`, or an existing
  signer path supported by `@onemem/sdk-ts/runtime`.
- OneMem testnet package IDs populated in `config/networks.json`.

The demo does not require MemWal credentials, an embedding API key, or a real
wallet/payment integration.

## What It Proves

- A real OneMem TraceSession and ActionCalls were written on Sui testnet.
- The on-chain Merkle chain verifies from Sui events and the TraceSession object.
- The trace contains the payment-demo call sequence expected by the script.

## What It Does Not Prove

- It does not prove a real payment happened.
- It does not prove model reasoning or tool honesty.
- It does not prove Walrus plaintext availability or Seal decryptability; this
  first executable demo uses placeholder Walrus blob IDs plus content hashes.

## Checks

```bash
pnpm --filter @onemem/demo-agent-sends-money test
pnpm --filter @onemem/demo-agent-sends-money typecheck
pnpm --filter @onemem/demo-agent-sends-money lint
```

The historical recording script lives at:

```text
docs/05-our-architecture/08-demos-and-tests/demo-agent-sends-money.md
```
