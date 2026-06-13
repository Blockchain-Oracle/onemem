# @onemem/oc-onemem

OneMem plugin for **OpenClaw** — a strict superset of Mysten's `oc-memwal`:
delegates to it for Walrus-backed memory, then **adds a verifiable on-chain
trace** (each agent run → a OneMem `TraceSession` of Merkle-chained
`ActionCall`s).

## How it works

OpenClaw discovers the plugin via `package.json` → `openclaw.extensions`. On
`register(api)` it:
1. calls `ocMemwal.register(api)` — all Walrus memory (recall + capture);
2. registers OneMem trace hooks on the real OpenClaw events:
   - `agent_start` → open a OneMem TraceSession (in-memory, keyed by session);
   - `tool_execution_end` / `tool_call` → buffer the tool call (instant);
   - `agent_end` → flush buffered calls as Seal-encrypted, Walrus-stored,
     Merkle-chained `ActionCall`s + close the session.

All trace work is defensive — a OneMem failure never breaks the agent.

## Configure (env)

`ONEMEM_NAMESPACE_ID` + `ONEMEM_RW_CAP_ID` (record target), `ONEMEM_PRIVATE_KEY`
(else sui keystore), `SUI_NETWORK`. Without them, trace is inert (memory still
works).

## Status

Built + typechecks/builds against the real `openclaw` (2026.6.6) + `oc-memwal`
(0.0.4); OpenClaw's installer accepts the manifest. The live agent-turn e2e
needs a **self-contained install** — OpenClaw's deep security scan rejects pnpm
workspace symlinks, so it requires the plugin published (with `@onemem/sdk-ts`
on npm) or installed from a deps-bundled tarball. Tracked for the npm-publish
milestone.

Spec: `docs/05-our-architecture/03-runtimes/openclaw-plugin.md`.
