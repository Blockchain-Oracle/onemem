# HOOKS_AND_VIEWER_REFERENCE — claude-mem v12.6.2

Paste-ready snippets + complete enumeration of every surface the OneMem Claude Code plugin
(Pillar 3) needs to mirror or interoperate with.

**Source paths cited inline.** All excerpts © Alex Newman / `thedotmack`, Apache-2.0 — quoted for
research only. OneMem implementation must be clean-room.

---

## 1. Hook manifest (`plugin/hooks/hooks.json`)

Six events, all `type: command`, `shell: bash`. Each hook line resolves `$CLAUDE_PLUGIN_ROOT`,
shells out to `bun-runner.js` which runs `worker-service.cjs` with the matching
`hook <platform> <event>` subcommand. Source: `~/.claude/plugins/cache/thedotmack/claude-mem/12.6.2/hooks/hooks.json`.

**Verbatim, with shell command abbreviated to `<RUN>` for readability** (the actual command is
the `export PATH=… ; _R=… ; node "$_R/scripts/bun-runner.js" "$_R/scripts/worker-service.cjs"` boilerplate):

```json
{
  "description": "Claude-mem memory system hooks",
  "hooks": {
    "Setup":            [{"matcher": "*",                       "hooks": [{"type":"command","shell":"bash","command":"<RUN> version-check.js",                                     "timeout": 300}]}],
    "SessionStart":     [{"matcher": "startup|clear|compact",   "hooks": [
        {"type":"command","shell":"bash","command":"<RUN> worker-service.cjs start; echo '{\"continue\":true,\"suppressOutput\":true}'", "timeout": 60},
        {"type":"command","shell":"bash","command":"<RUN> worker-service.cjs hook claude-code context",                                  "timeout": 60}
    ]}],
    "UserPromptSubmit": [{                                       "hooks": [{"type":"command","shell":"bash","command":"<RUN> worker-service.cjs hook claude-code session-init", "timeout":  60}]}],
    "PostToolUse":      [{"matcher": "*",                        "hooks": [{"type":"command","shell":"bash","command":"<RUN> worker-service.cjs hook claude-code observation",  "timeout": 120}]}],
    "PreToolUse":       [{"matcher": "Read",                     "hooks": [{"type":"command","shell":"bash","command":"<RUN> worker-service.cjs hook claude-code file-context", "timeout":  60}]}],
    "Stop":             [{                                       "hooks": [{"type":"command","shell":"bash","command":"<RUN> worker-service.cjs hook claude-code summarize",    "timeout": 120}]}]
  }
}
```

**OneMem mapping (proposed verbatim of this contract):**

| Claude Code event | Our subcommand | What we do |
|---|---|---|
| `Setup` | `onemem version-check` | Validate MemWal credentials + Sui RPC reachability |
| `SessionStart` | `onemem context-inject` | Pull recent `ActionCall` events for project, fetch Walrus blobs, decrypt via Seal, inject |
| `UserPromptSubmit` | `onemem session-init` | Allocate namespace + start `AgentSession` Sui object |
| `PreToolUse` (Read) | `onemem file-context` | Inject prior observations about the file being read |
| `PostToolUse` | `onemem capture` | Append `ActionCall` (Sui) + Walrus blob + Seal-encrypted payload |
| `Stop` | `onemem summarize` | Compress session, emit `SessionSummary` + close the Merkle chain |

---

## 2. Hook payload contract (Claude Code → worker)

Stdin JSON shape Claude Code pipes to every hook (from `src/cli/adapters/claude-code.ts`):

```ts
interface ClaudeCodeHookInput {
  session_id:        string;
  cwd:               string;        // current project root
  prompt?:           string;        // present on UserPromptSubmit / SessionStart
  tool_name?:        string;        // present on PreToolUse / PostToolUse
  tool_input?:       any;           // present on PreToolUse / PostToolUse
  tool_response?:    any;           // present on PostToolUse only
  transcript_path?:  string;        // path to .jsonl session transcript
  agent_id?:         string;        // <= 128 chars
  agent_type?:       string;        // <= 128 chars
  hook_event_name?:  string;        // e.g. "SessionStart"
  stop_hook_active?: boolean;       // present in Stop event
}
```

