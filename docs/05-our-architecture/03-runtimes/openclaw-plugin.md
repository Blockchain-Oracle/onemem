# OpenClaw Plugin — `@onemem/oc-onemem`

OneMem's OpenClaw plugin. Uses `@mysten-incubation/oc-memwal` underneath as the storage adapter, adds trace capture + dashboard sync on top.

Source-of-truth: `../../02-inspirations/memwal-incubation/README.md` (oc-memwal teardown) + `../../03-target-runtimes/README.md` (OpenClaw slot pattern).

---

## Why this design (the "complement, never compete" principle in action)

Mysten ships `@mysten-incubation/oc-memwal` as the official OpenClaw memory plugin. We don't compete — we extend. OneMem's OpenClaw plugin:

1. **Depends on** `@mysten-incubation/oc-memwal` (uses Mysten's storage adapter verbatim)
2. **Wraps** the storage hooks with trace emit (`ActionCall` per agent turn)
3. **Adds** dashboard sync (pushes events to local OneMem dashboard at `localhost:4040`)
4. **Adds** namespace-sharing via Sui capability transfer

Net result: user installing `@onemem/oc-onemem` gets EVERYTHING `@mysten-incubation/oc-memwal` gives them + trace + dashboard + share. Strict superset.

---

## Package layout

```
onemem-oc-plugin/
├── package.json
├── openclaw.plugin.json
├── src/
│   ├── index.ts                       # OpenClaw extension entry
│   ├── hooks/
│   │   ├── before_prompt_build.ts     # wraps oc-memwal's recall + adds trace context
│   │   ├── agent_end.ts               # wraps oc-memwal's capture + emits trace.closeCall
│   │   └── agent_turn.ts              # NEW — emits trace.appendCall for the turn
│   ├── tools/
│   │   ├── memory_search.ts           # re-exports oc-memwal's tool
│   │   ├── memory_store.ts            # re-exports oc-memwal's tool
│   │   ├── verify_trace.ts            # NEW — exposes trace verification
│   │   └── replay_session.ts          # NEW — exposes session replay
│   ├── cli/
│   │   ├── search.ts                  # delegates to oc-memwal CLI
│   │   ├── stats.ts                   # delegates to oc-memwal
│   │   ├── login.ts                   # delegates to oc-memwal-mcp's login
│   │   ├── trace.ts                   # NEW — renders trace tree
│   │   ├── verify.ts                  # NEW
│   │   └── dashboard.ts               # NEW — launches localhost:4040
│   ├── services/
│   │   ├── health-check.ts            # mirrors oc-memwal's health-check
│   │   └── dashboard-sync.ts          # NEW — pushes events to local dashboard
│   └── config.ts                      # plugin config schema (extends oc-memwal's)
└── README.md
```

---

## `openclaw.plugin.json` manifest

```json
{
  "id": "memory-onemem",
  "kind": "memory",
  "name": "OneMem (Walrus + Trace + Verify)",
  "description": "Extends MemWal with verifiable cross-runtime action trace, replay, and namespace sharing",
  "license": "Apache-2.0",
  "homepage": "https://onemem.ai",
  "configSchema": {
    "type": "object",
    "required": ["privateKey", "accountId", "serverUrl"],
    "properties": {
      "privateKey": "Ed25519 hex; ${ENV} supported",
      "accountId":  "Sui object id (0x…) — MemWalAccount",
      "serverUrl":  "relayer base URL; default https://relayer.memwal.ai",
      "defaultNamespace": "string, default 'default'",
      "namespaceId": "Sui object ID of MemoryNamespace (OneMem-specific)",
      "agentId": "string identifier (default: 'openclaw/<version>')",
      "autoRecall":  "bool, default true",
      "autoCapture": "bool, default true",
      "autoTrace":   "bool, default true (NEW)",
      "dashboardSync": "bool, default true (NEW)",
      "dashboardPort": "number, default 4040 (NEW)",
      "maxRecallResults": "1..20, default 5",
      "minRelevance": "0..1, default 0.3",
      "captureMaxMessages": "1..50, default 10",
      "environment": "string, default 'production'"
    }
  },
  "uiHints": {
    /* extends oc-memwal's UI hints with the NEW config fields */
  }
}
```

`package.json` declares the OpenClaw extension entry point + the oc-memwal dependency:

```json
{
  "name": "@onemem/oc-onemem",
  "version": "0.1.0",
  "license": "Apache-2.0",
  "main": "./dist/index.js",
  "openclaw": { "extensions": ["./dist/index.js"] },
  "dependencies": {
    "@mysten-incubation/oc-memwal": "^0.x",
    "@onemem/sdk-ts": "^0.1.0"
  }
}
```

---

## Hook integration (the wrap pattern)

### `before_prompt_build` — wraps oc-memwal's recall + adds trace context

```ts
// src/hooks/before_prompt_build.ts
import { handler as ocMemWalRecall } from "@mysten-incubation/oc-memwal/hooks/recall";
import { getOneMemClient, getCurrentSessionId } from "../util";

export async function handler(event: BeforePromptBuildEvent, ctx: PluginContext) {
  // 1. Delegate to oc-memwal's recall (returns prependContext + appendSystemContext)
  const memwalResult = await ocMemWalRecall(event, ctx);

  // 2. Add OneMem-specific trace context to the system message
  const client = await getOneMemClient(ctx.config);
  const sessionId = await getCurrentSessionId(ctx);

  // Append trace info to system context (so the agent knows it's being traced)
  const traceContext = `\n\n[OneMem trace active. Session: ${sessionId}. Every tool call is recorded as an ActionCall on Sui.]`;

  return {
    prependContext: memwalResult.prependContext,
    appendSystemContext: memwalResult.appendSystemContext + traceContext,
  };
}
```

### `agent_turn` (NEW — emits trace.appendCall per tool call)

```ts
// src/hooks/agent_turn.ts
import { getOneMemClient, getCurrentSessionId } from "../util";

export async function handler(event: AgentTurnEvent, ctx: PluginContext) {
  const client = await getOneMemClient(ctx.config);
  const sessionId = await getCurrentSessionId(ctx);

  // For each tool call the agent is about to make, emit appendCall (PENDING)
  for (const toolCall of event.pendingToolCalls) {
    const { callId } = await client.trace.appendCall(sessionId, {
      toolName: toolCall.name,
      toolNamespace: toolCall.namespace ?? "openclaw-builtin",
      input: toolCall.input,
      parentCallId: getCurrentParentCallId(ctx),
      label: toolCall.label,
    });
    cachePendingCall(toolCall.id, callId);
  }
}
```

### `agent_end` — wraps oc-memwal's capture + closes ActionCalls

```ts
// src/hooks/agent_end.ts
import { handler as ocMemWalCapture } from "@mysten-incubation/oc-memwal/hooks/capture";
import { getOneMemClient, getCurrentSessionId } from "../util";
import { syncToLocalDashboard } from "../services/dashboard-sync";

export async function handler(event: AgentEndEvent, ctx: PluginContext) {
  // 1. Delegate to oc-memwal's capture (extracts facts → analyze())
  await ocMemWalCapture(event, ctx);

  // 2. OneMem additions: close each ActionCall this turn produced
  const client = await getOneMemClient(ctx.config);
  const sessionId = await getCurrentSessionId(ctx);

  for (const toolResult of event.toolResults) {
    const pendingCallId = lookupPendingCall(toolResult.id);
    if (!pendingCallId) continue;

    await client.trace.closeCall(sessionId, pendingCallId, {
      output: toolResult.output,
      events: toolResult.errors?.map(e => ({ kind: "EXCEPTION", message: String(e), timestamp: Date.now() })) ?? [],
    }, toolResult.status === "success" ? "SUCCESS" : "FAILURE");
  }

  // 3. Push to local dashboard (if enabled)
  if (ctx.config.dashboardSync) {
    await syncToLocalDashboard(sessionId, event, ctx.config.dashboardPort);
  }
}
```

---

## Tool registrations

```ts
// src/index.ts
import { OpenClawAPI } from "@openclaw/plugin-api";
import * as hooks from "./hooks";
import * as tools from "./tools";
import * as cli from "./cli";

export default function register(api: OpenClawAPI) {
  // Register hooks
  api.registerHook("before_prompt_build", hooks.before_prompt_build.handler);
  api.registerHook("agent_turn", hooks.agent_turn.handler);
  api.registerHook("agent_end", hooks.agent_end.handler);

  // Register tools (re-export oc-memwal's + add OneMem's)
  api.registerTool("memory_search", tools.memory_search);     // re-export
  api.registerTool("memory_store", tools.memory_store);       // re-export
  api.registerTool("verify_trace", tools.verify_trace);       // NEW
  api.registerTool("replay_session", tools.replay_session);   // NEW

  // Register CLI subcommands
  api.registerCli("onemem search", cli.search);
  api.registerCli("onemem stats", cli.stats);
  api.registerCli("onemem login", cli.login);
  api.registerCli("onemem trace", cli.trace);             // NEW
  api.registerCli("onemem verify", cli.verify);           // NEW
  api.registerCli("onemem dashboard", cli.dashboard);     // NEW

  // Health check service (mirrors oc-memwal's pattern)
  api.registerService(async () => {
    const client = await getOneMemClient(api.config);
    const { ok, relayerStatus } = await client.health();
    if (!ok) console.warn(`[onemem] Relayer health degraded: ${relayerStatus}`);
  });
}
```

---

## Dashboard sync (NEW vs oc-memwal)

`src/services/dashboard-sync.ts` POSTs events to the local dashboard's API:

```ts
export async function syncToLocalDashboard(sessionId: string, event: AgentEndEvent, port: number) {
  try {
    await fetch(`http://localhost:${port}/api/events/agent-turn`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, event }),
    });
  } catch (err) {
    // Dashboard not running — silently skip
  }
}
```

If `onemem dashboard` isn't running, the sync silently fails (dashboard isn't required for OneMem to work — it's a viewer).

---

## Slot conflict (with `@mysten-incubation/oc-memwal`)

OpenClaw's `plugins.slots.memory` is mutually exclusive — only ONE memory plugin can be active. Users have a choice:

| Choice | What they get |
|---|---|
| `@mysten-incubation/oc-memwal` | Mysten's reference plugin: storage on Walrus, basic recall/capture |
| `@onemem/oc-onemem` | Strict superset: everything oc-memwal does PLUS trace + verify + replay + dashboard + sharing |

Both can be `installed` simultaneously, but only one is active per the slot config. Switching is one config change. Users who want the surprise features pick `onemem`; users who just want vanilla MemWal pick `oc-memwal`.

The marketing message: "OneMem is oc-memwal + the layers Mysten hasn't built yet."

---

## Install + distribution

```bash
# Install via OpenClaw plugin manager
openclaw plugins install @onemem/oc-onemem

