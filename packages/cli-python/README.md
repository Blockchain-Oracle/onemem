# onemem-cli (Python)

Python build of the OneMem CLI for Python-first environments. It coexists with
the TS CLI's `onemem` binary.

```bash
pipx install onemem-cli   # exposes the `onemem-py` command
onemem-py health
```

**Publication note, 2026-06-18:** `onemem-cli@0.1.0` is current on PyPI after
`pnpm registry:status --strict`. Re-run that command before a fresh public
install claim.

## Commands

| Command | What it does |
|---|---|
| `onemem-py health` | Check Sui RPC reachability for the selected network |

Global flags: `--json`, `--network <testnet\|mainnet\|devnet\|local>`.

## Memory operations

The Python memory surface (add / search / get / list / delete) lives in the
`onemem` Python SDK's `MemoryClient`, which shells out to the `onemem-memory`
Node bridge (`@onemem/sdk-ts`) for the full MemWal round-trip (client-side Seal
encryption + Walrus + embeddings):

```python
from onemem.memory import MemoryClient

client = MemoryClient(namespace="my-app")
client.add("ships at night", user_id="alice")
hits = client.search("when do they ship?", user_id="alice")
```

Memory is client-side Seal-encrypted and stored on Walrus via MemWal — owned by
you, portable across runtimes.

Full command spec: `docs/05-our-architecture/05-cli/command-surface.md`.