Normalized via per-runtime adapters into a common shape (`src/cli/types.ts`):

```ts
interface NormalizedHookInput {
  sessionId?:     string;
  cwd:            string;
  prompt?:        string;
  toolName?:      string;
  toolInput?:     any;
  toolResponse?:  any;
  transcriptPath?:string;
  agentId?:       string;
  agentType?:     string;
  platform:       'claude-code' | 'cursor' | 'gemini-cli' | 'windsurf' | 'raw';
  filePath?:      string;
  edits?:         any[];
  metadata?:      Record<string, unknown>;
}
```

---

## 3. Hook response contract (worker → Claude Code)

The worker prints one JSON object on stdout (consumed by Claude Code). Four legal shapes:

```jsonc
// No-op (silent success — default)
{"continue": true, "suppressOutput": true}

// SessionStart / UserPromptSubmit context injection
{
  "continue": true,
  "suppressOutput": true,
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<rendered preamble>"
  },
  "systemMessage": "View Observations Live @ http://localhost:37777"
}

// PreToolUse file-context with permission decision
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "<file-specific recall>",
    "permissionDecision": "allow"
  }
}

// Explicit exit code (rare — worker normally lets bash exit 0 implicitly)
{"continue": true, "suppressOutput": true, "exitCode": 0}
```

**Exit codes** (`src/shared/hook-constants.ts`):
```ts
export const HOOK_EXIT_CODES = {
  SUCCESS:           0,
  FAILURE:           1,
  BLOCKING_ERROR:    2,
  USER_MESSAGE_ONLY: 3,
} as const;
```

**Worker-down failure mode** is deliberately silent. From `src/cli/hook-command.ts:84-90`:
```ts
if (isWorkerUnavailableError(error)) {
  logger.warn('HOOK', `Worker unavailable, skipping hook`);
  if (!options.skipExit) process.exit(HOOK_EXIT_CODES.SUCCESS);  // exit 0 — never block the user
  return HOOK_EXIT_CODES.SUCCESS;
}
```

`isWorkerUnavailableError` triggers on `ECONNREFUSED|ECONNRESET|EPIPE|ETIMEDOUT|ENOTFOUND|
ECONNABORTED|ENETUNREACH|EHOSTUNREACH|"fetch failed"|"socket hang up"`, any timeout message, any
`5xx`, and `429`.

---

## 4. Worker daemon — complete REST API surface

`scripts/worker-service.cjs` (2.9 MB bundled, 2,079 lines minified) is an Express 4 app.

- **Binding:** `127.0.0.1:37777` (overridable via `CLAUDE_MEM_WORKER_HOST` / `CLAUDE_MEM_WORKER_PORT`).
- **Auth:** none. Localhost-only CORS (`src/services/worker/http/middleware.ts:15-28`). Admin endpoints further gated by `requireLocalhost` middleware.
- **Body limit:** `express.json({ limit: '5mb' })`.
- **Static:** `express.static(plugin/ui/)` serves `viewer.html`, `viewer-bundle.js`, fonts, icons.
- **Transport:** vanilla HTTP + **one SSE endpoint** at `GET /stream`. No WebSocket. No long-poll.

### 4.1 Core / admin (`src/services/server/Server.ts`)

| Method | Path | Purpose |
|---|---|---|
| GET    | `/api/health`              | Full status object: `{status, version, workerPath, uptime, managed, hasIpc, platform, pid, initialized, mcpReady, ai, rateLimits}` |
| GET    | `/api/readiness`           | 200 `{status:'ready', mcpReady}` once init complete; else 503 `{status:'initializing'}` |
| GET    | `/api/version`             | `{version}` |
| GET    | `/api/instructions`        | Returns SKILL.md content; supports `?topic=workflow|search_params|examples|all` and `?operation=<allowed-op>` |
| POST   | `/api/admin/restart`       | (`requireLocalhost`) Restart wrapper-managed worker |
| POST   | `/api/admin/shutdown`      | (`requireLocalhost`) Graceful shutdown |
| GET    | `/api/admin/doctor`        | (`requireLocalhost`) Supervisor process tree + env-sanitization status |

