# Claude Code Plugin — `@onemem/claude-code-plugin`

> Current note, 2026-06-17: this is a historical design document with updated
> package-reality notes. The implementation truth is `packages/plugin-claude-code/`.

OneMem's Claude Code plugin. Native `.claude-plugin/plugin.json` + hooks. **Coexists with claude-mem** (different storage backend, same hook events fire on both; no conflict).

Source-of-truth references:
- `../../02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` — claude-mem hook contract (the reference pattern)
- `../../02-inspirations/claude-mem/README.md` — claude-mem architecture
- `../../03-target-runtimes/README.md` — Claude Code plugin manifest contract

---

## Package layout

```
onemem-claude-code-plugin/
├── .claude-plugin/
│   └── plugin.json
├── hooks/
│   └── hooks.json
├── scripts/
│   ├── observe.js                     # PostToolUse → buffer locally
│   ├── inject.js                      # SessionStart → open TraceSession
│   └── summarize.js                   # SessionEnd → flush calls + close session
├── package.json
└── README.md
```

---

## `plugin.json` manifest

```json
{
  "name": "onemem",
  "version": "0.1.0",
  "description": "Verifiable agent memory + action trace for Claude Code, backed by Sui + Walrus + Seal + MemWal",
  "repository": "https://github.com/onemem/claude-code-plugin",
  "license": "Apache-2.0",
  "keywords": ["memory", "trace", "verifiability", "walrus", "sui", "memwal", "mcp", "hooks"],
  "homepage": "https://onemem.ai",
  "documentation": "https://docs.onemem.ai/runtimes/claude-code"
}
```

---

## `hooks/hooks.json`

Mirrors claude-mem's hook structure (per `HOOKS_AND_VIEWER_REFERENCE.md`). Same events; different backend.

```json
{
  "hooks": {
    "SessionStart": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/inject.js" }] }
    ],
    "PostToolUse": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/observe.js" }] }
    ],
    "SessionEnd": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/summarize.js" }] }
    ]
  }
}
```

**Coexistence with claude-mem:** Claude Code runs every matching hook. If user has both claude-mem AND onemem installed, BOTH `observe.js`s fire on PostToolUse — claude-mem writes to its local SQLite, onemem writes to Walrus + Sui. No conflict, no shared state.

---

## Hook script contracts

The snippets below are original design sketches, not current package source.
Use `packages/plugin-claude-code/scripts/` for implementation details.

Each hook script receives the Claude Code event payload via stdin (JSON) + standard env vars (`PLUGIN_ROOT`, `PLUGIN_DATA`, `CLAUDE_PLUGIN_ROOT`). Output JSON on stdout. Exit 0 = success, 1 = failure, 2 = blocking error, 3 = user-message-only (per claude-mem convention).

### `scripts/observe.js` (the workhorse — captures every tool call)

```js
#!/usr/bin/env node
// scripts/observe.js pre  → opens an ActionCall (PENDING)
// scripts/observe.js post → closes the ActionCall (SUCCESS/FAILURE)

import { OneMem } from "@onemem/sdk-ts";
import { readStdinJson, writeStdoutJson, readCredentials } from "./util.js";

const mode = process.argv[2]; // "pre" | "post"
const event = await readStdinJson();
const creds = readCredentials();

if (!creds) {
  // worker-unavailable pattern: exit 0 silently (don't block the user)
  process.exit(0);
}

const client = await OneMem.create({
  key: creds.delegateKey,
  accountId: creds.accountId,
  serverUrl: "https://relayer.memwal.ai",
  namespaceId: creds.activeNamespaceId,
  agentId: `claude-code-${event.claudeCodeVersion}`,
  environment: process.env.ONEMEM_ENV ?? "production",
  network: "mainnet",
});

const sessionId = await getOrStartSession(client, event.sessionId);

if (mode === "pre") {
  const { callId } = await client.trace.appendCall(sessionId, {
    toolName: event.tool.name,
    toolNamespace: "claude-code-builtin",
    input: event.tool.input,
    parentCallId: getCurrentParentCallId(),
    label: event.tool.label ?? null,
  });
  cachePendingCall(event.tool.id, callId);
  writeStdoutJson({ decision: "approve" }); // don't block
} else {
  const pendingCallId = lookupPendingCall(event.tool.id);
  await client.trace.closeCall(sessionId, pendingCallId, {
    output: event.tool.output,
    events: event.tool.errors ? [{ kind: "EXCEPTION", message: String(event.tool.errors), timestamp: Date.now() }] : [],
  }, event.tool.status === "success" ? "SUCCESS" : "FAILURE");
  writeStdoutJson({ decision: "approve" });
}
```

