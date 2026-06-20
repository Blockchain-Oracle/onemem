# @onemem/cli

The `onemem` command-line tool — store, search, and manage decentralized agent
memory from your terminal. Memory is client-side Seal-encrypted and stored on
Walrus via MemWal, owned by you.

```bash
npm install -g @onemem/cli
# dashboard launcher support:
npm install -g @onemem/dashboard
# or
npx @onemem/cli search "<query>"
```

**Publication note, 2026-06-19:** `@onemem/cli@0.6.3` is current on npm and the
public install path is proven: `npm exec --yes --package @onemem/cli@0.6.3 --
onemem --version` prints `0.6.3`. Re-run `pnpm registry:status --strict` before
making a fresh public install claim.

## Commands

| Command | What it does | Needs |
|---|---|---|
| `onemem init` | Set up OneMem on this machine — zero config | a Sui signer |
| `onemem health` | Check Sui RPC reachability | nothing |
| `onemem dashboard` | Launch the local dashboard on `localhost:4040` or `--port <port>` | `@onemem/dashboard` installed |
| `onemem login` | Pair this terminal with a hosted dashboard callback and save `~/.onemem/credentials.json` | hosted dashboard implementing the callback contract |
| `onemem add <text>` | Store a memory (Seal-encrypted blob on Walrus via MemWal) | signer + MemWal config |
| `onemem search <query>` | Vector-recall memories | signer + MemWal config |
| `onemem list` | List stored memories from the local index (scope-filtered) | signer + MemWal config |
| `onemem get <id>` | Fetch one stored memory by id from the local index | signer + MemWal config |
| `onemem delete <id>` | Soft-delete a memory (the encrypted blob persists on Walrus until its epoch expires) | signer + MemWal config |

Scope flags on `add`/`search`/`list`: `--namespace`, `--user-id`, `--agent-id`,
`--run-id`, `--metadata <json>`. `search`/`list` also take `--top-k`/`--limit`.

Global flags: `--json` (machine output), `--network <testnet\|mainnet\|devnet\|local>`.

`init` resolves a signer the same way the SDK runtime does (env key → Sui
keystore → a generated+persisted wallet). `add`/`search`/`list`/`get`/`delete`
need the signer plus MemWal env (`onemem add` prints exactly which vars are
missing). `delete` is a soft-delete in the local index — MemWal 0.0.7 is
append-only, so a true hard delete is not possible.

Full command spec: `docs/05-our-architecture/05-cli/command-surface.md`.