### 4.2 Viewer / SSE (`src/services/worker/http/routes/ViewerRoutes.ts`)

| Method | Path | Purpose |
|---|---|---|
| GET    | `/`        | Serve cached `viewer.html` (read once at boot) |
| GET    | `/health`  | Viewer-side health: `{status, timestamp, activeSessions}` |
| GET    | `/stream`  | **SSE** — `text/event-stream`, sends `connected` + `initial_load` + `processing_status` on connect, then `new_observation | new_summary | new_prompt | processing_status` events |

### 4.3 Session lifecycle (`SessionRoutes.ts`)

| Method | Path | Purpose |
|---|---|---|
| POST   | `/api/sessions/init`            | Allocate `sessionDbId`, return `{sessionDbId, promptNumber, skipped, contextInjected}` |
| POST   | `/api/sessions/observations`    | Append a tool-call observation to the session's queue |
| POST   | `/api/sessions/summarize`       | Trigger end-of-session compression |
| GET    | `/api/sessions/status`          | Per-claude-id status |

### 4.4 Data retrieval (`DataRoutes.ts`)

| Method | Path | Purpose |
|---|---|---|
| GET    | `/api/observations`              | Paginated observation list |
| GET    | `/api/observation/:id`           | Single observation |
| GET    | `/api/observations/by-file`      | Observations filtered by file path |
| POST   | `/api/observations/batch`        | Bulk fetch by IDs |
| POST   | `/api/sdk-sessions/batch`        | Bulk SDK-session fetch |
| GET    | `/api/summaries`                 | Paginated session summaries |
| GET    | `/api/prompts`                   | Paginated user prompts |
| GET    | `/api/prompt/:id`                | Single prompt |
| GET    | `/api/session/:id`               | Single session |
| GET    | `/api/projects`                  | All known projects |
| GET    | `/api/stats`                     | DB counts, usage stats |
| GET    | `/api/processing-status`         | Live worker queue depth |
| POST   | `/api/processing`                | Toggle processing on/off |
| POST   | `/api/import`                    | Import legacy data |

### 4.5 Search (`SearchRoutes.ts`)

| Method | Path | Purpose |
|---|---|---|
| GET    | `/api/search`                    | Unified search across observations + sessions + prompts |
| GET    | `/api/search/observations`       | Search observations only |
| GET    | `/api/search/sessions`           | Search sessions only |
| GET    | `/api/search/prompts`            | Search prompts only |
| GET    | `/api/search/by-concept`         | Find by concept tag |
| GET    | `/api/search/by-file`            | Find by file path |
| GET    | `/api/search/by-type`            | Find by observation type |
| GET    | `/api/search/help`               | Search syntax help |
| GET    | `/api/timeline`                  | Unified timeline |
| GET    | `/api/timeline/by-query`         | Timeline filtered by query |
| GET    | `/api/decisions`                 | Decision-typed observations |
| GET    | `/api/changes`                   | Change-typed observations |
| GET    | `/api/how-it-works`              | Skill-style explanations |
| GET    | `/api/context/recent`            | Recent context for injection |
| GET    | `/api/context/timeline`          | Timeline-shaped context |
| GET    | `/api/context/preview`           | Preview the about-to-be-injected context |
| GET    | `/api/context/inject`            | Render the final injection string |
| POST   | `/api/context/semantic`          | Semantic search → context block |
| GET    | `/api/onboarding/explainer`      | Skill-content for the first-session welcome |

### 4.6 Settings + integrations (`SettingsRoutes.ts`, `ChromaRoutes.ts`, `LogsRoutes.ts`, `MemoryRoutes.ts`)

| Method | Path | Purpose |
|---|---|---|
| GET    | `/api/settings`            | Read settings.json |
| POST   | `/api/settings`            | Update settings.json |
| GET    | `/api/mcp/status`          | MCP server state |
| POST   | `/api/mcp/toggle`          | Enable/disable MCP server |
| GET    | `/api/branch/status`       | Git branch info for current project |
| POST   | `/api/branch/switch`       | Switch branch |
| POST   | `/api/branch/update`       | Pull updates on current branch |
| GET    | `/api/chroma/status`       | Chroma vector-DB status |
| GET    | `/api/logs`                | Tail worker logs (polling endpoint, bypasses HTTP logger) |
| POST   | `/api/logs/clear`          | Clear logs |
| POST   | `/api/memory/save`         | Save raw memory entry |

