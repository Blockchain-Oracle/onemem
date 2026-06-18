# @onemem/cli

The `onemem` command-line tool — verify, inspect, and provision verifiable agent
memory + traces from your terminal.

```bash
npm install -g @onemem/cli
# dashboard launcher support:
npm install -g @onemem/dashboard
# or
npx @onemem/cli verify <session-id>
```

**Publication note, 2026-06-18:** `@onemem/cli@0.1.0` and
`@onemem/dashboard@0.1.1` are current on npm after
`pnpm registry:status --strict`. Re-run that command before making a fresh
public install claim.

## Commands

| Command | What it does | Needs |
|---|---|---|
| `onemem verify <session-id>` | Independently re-verify a TraceSession's Merkle chain from chain data alone | nothing (read-only) |
| `onemem trace list` | List recent sessions | nothing |
| `onemem trace get <session-id>` | Session metadata (agent, status, call count) | nothing |
| `onemem trace events <session-id>` | The decoded ActionCall chain (tool, link, content hash, Walrus blob) | nothing |
| `onemem health` | Check RPC + package reachability | nothing |
| `onemem dashboard` | Launch the local dashboard on `localhost:4040` or `--port <port>` | `@onemem/dashboard` installed |
| `onemem login` | Pair this terminal with a hosted dashboard callback and save `~/.onemem/credentials.json` | hosted dashboard implementing the callback contract |
| `onemem init` | Provision (or reuse) a namespace + ReadWrite cap — zero config | a Sui signer |
| `onemem namespace share <namespace-id> <recipient>` | Mint + transfer a ReadOnly or ReadWrite namespace capability | signer + Admin cap |
| `onemem namespace revoke <cap-id>` | Self-revoke a capability you hold | signer that owns the cap |
| `onemem namespace admin-revoke <namespace-id> <cap-id>` | Admin-revoke a capability by ID; object remains but OneMem gates reject it | signer + Admin cap |
| `onemem namespace capabilities <namespace-id>` | List active capabilities from namespace events | nothing (read-only) |
| `onemem add <text>` | Store a memory + emit a verifiable ActionCall | signer + MemWal config |
| `onemem search <query>` | Vector-recall memories | signer + MemWal config |

Global flags: `--json` (machine output), `--network <testnet\|mainnet\|devnet\|local>`.

The read-only commands (`verify`, `trace *`, `health`) need **no signer, no
Walrus, no Seal** — anyone can independently verify a session. `init` resolves a
signer the same way the SDK runtime does (env key → Sui keystore → a
generated+persisted wallet). `add`/`search` need the signer plus MemWal env
(`onemem add` prints exactly which vars are missing).

## Not in v0.1 (deferred)

- **Runtime installers** (`onemem install --runtime …`) — each runtime already has
  its own one-line install; a unified installer is post-hackathon.

Full command spec: `docs/05-our-architecture/05-cli/command-surface.md`.
