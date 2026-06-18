# hermes-onemem

OneMem **memory provider** for [Hermes](https://pypi.org/project/hermes-agent/).
Records each Hermes agent session as a **verifiable on-chain TraceSession** on
Sui — Merkle-chained `ActionCall`s with content stored on Walrus and encrypted
with Seal.

**Publication note, 2026-06-18:** `hermes-onemem@0.2.0` is current on PyPI
after `pnpm registry:status --strict`. Re-run that command before making a
fresh public install claim.

## How it works

`OneMemProvider` implements Hermes's `agent.memory_provider.MemoryProvider`. It
observes the agent from outside the decision loop (no tools exposed) and buffers
each turn (`sync_turn`), built-in memory write (`on_memory_write`), and subagent
delegation (`on_delegation`). At `on_session_end` it flushes the buffer as one
TraceSession.

Hermes (Python) can't drive Walrus/Seal natively, so the on-chain write — and
the **zero-config** auto-provisioning of the namespace, ReadWrite cap, and signer
— is delegated to the `onemem-trace` Node CLI (`@onemem/sdk-ts`). Full fidelity,
no Python Sui deps.

## Prerequisite

**Node 20+ with `npx` on `PATH`** — the on-chain write goes through the
`onemem-trace` Node CLI (Walrus/Seal are JS-only). Without it the provider is
**silently inactive** (`is_available()` returns False) and nothing is traced.

## Install

```bash
pip install hermes-onemem
hermes-onemem install
```

`hermes-onemem install` copies the provider into `$HERMES_HOME/plugins/onemem/`
(Hermes discovers providers by directory, not from site-packages) and sets
`memory.provider: onemem` in your config.yaml. Pass `--no-config` to copy only.
Restart Hermes — the first session auto-provisions the namespace/cap/signer and
persists them under `~/.onemem/` (a generated signer, if no key/keystore exists,
lands at `~/.onemem/wallet.key`).

## Config (all optional — overrides auto-provisioning)

Env, read by the Node bridge: `SUI_NETWORK` (default `testnet`),
`ONEMEM_PRIVATE_KEY` (else sui keystore, else a generated+persisted wallet),
`ONEMEM_NAMESPACE_ID` + `ONEMEM_RW_CAP_ID` (else auto-provisioned).
`ONEMEM_TRACE_CMD` overrides how the CLI is invoked (default
`npx -y -p @onemem/sdk-ts@latest onemem-trace`).

Spec: `docs/05-our-architecture/03-runtimes/hermes-plugin.md`.