### 4.7 Corpus management (`CorpusRoutes.ts`)

| Method | Path | Purpose |
|---|---|---|
| GET    | `/api/corpus`                       | List corpora |
| GET    | `/api/corpus/:name`                 | Inspect one |
| POST   | `/api/corpus`                       | Build new |
| POST   | `/api/corpus/:name/prime`           | Prime |
| POST   | `/api/corpus/:name/query`           | Query |
| POST   | `/api/corpus/:name/rebuild`         | Rebuild |
| POST   | `/api/corpus/:name/reprime`         | Reprime |
| DELETE | `/api/corpus/:name`                 | Delete |

**Total:** 42 GET + 19 POST + 1 DELETE = **62 `/api` endpoints**, plus `/`, `/health`, `/stream`.

---

## 5. SSE event shape (`/stream`)

`src/services/worker/SSEBroadcaster.ts` writes lines of the form `data: <JSON>\n\n`. Event types
the client listens for (`src/ui/viewer/hooks/useSSE.ts:51-92`):

```ts
type StreamEvent =
  | { type: 'connected'; timestamp: number }
  | { type: 'initial_load'; projects: string[]; sources?: string[];
      projectsBySource?: Record<string, string[]>; timestamp: number }
  | { type: 'new_observation'; observation: Observation }
  | { type: 'new_summary';     summary:     Summary }
  | { type: 'new_prompt';      prompt:      UserPrompt }
  | { type: 'processing_status'; isProcessing: boolean; queueDepth: number };
```

Reconnect strategy in `useSSE.ts:38-48`:
```ts
eventSource.onerror = (error) => {
  setIsConnected(false);
  eventSource.close();
  reconnectTimeoutRef.current = setTimeout(() => connect(), TIMING.SSE_RECONNECT_DELAY_MS);
};
```

---

## 6. Viewer component patterns to clone

### 6.1 Project tree
```
src/ui/viewer/
├── index.tsx              # createRoot + <ErrorBoundary><App/></ErrorBoundary>
├── App.tsx                # All top-level state, merges live + paginated arrays via useMemo
├── components/            # 13 dumb components (Header, Feed, *Card, *Modal, ThemeToggle, …)
├── hooks/                 # 8 custom hooks (useSSE, useSettings, useStats, usePagination, …)
├── constants/api.ts       # Single source of all REST + SSE paths
├── constants/{timing,ui,settings}.ts
├── types.ts
└── utils/{api,data,formatters,formatNumber}.ts
```

### 6.2 Infinite scroll via IntersectionObserver (`Feed.tsx:27-49`)
```tsx
useEffect(() => {
  const element = loadMoreRef.current;
  if (!element) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        onLoadMoreRef.current?.();
      }
    },
    { threshold: UI.LOAD_MORE_THRESHOLD }
  );

  observer.observe(element);
  return () => { observer.unobserve(element); observer.disconnect(); };
}, [hasMore, isLoading]);
```

### 6.3 Type-discriminated SSE dispatch (`useSSE.ts:50-92`)
```ts
eventSource.onmessage = (event) => {
  const data: StreamEvent = JSON.parse(event.data);
  switch (data.type) {
    case 'initial_load':       setProjects(data.projects || []);                       break;
    case 'new_observation':    setObservations(prev => [data.observation!, ...prev]);  break;
    case 'new_summary':        setSummaries(prev => [data.summary!, ...prev]);         break;
    case 'new_prompt':         setPrompts(prev => [data.prompt!, ...prev]);            break;
    case 'processing_status':  setIsProcessing(data.isProcessing);
                               setQueueDepth(data.queueDepth || 0);                    break;
  }
};
```

