# @onemem/oc-onemem

OneMem plugin for **OpenClaw** — a strict superset of Mysten's `oc-memwal`:
delegates to it for Walrus-backed memory, then **adds a verifiable on-chain
trace** (each agent run → a OneMem `TraceSession` of Merkle-chained
`ActionCall`s).

## How it works

OpenClaw discovers the plugin via `package.json` → `openclaw.extensions`. On
`register(api)` it:
1. calls `ocMemwal.register(api)` — all Walrus memory (recall + capture);
2. registers OneMem trace hooks via `api.on(...)` on the real OpenClaw
   lifecycle events:
   - `after_tool_call` → buffer the tool call (instant);
   - `llm_output` → buffer the model response when no OpenClaw tool event fires;
   - `agent_end` → flush buffered calls as Seal-encrypted, Walrus-stored,
     Merkle-chained `ActionCall`s inside one TraceSession, then close it.

`session_start` is not relied on because it is not consistently exposed across
OpenClaw host versions; on-chain work is deferred until `agent_end`.

All trace work is defensive — a OneMem failure never breaks the agent.

## Install (zero-config)

```bash
openclaw plugins install @onemem/oc-onemem   # 1) install
npx @onemem/oc-onemem init                    # 2) one-line setup
openclaw gateway run                          # 3) run — first agent turn auto-provisions
```

That's it. On the first agent run the plugin **auto-provisions** a OneMem
namespace + ReadWrite cap and a signer, persisting them under `~/.onemem/` (same
spirit as the OneMem MCP auto-creating its account). Nothing to copy.

**Why `init`?** It grants the *one* thing OpenClaw's security model won't let a
plugin self-enable: conversation-access for lifecycle hooks (a privacy opt-in, by
design). `init` writes `plugins.entries.oc-onemem.{enabled, hooks.allowConversationAccess}`
+ allowlist. It honors `--dev`, `--profile <name>`, and `OPENCLAW_CONFIG_PATH`.

The manifest also declares `activation.onCapabilities: ["hook"]`, which is what
makes the agent runtime load the plugin in `full` mode so `api.on(...)` hooks
dispatch. Traces are recorded by the **gateway** runtime, not a one-shot
embedded run.

### Overrides (optional)

`api.pluginConfig` then env take precedence over auto-provisioning:
`namespaceId`/`ONEMEM_NAMESPACE_ID`, `rwCapId`/`ONEMEM_RW_CAP_ID`,
`network`/`SUI_NETWORK`, `privateKey`/`ONEMEM_PRIVATE_KEY`. The signer resolves
as: `privateKey` → sui keystore → generated+persisted wallet.

## Status

Live-verified end-to-end on Sui testnet (2026-06-14): an OpenClaw gateway agent
turn produced TraceSession
`0x2b38e255202579f91575075e13b966e15e9b80afdc6fe7f0716f29909fd934ee`
(`agent_id=openclaw`, closed, Merkle-chained ActionCall, Walrus blob + Seal).
Published to npm (with `@onemem/sdk-ts`) so it installs self-contained into an
OpenClaw profile (OpenClaw's security scan rejects pnpm workspace symlinks).

Spec: `docs/05-our-architecture/03-runtimes/openclaw-plugin.md`.
