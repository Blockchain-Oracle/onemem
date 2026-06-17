# Demo: Switch Laptops

Executable safe demo for OneMem's cross-runtime continuity wedge.

This demo records a mocked laptop handoff as two real OneMem `TraceSession`s on
Sui testnet, both in the same namespace:

1. Laptop A / Claude Code shaped session:
   - `inspect_project_context`
   - `write_project_memory`
   - `prepare_runtime_handoff`
2. Laptop B / Hermes shaped session:
   - `recall_project_memory`
   - `answer_from_memory`

The runtime names are labels. This demo does **not** prove a real Claude Code
hook, Hermes hook, second laptop, MemWal recall, Walrus plaintext availability,
or Seal decryptability.

## Run

From the repo root:

```bash
pnpm --filter @onemem/demo-switch-laptops demo:trace
```

Machine-readable output:

```bash
pnpm --filter @onemem/demo-switch-laptops demo:trace --json
```

The command writes the latest run artifact to:

```text
demos/switch-laptops/out/latest-trace.json
```

That file is ignored by git. It includes the namespace ID, both session IDs,
call IDs, verification summaries, Suiscan URLs, dashboard routes, public
verifier routes, continuity facts, and proof boundaries.

## Requirements

- Sui CLI active environment set to `testnet`.
- A funded testnet signer in `~/.sui/sui_config/sui.keystore`, or an existing
  signer path supported by `@onemem/sdk-ts/runtime`.
- OneMem testnet package IDs populated in `config/networks.json`.

The demo does not require MemWal credentials, an embedding API key, real Claude
Code hook trust, or a Hermes install.

## What It Proves

- Two real OneMem TraceSessions and ActionCalls were written on Sui testnet.
- Both sessions use the same OneMem namespace.
- Both sessions independently verify from Sui events and TraceSession objects.
- The Laptop B shaped session references the memory hash/blob produced by the
  Laptop A shaped session.

## What It Does Not Prove

- It does not prove real cross-device login or physical laptop switching.
- It does not prove actual Claude Code or Hermes hooks ran.
- It does not prove MemWal semantic recall, Walrus plaintext availability, or
  Seal decryptability.
- It does not prove model intent or tool honesty.

## Checks

```bash
pnpm --filter @onemem/demo-switch-laptops test
pnpm --filter @onemem/demo-switch-laptops typecheck
pnpm --filter @onemem/demo-switch-laptops lint
```

The historical recording script lives at:

```text
docs/05-our-architecture/08-demos-and-tests/demo-switch-laptops.md
```