### 6.4 Central endpoint constants (`constants/api.ts`)
```ts
export const API_ENDPOINTS = {
  OBSERVATIONS:      '/api/observations',
  SUMMARIES:         '/api/summaries',
  PROMPTS:           '/api/prompts',
  SETTINGS:          '/api/settings',
  STATS:             '/api/stats',
  PROCESSING_STATUS: '/api/processing-status',
  STREAM:            '/stream',
} as const;
```

### 6.5 Welcome card with persistent dismissal
Uses `localStorage` key (export `getStoredWelcomeDismissed` + `setStoredWelcomeDismissed` from
the component module).

### 6.6 Style
**No framework.** 76 KB inline CSS in `viewer.html` with `:root` CSS variables for tokens.
Theme switch (`useTheme.ts`) toggles a `data-theme` attribute on `<html>`. Monaspace Radon
embedded as base64. Tasteful, but for OneMem we'll use Tailwind + shadcn for velocity.

---

## 7. Multi-runtime install matrix

Source: `src/npx-cli/commands/install.ts:145-300`. Each `--ide` value triggers a different
installer in `src/services/integrations/`.

| `--ide` value | Installer | Writes |
|---|---|---|
| `claude-code` | (built-in, no separate installer) | `~/.claude/plugins/installed.json` + `enabledPlugins['claude-mem@thedotmack']=true` in `~/.claude/settings.json` |
| `cursor` | `CursorHooksInstaller.installCursorHooks` + `configureCursorMcp` | `.cursor/hooks/*.json` + Cursor MCP config |
| `gemini-cli` | `GeminiCliHooksInstaller.installGeminiCliHooks` | Merges `hooks` block into `~/.gemini/settings.json` + writes context to `~/.gemini/GEMINI.md` |
| `opencode` | `OpenCodeInstaller.installOpenCodeIntegration` | OpenCode plugin manifest |
| `windsurf` | `WindsurfHooksInstaller.installWindsurfHooks` | Windsurf hook entries |
| `openclaw` | `OpenClawInstaller.installOpenClawIntegration` | Copies pre-built `openclaw/dist/` bundle to `~/.openclaw/extensions/claude-mem/` + registers in `~/.openclaw/openclaw.json` |
| `codex-cli` | `CodexCliInstaller.installCodexCli` | Adds `codex` schema + watch entry to `~/.claude-mem/transcript-watch.json` + writes `<claude-mem-context>` block into `~/.codex/AGENTS.md` |
| `copilot-cli` / `antigravity` / `goose` / `roo-code` / `warp` | `McpIntegrations.MCP_IDE_INSTALLERS[id]` | MCP-config-only |

### 7.1 Gemini-CLI event-name mapping (`GeminiCliHooksInstaller.ts:36-44`)
```ts
const GEMINI_EVENT_TO_INTERNAL_EVENT: Record<string, string> = {
  'SessionStart':  'context',
  'BeforeAgent':   'session-init',
  'AfterAgent':    'observation',
  'BeforeTool':    'observation',
  'AfterTool':     'observation',
  'PreCompress':   'summarize',
  'Notification':  'observation',
};
```
Each generates a hook entry `{name:'claude-mem', type:'command', command:'"<bun>" "<worker-service>" hook gemini-cli <internal-event>', timeout: 10000}`.

### 7.2 OpenClaw install (`OpenClawInstaller.ts:108-142`)
```ts
config.plugins.slots.memory = 'claude-mem';
config.plugins.entries['claude-mem'] = {
  enabled: true,
  config: { workerPort, project, syncMemoryFile },
};
```
Plus the synthetic `package.json` declaring `openclaw.extensions: ['./dist/index.js']`.

---

## 8. SQLite schema (`src/services/sqlite/migrations.ts`)

The tables OneMem's read-cache needs to be aware of (we won't read claude-mem's DB — Apache-2.0 — but
the schema is good reference for our own local mirror):