# Set as the memory plugin
openclaw config set plugins.slots.memory memory-onemem

# Login (first time)
openclaw onemem login
# (browser opens → wallet → MemWalAccount + namespace minted)

# Start using
# Just use OpenClaw normally. OneMem captures + traces in the background.

# Open dashboard
openclaw onemem dashboard
```

Distribution: npm + OpenClaw plugin registry.

---

## What we DON'T modify from oc-memwal

- Memory store/recall logic — directly delegated
- Encryption (Seal, server-handled OR /manual) — oc-memwal's choice (we'll override to /manual in config)
- Vector index (pgvector) — oc-memwal's relayer config
- Prompt-injection detection — oc-memwal's `looksLikeInjection` (we don't reinvent)

---

## Known gotchas

- **Slot exclusivity**: if user installs both Mem0 OpenClaw plugin AND OneMem, only one is active. Document clearly in README + error message at install time.
- **oc-memwal version pin**: pin a known-good version. Upgrading oc-memwal mid-cycle could break our wrap.
- **Namespace requires explicit setup**: `openclaw onemem create-namespace <name>` before first use (or auto-create on first capture, behind a config flag).

---

## Cross-references

- `README.md` (this folder)
- `mcp-server.md` — OpenClaw also exposes MCP via its own MCP support; users can also consume `@onemem/mcp` independently
- `../02-sdks/shared-api-surface.md`
- `../../02-inspirations/memwal-incubation/README.md` — oc-memwal source-of-truth
- `../../02-inspirations/memwal-incubation/README.md` — same file; "OpenClaw plugin (`@mysten-incubation/oc-memwal`) Hook contract" section
