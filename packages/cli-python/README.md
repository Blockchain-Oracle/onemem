# onemem-cli (Python)

Python build of the OneMem CLI — a read-only mirror of the canonical TS
`@onemem/cli` for Python-first environments.

```bash
pipx install onemem-cli   # exposes the `onemem-py` command
onemem-py verify <session-id>
```

**Publication note, 2026-06-18:** this README describes repo-local
`onemem-cli@0.1.0`. `pnpm registry:status` currently reports `onemem-cli` as
missing from PyPI, so use the workspace package until PyPI publication lands.

`onemem-py` coexists with the TS CLI's `onemem` binary.

## Commands

| Command | What it does |
|---|---|
| `onemem-py verify <session-id>` | Independently verify a TraceSession's Merkle chain |
| `onemem-py trace list` | 25 most recent sessions (newest first) |
| `onemem-py trace get <session-id>` | Session metadata (agent, status, call count) |
| `onemem-py trace events <session-id>` | The decoded ActionCall chain |
| `onemem-py health` | Check RPC + package reachability |

Global flags: `--json`, `--network <testnet\|mainnet\|devnet\|local>`. All commands
are read-only — no signer, no Walrus, no Seal. It verifies the same sessions and
computes the same Merkle roots as the TS CLI, so either tool reaches the same verdict.

## Why read-only (vs the TS CLI's `init` / `add` / `search`)

The Python SDK is verification-focused; it doesn't expose namespace provisioning
or the MemWal memory client. So `init` (provisioning) and `add`/`search` (memory)
are TS-only. The independently-verifiable read surface — the part anyone should be
able to run to check a OneMem trace — is fully mirrored here.

Full command spec: `docs/05-our-architecture/05-cli/command-surface.md`.