```sql
CREATE TABLE sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id      TEXT UNIQUE NOT NULL,
  project         TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  created_at_epoch INTEGER NOT NULL,
  source          TEXT NOT NULL DEFAULT 'compress',
  archive_path    TEXT,
  archive_bytes   INTEGER,
  archive_checksum TEXT,
  archived_at     TEXT
);

CREATE TABLE memories (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id       TEXT NOT NULL,
  text             TEXT NOT NULL,
  document_id      TEXT UNIQUE,
  keywords         TEXT,
  created_at       TEXT NOT NULL,
  created_at_epoch INTEGER NOT NULL,
  project          TEXT NOT NULL,
  archive_basename TEXT,
  origin           TEXT NOT NULL DEFAULT 'transcript'
);

CREATE TABLE observations (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  memory_session_id TEXT NOT NULL,
  project          TEXT NOT NULL,
  text             TEXT NOT NULL,
  type             TEXT NOT NULL,
  created_at       TEXT NOT NULL,
  created_at_epoch INTEGER NOT NULL,
  FOREIGN KEY(memory_session_id) REFERENCES sdk_sessions(memory_session_id) ON DELETE CASCADE
);

CREATE TABLE sdk_sessions (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  content_session_id  TEXT UNIQUE NOT NULL,
  memory_session_id   TEXT UNIQUE,
  project             TEXT NOT NULL,
  status              TEXT NOT NULL,
  started_at_epoch    INTEGER NOT NULL
);

CREATE TABLE observation_queue (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  memory_session_id   TEXT NOT NULL,
  payload             TEXT NOT NULL,
  processed_at_epoch  INTEGER
);
```

Plus `overviews`, `diagnostics`, `transcript_events`, `streaming_sessions`, `schema_versions`,
and `PendingMessageStore`.

---

## 9. Boot lifecycle + recovery

1. **First touch:** `SessionStart` hook runs (`hooks.json:17-34`). Two sub-hooks fire in order:
   1. `worker-service.cjs start` — `WorkerProcess.start(port)` in `worker-cli.js:5+` writes
      `~/.claude-mem/worker.pid` (`{pid, port, startedAt, version}`), spawns the daemon via
      `bun ./worker-service.cjs` (detached, stdout→`~/.claude-mem/logs/worker-YYYY-MM-DD.log`),
      polls `GET /api/readiness` for up to 10 s (15 s on Windows).
   2. `hook claude-code context` — call `GET /api/context/inject?projects=…&colors=true`, render
      the preamble, emit `{hookSpecificOutput:{hookEventName:'SessionStart', additionalContext}}`.
2. **Per prompt:** `UserPromptSubmit` → `session-init` → `POST /api/sessions/init` allocates DB
   row, then optionally `POST /api/context/semantic` injects per-prompt recall.
3. **Per tool call:** `PostToolUse` → `observation` → `POST /api/sessions/observations`.
4. **File reads:** `PreToolUse Read` → `file-context` → `GET /api/observations/by-file` → inject
   file-specific recall.
5. **Session end:** `Stop` → `summarize` → `POST /api/sessions/summarize`.
6. **Worker dies mid-session:** hook fetches fail → `isWorkerUnavailableError(err)` returns true →
   exit 0 silently. Next `SessionStart` respawns. Stale PID file cleaned by `process.kill(pid,0)`
   liveness check.
7. **Windows worker isolation:** `worker-wrapper.cjs` is a small Node process that forks
   `worker-service.cjs` with IPC; restart/shutdown messages flow `inner → process.send → wrapper`,
   which handles tree-kill via `taskkill /T /F`.

**For OneMem:** items 1, 2, 3, 5, 6, 7 transfer verbatim. Item 4 we keep but the recall is
augmented with the `ActionCall` Merkle-chain verification status (so PreToolUse can warn the user
if a prior observation has been tampered with).

---

## 10. Hooks JSON schema for Gemini CLI (worth copying verbatim)

