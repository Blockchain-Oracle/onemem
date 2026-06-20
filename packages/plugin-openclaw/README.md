# @onemem/oc-onemem

OneMem plugin for **OpenClaw** — a superset of Mysten's `oc-memwal`: it delegates
to oc-memwal for Walrus-backed decentralized memory (recall + capture), and adds
a **live local capture feed** — each agent run's tool/LLM calls are posted as
readable observations to the local OneMem worker (the same alive local feed the
Claude Code / Codex plugins write to).

## How it works

OpenClaw discovers the plugin via `package.json` → `openclaw.extensions`. On
`register(api)` it:

1. calls `ocMemwal.register(api)` — all Walrus-backed memory (recall + capture)
   when oc-memwal is present;
2. posts readable observations to the local OneMem worker (`127.0.0.1:4041`) on
   the OpenClaw lifecycle events:
   - `after_tool_call` → post the dispatched tool call as an observation;
   - `llm_output` → post the model response as an observation;
   - `agent_end` → mark the worker session ended.

All capture work is defensive and off the host's critical path — a worker that's
down never breaks the agent.

## Install (zero-config)

```bash
openclaw plugins install @onemem/oc-onemem   # 1) install
npx @onemem/oc-onemem init                    # 2) one-line setup
openclaw gateway run                          # 3) run
```

**Why `init`?** It grants the *one* thing OpenClaw's security model won't let a
plugin self-enable: conversation-access for lifecycle hooks (a privacy opt-in, by
design). `init` writes `plugins.entries.oc-onemem.{enabled, hooks.allowConversationAccess}`
+ allowlist. It honors `--dev`, `--profile <name>`, and `OPENCLAW_CONFIG_PATH`.

The manifest also declares `activation.onCapabilities: ["hook"]`, which is what
makes the agent runtime load the plugin in `full` mode so `api.on(...)` hooks
dispatch. Observations are captured by the **gateway** runtime, not a one-shot
embedded run.

### Configure

The capture feed talks to the local worker (`ONEMEM_WORKER_URL`, default
`http://127.0.0.1:4041`). Walrus-backed memory uses oc-memwal's own config.

Spec: `docs/05-our-architecture/03-runtimes/openclaw-plugin.md`.
