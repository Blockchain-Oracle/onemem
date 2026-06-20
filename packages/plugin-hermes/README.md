# hermes-onemem

OneMem **memory provider** for [Hermes](https://pypi.org/project/hermes-agent/).
Gives Hermes agents decentralized memory stored on MemWal (client-side
Seal-encrypted blobs on Walrus — the relayer never sees plaintext) and owned by
you. It recalls relevant past memories before a turn and captures the exchange
after it.

**Publication note, 2026-06-18:** `hermes-onemem@0.2.0` is current on PyPI after
`pnpm registry:status --strict`. Re-run that command before a fresh public
install claim.

## How it works

`OneMemProvider` implements Hermes's `agent.memory_provider.MemoryProvider`. It
observes the agent from outside the decision loop and:

- `recall_context` — searches prior memories to inject before a turn;
- `sync_turn` — captures the user/assistant exchange as a memory;
- `on_memory_write` — captures an explicit memory write.

Hermes (Python) can't drive Walrus/Seal natively, so the MemWal round-trip
(client-side Seal encryption + Walrus + embeddings) is delegated to the
`onemem-memory` Node bridge (`@onemem/sdk-ts`). No Python Sui deps.

## Prerequisite

**Node 20+ with `npx` on `PATH`** — the memory write goes through the
`onemem-memory` Node bridge (Walrus/Seal are JS-only). Without it the provider is
**silently inactive** (`is_available()` returns False).

## Install

```bash
pip install hermes-onemem
hermes-onemem install
```

`hermes-onemem install` copies the provider into `$HERMES_HOME/plugins/onemem/`
(Hermes discovers providers by directory, not from site-packages) and sets
`memory.provider: onemem` in your config.yaml. Pass `--no-config` to copy only.
Restart Hermes — memory config resolves lazily from `onemem login` credentials or
env (a generated signer, if no key/keystore exists, lands at
`~/.onemem/wallet.key`).

## Config (env, read by the bridge)

`SUI_NETWORK` (default `testnet`), `ONEMEM_ACCOUNT_ID`, `ONEMEM_DELEGATE_KEY`,
`ONEMEM_EMBEDDING_API_KEY`, `MEMWAL_PACKAGE_ID`, `MEMWAL_RELAYER_URL`,
`ONEMEM_PRIVATE_KEY` (else sui keystore, else a generated+persisted wallet).
`ONEMEM_MEMORY_CMD` overrides how the bridge is invoked (default
`npx -y -p @onemem/sdk-ts@latest onemem-memory`).

Spec: `docs/05-our-architecture/03-runtimes/hermes-plugin.md`.