For OneMem's Gemini-CLI integration day, this is the file we'd merge into `~/.gemini/settings.json`
(adapted from claude-mem's `GeminiCliHooksInstaller.ts`):

```json
{
  "hooks": {
    "SessionStart":  [{"matcher":"*","hooks":[{"name":"onemem","type":"command","command":"<bun> <onemem-worker> hook gemini-cli context",      "timeout":10000}]}],
    "BeforeAgent":   [{"matcher":"*","hooks":[{"name":"onemem","type":"command","command":"<bun> <onemem-worker> hook gemini-cli session-init", "timeout":10000}]}],
    "AfterAgent":    [{"matcher":"*","hooks":[{"name":"onemem","type":"command","command":"<bun> <onemem-worker> hook gemini-cli observation",  "timeout":10000}]}],
    "BeforeTool":    [{"matcher":"*","hooks":[{"name":"onemem","type":"command","command":"<bun> <onemem-worker> hook gemini-cli observation",  "timeout":10000}]}],
    "AfterTool":     [{"matcher":"*","hooks":[{"name":"onemem","type":"command","command":"<bun> <onemem-worker> hook gemini-cli observation",  "timeout":10000}]}],
    "PreCompress":   [{"matcher":"*","hooks":[{"name":"onemem","type":"command","command":"<bun> <onemem-worker> hook gemini-cli summarize",    "timeout":10000}]}],
    "Notification":  [{"matcher":"*","hooks":[{"name":"onemem","type":"command","command":"<bun> <onemem-worker> hook gemini-cli observation",  "timeout":10000}]}]
  }
}
```

Merge strategy: read existing settings.json, deep-merge `hooks.<event>[]` by `hooks[].name`,
write back atomically. Reject if existing JSON is corrupt — never overwrite valid user config.

---

## 11. Cited file paths (so OneMem coding agents can re-open)

All under `~/.claude/plugins/marketplaces/thedotmack/` unless noted:

```
plugin/hooks/hooks.json                                            # Hook manifest (also at ~/.claude/plugins/cache/thedotmack/claude-mem/12.6.2/hooks/hooks.json)
plugin/scripts/bun-runner.js                                       # stdin reader + bun spawn
plugin/scripts/worker-cli.js                                       # start/stop/restart/status CLI
plugin/scripts/worker-wrapper.cjs                                  # Windows wrapper with IPC
plugin/scripts/worker-service.cjs                                  # bundled worker (2.9 MB, sourced from src/services/worker-service.ts)
plugin/.claude-plugin/plugin.json                                  # Plugin manifest
plugin/.mcp.json                                                   # Bundled MCP server (mcp-search)
plugin/skills/learn-codebase/SKILL.md                              # /learn-codebase (21 lines — just instructs Read-everything)
plugin/skills/how-it-works/SKILL.md                                # /how-it-works
src/services/server/Server.ts                                      # Core HTTP server + core routes
src/services/server/Middleware.ts                                  # CORS + localhost gate
src/services/worker/http/middleware.ts                             # Actual middleware impl
src/services/worker/http/routes/{Viewer,Session,Data,Search,Settings,Chroma,Corpus,Logs,Memory}Routes.ts
src/services/worker/SSEBroadcaster.ts                              # SSE fanout
src/services/worker/README.md                                      # Worker architecture doc
src/services/sqlite/migrations.ts                                  # All SQL schemas
src/cli/hook-command.ts                                            # Hook dispatcher + worker-unavailable handling
src/cli/adapters/{claude-code,cursor,gemini-cli,windsurf,raw}.ts   # Per-runtime adapters
src/cli/handlers/{context,session-init,observation,summarize,user-message,file-edit,file-context}.ts
src/npx-cli/commands/install.ts                                    # Install flag dispatcher
src/npx-cli/commands/ide-detection.ts                              # IDE auto-detect
src/services/integrations/{Cursor,GeminiCli,OpenCode,Windsurf,OpenClaw,CodexCli}*.ts + McpIntegrations.ts
src/services/integrations/TelegramNotifier.ts                      # (bonus: end-of-session Telegram pings)
src/ui/viewer/{App.tsx,index.tsx,components/*,hooks/*,utils/*,constants/*,types.ts}
src/shared/hook-constants.ts                                       # HOOK_EXIT_CODES + HOOK_TIMEOUTS
```

---

## License footnote

claude-mem is Apache-2.0 © Alex Newman / `thedotmack`. All excerpts above are reproduced for
research purposes under fair-use as architectural reference. OneMem implementation must be
clean-room: re-implement the contracts and routes from scratch — don't copy source. The hook
event names + JSON payload shapes + REST paths are API surface (non-copyrightable interface);
re-implementing the same interface is the entire point of the coexistence story.