### `scripts/inject.js` (SessionStart + UserPromptSubmit + PreToolUse(Read))

```js
// inject.js context | session-init | file-context

import { OneMem } from "@onemem/sdk-ts";

const mode = process.argv[2];
const event = await readStdinJson();
const client = await getClient();

if (mode === "context" || mode === "session-init") {
  // Recall recent + relevant memories for project context
  const { results } = await client.search(
    event.projectPath ?? "general",
    { topK: 5, threshold: 0.3, contextTier: "L0" }
  );
  const contextBlock = formatMemoriesAsPreamble(results);
  writeStdoutJson({
    decision: "approve",
    systemMessage: contextBlock, // injected as preamble
  });
} else if (mode === "file-context") {
  // PreToolUse(Read): inject memory relevant to the file about to be read
  const filePath = event.tool.input.file_path;
  const { results } = await client.search(filePath, { topK: 3, threshold: 0.4 });
  writeStdoutJson({
    decision: "approve",
    systemMessage: formatMemoriesAsPreamble(results),
  });
}
```

### `scripts/summarize.js` (SessionEnd)

```js
// SessionEnd → end session + optionally extract + write a session summary memory

const event = await readStdinJson();
const client = await getClient();
const sessionId = getCurrentSessionId(event);

if (sessionId) {
  await client.trace.endSession(sessionId, "COMPLETED");
  
  // Optional: extract durable facts from session and save as memories
  if (process.env.ONEMEM_AUTO_SUMMARIZE !== "false") {
    const summary = await summarizeViaHaiku(event.transcript);  // calls Anthropic
    for (const fact of summary.durableFacts) {
      await client.add(fact, { memoryClass: "semantic", contextTier: "L1" });
    }
  }
}
```

### `scripts/learn-codebase.js` (slash command — `/onemem learn-codebase`)

Mirrors claude-mem's `/learn-codebase`. 21 lines of system-prompt text per claude-mem; we adopt the same minimal pattern (no fancy chunking pipeline).

```js
// Outputs a system prompt instructing Claude Code to walk the repo + remember findings.
writeStdoutJson({
  decision: "approve",
  systemMessage: `Walk the current project. For each significant file, briefly summarize what it does + add the summary as a OneMem semantic memory via the onemem_add_memory MCP tool. Skip node_modules, dist, build, .git. Aim for ~30-50 high-signal memories.`,
});
```

### `scripts/compat-check.js` (Setup)

```js
// Verify OneMem SDK + relayer are compatible at plugin load time.
// Surfaces clear "upgrade" message if SDK is behind minSupportedSdk.
```

---

## MCP slash commands

In addition to hooks, the plugin ships an MCP server (`mcp/server.js`) exposing slash commands:

| Slash command | MCP tool | Action |
|---|---|---|
| `/onemem login` | (CLI fallback; not MCP) | Launches browser → wallet → writes `~/.onemem/credentials.json` |
| `/onemem learn-codebase` | (handled by `scripts/learn-codebase.js`) | Walks repo + writes memories |
| `/onemem search <query>` | `onemem_search_memory` | Returns matching memories |
| `/onemem trace <session-id>` | `onemem_trace_session` | Renders trace tree in chat |
| `/onemem verify <session-id>` | `onemem_verify_trace` | Walks Merkle chain + reports status |
| `/onemem dashboard` | (CLI: `onemem dashboard`) | Launches local dashboard at `localhost:4040` |
| `/onemem share <recipient>` | `onemem_share_namespace` | Mints cap + transfers via Enoki gasless tx |

