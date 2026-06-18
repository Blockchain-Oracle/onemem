# @onemem/claude-code-plugin

OneMem plugin for Claude Code — turns each Claude Code session's tool calls into
a **verifiable on-chain trace** (Merkle-chained `ActionCall`s on Sui, content
Seal-encrypted on Walrus). Coexists with claude-mem (semantic memory) — OneMem
owns verifiable on-chain trace; claude-mem owns local conversation summary.

## How it works (hooks)

| Hook | Script | What it does |
|---|---|---|
| `SessionStart` | `inject.js` | Opens a OneMem `TraceSession`, persists the mapping |
| `PostToolUse` | `observe.js` | Buffers the tool call locally — **instant**, never blocks Claude |
| `SessionEnd` | `summarize.js` | Flushes the buffer on-chain (one `ActionCall` per tool, Seal-encrypted → Walrus) + closes the session |

Buffering keeps the editor responsive; the on-chain work happens once at session
end, producing one tamper-evident trace you can verify or share.

## Configure (env)

- `ONEMEM_NAMESPACE_ID` + `ONEMEM_RW_CAP_ID` — the OneMem namespace + ReadWrite
  cap to record into (required; the plugin no-ops without them).
- `ONEMEM_PRIVATE_KEY` — `suiprivkey1…` signer (else the sui keystore's first key).
- `SUI_NETWORK` — `testnet` (default) | `mainnet` | …

## Install From The Public Repository Marketplace

```bash
claude plugin marketplace add Blockchain-Oracle/onemem
claude plugin install onemem@onemem
```

**Publication/proof note, 2026-06-18:** this GitHub marketplace path is the
current install surface. `pnpm registry:status` reports
`@onemem/claude-code-plugin@0.1.0` as missing from npm. The gated
`tests/plugin.integration.test.ts` script can prove a simulated
SessionStart→PostToolUse→SessionEnd lifecycle on testnet when
`ONEMEM_INTEGRATION=1`, but a trusted live Claude Code client hook session is a
separate proof boundary.

This GitHub marketplace path requires `.claude-plugin/marketplace.json` and
`packages/plugin-claude-code/` to be present on the repository branch Claude Code
fetches.

## Install From A Local Checkout During Development

```bash
claude plugin marketplace add /absolute/path/to/onemem
claude plugin install onemem@onemem
```

Spec: `docs/05-our-architecture/03-runtimes/claude-code-plugin.md`.