---

## Worker-availability pattern (lifted from claude-mem)

Per `HOOKS_AND_VIEWER_REFERENCE.md`: if the OneMem relayer is unreachable, hooks **exit 0 silently** rather than blocking the user. The Claude Code session continues without memory + trace; observations are dropped.

No `CAPTURE_BROKEN` marker file at v0.1 (claude-mem's pattern for Bun empty-stdin). If we need this, add in v0.2.

---

## Install + distribution

```
# In Claude Code REPL:
/plugin marketplace add onemem/claude-code-plugin
/plugin install onemem

# Then login (first time):
/onemem login
# (browser opens → user signs in via wallet → MemWalAccount created → credentials saved)

# Start using:
# Just keep working. OneMem captures every tool call, recalls relevant memory automatically.

# Open dashboard:
/onemem dashboard
# (launches localhost:4040 with trace tree of current session)
```

Distribution channels:
- Anthropic plugin marketplace
- GitHub: `onemem/claude-code-plugin`
- npm: `@onemem/claude-code-plugin`

---

## Performance budget

Each hook must complete in <500ms p95 (Claude Code's soft timeout). Heavy work (Seal encrypt, Walrus upload, Sui tx) happens via the relayer; SDK calls return quickly. If a tx is slow to confirm, the SDK returns once the Walrus blob is up and the PTB is submitted; final confirmation happens async.

Async confirmation pattern: hook fires "fire-and-forget" SDK call, returns `{ decision: "approve" }`. SDK handles retries + confirms in background. If Sui tx fails permanently, SDK writes to local error log; next Setup hook surfaces it.

---

## Coexistence with claude-mem (explicit)

Both plugins:
- Match the same `Setup`/`SessionStart`/`UserPromptSubmit`/`PreToolUse`/`PostToolUse`/`Stop` events
- Run independently in their own processes
- Don't share state (claude-mem → `~/.claude-mem/`, onemem → `~/.onemem/`)

What's different in onemem vs claude-mem:
- Storage: Walrus encrypted vs SQLite local
- Verifiability: on-chain Merkle chain vs nothing
- Cross-device: yes (Walrus) vs no (local SQLite)
- Cross-runtime: yes (same Walrus namespace works in Hermes, OpenClaw, etc) vs no (Claude Code-only)
- Sharing: Sui capability transfer vs nothing
- License: both Apache-2.0

What's similar:
- Hook contract (we adopt verbatim)
- `/learn-codebase` slash command pattern
- Worker-unavailable silent-exit pattern
- AGPL → Apache compatibility (no concerns)

---

## Known gotchas

- **OneMem requires a MemWalAccount on Sui mainnet** before the plugin works. `/onemem login` handles minting if the user doesn't have one.
- **Active namespace selection** — user can have multiple namespaces. `/onemem set-namespace <id>` switches. Default is the most-recently-active.
- **First Sui write costs gas** (~$0.001). All subsequent writes go through delegate-key authorization; user signs once on login.
- **Hook scripts must be Node.js** (not Bun) for compatibility — claude-mem has a tracked Bun empty-stdin issue. Node.js works fine.

---

## Cross-references

- `README.md` (this folder) — runtime matrix + design principles
- `mcp-server.md` — `@onemem/mcp` server (shared with other runtimes)
- `../02-sdks/shared-api-surface.md` — SDK methods called from hooks
- `../01-protocol/events-and-attestation.md` — what events get emitted per hook
- `../../02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` — claude-mem's hook reference (the pattern we mirror)
