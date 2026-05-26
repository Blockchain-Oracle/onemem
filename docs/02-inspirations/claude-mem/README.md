# claude-mem — Inspiration Pack

**Source-of-truth files** (read these for full depth):
- `../../../DEEP_DIVE.md` §4 — viewer architecture + API surface + gap analysis
- `../../../WEDGE_REFINEMENT.md` "claude-mem architecture" section — hook contract + storage + compression
- Live install: `~/.claude/plugins/cache/thedotmack/claude-mem/12.6.2/`

This README distills what OneMem should borrow from claude-mem.

---

## What claude-mem is (one paragraph)

A Claude Code plugin (77.6k ⭐ GitHub, by `thedotmack`, Apache-2.0) that captures every Read/Edit/Bash as an observation, summarizes at session end, and auto-injects relevant prior observations into future prompts. Hook-driven (PreToolUse / PostToolUse / SessionStart / UserPromptSubmit / Stop). Stores in local SQLite + Chroma vector DB at `~/.claude-mem/`. Compression via Anthropic Haiku 4.5 (default) or Sonnet 3.7 / Opus 4 / OpenRouter / Gemini routes. Bundles a `worker-service.cjs` daemon (port 37777) that runs the AST-aware (tree-sitter for 20+ languages) compression + serves a full viewer UI. Supports Claude Code + OpenClaw + Codex + Gemini CLI + OpenCode + Hermes + Copilot via install flags. Memory injection starts on the SECOND session in a project. `/learn-codebase` slash command front-loads the whole repo in one pass (~5 min).

---

## What OneMem borrows from claude-mem

### The hook surface contract
| Hook | Matcher | Purpose |
|---|---|---|
| `Setup` | `*` | Worker startup |
| `SessionStart` | `startup\|clear\|compact` | Inject prior context |
| `UserPromptSubmit` | (all) | Gate context injection |
| `PostToolUse` | `*` | Capture observation per tool call |
| `PreToolUse` | `Read` | Inject memory before file reads |
| `Stop` | (all) | End-of-session summarize |

We adopt this hook surface verbatim for our Claude Code plugin. Different storage backend (Walrus + Seal + Sui-attest) underneath; same hook contract on top — meaning a user already running claude-mem can run OneMem alongside without conflict.

### The "compress at Stop, inject at SessionStart" lifecycle
Compression is async at session end (cheap on the hot path). Injection is at SessionStart preamble (one-shot, no per-prompt cost). Same lifecycle for OneMem.

### AST-aware observation extraction
claude-mem ships tree-sitter parsers for: TS, JS, Python, Java, Go, C, C++, Rust, Ruby, Kotlin, Swift, PHP, Elixir, Lua, Scala, Bash, Haskell, Zig, CSS, SCSS, TOML, YAML, SQL, Markdown.

For OneMem: we don't need AST-level parsing at v0.1 (the trace pillar gives us tool-call granularity directly), but for memory observations we could adopt the same parser set as a stretch — extracts "function X uses pattern Y" rather than raw text.

### The worker-service pattern (background daemon)
Hooks are thin shell-out calls; the heavy work (compression, embedding, storage) lives in a long-running worker. claude-mem runs at `localhost:37777`. We could adopt the same pattern — keeps hooks <100ms and lets us batch writes to Walrus.

### The viewer architecture
`viewer.html` (77 KB) + `viewer-bundle.js` (329 KB) serving the React app at `localhost:37777`. REST API:
- `GET /api/logs` — worker process logs
- `GET /api/observations` — observation stream
- `GET /api/processing-status` — live worker status
- `GET /api/projects` — projects with stored memory
- `GET /api/prompts` — past prompts
- `GET /api/settings` — viewer settings
- `GET /api/stats` — counts / usage
- `GET /api/summaries` — per-session compressed summaries
- `DELETE /api/sessions/:id` — destructive user-initiated purge

OneMem's dashboard adopts a superset of this API. Our `/api/observations` returns memory entries + their Walrus blob IDs + Sui txids. Our `/api/sessions/:id` returns trace tree + Merkle verification status.

### The `/learn-codebase` slash command pattern
One-shot priming of a repo into memory. Useful UX for "I just installed OneMem — load my whole project context." We adopt the same command for OneMem Claude Code plugin.

---

## What claude-mem already has (so we don't reinvent)

| Feature | claude-mem | OneMem plan |
|---|---|---|
| Hook contract | ✅ | Adopt verbatim |
| AST observation parsing | ✅ (tree-sitter 20+ langs) | Defer to v0.2 (not blocking) |
| SQLite storage | ✅ | Optional local mirror for read-cache |
| Chroma vector store | ✅ | Adopt for local; sync to Walrus async |
| Haiku compression | ✅ | Adopt (or use MemWal's server-side `analyze()`) |
| Web viewer at localhost:37777 | ✅ | Adopt the API shape; extend with verify drawer + trace tree |
| `/learn-codebase` | ✅ | Adopt |
| Multi-runtime install flags (CC + Codex + Gemini + OpenClaw + OpenCode + Hermes + Copilot) | ✅ | We ship native plugins per runtime instead of install flags |

---

## What claude-mem doesn't have (the structural gaps)

| Gap | OneMem approach |
|---|---|
| Cross-machine / cross-device sync | Walrus IS the sync layer — every memory is on the network |
| Encryption at rest | Seal threshold encryption on every blob |
| Cryptographic verifiability | Sui `ActionCall` + `AgentActionAttestation` Merkle chain |
| Cross-runtime UNIFIED viewer | Single dashboard reads from Walrus namespace, surfaces every runtime's observations + traces |
| Shareable / multi-user memory | Sui capability transfer for namespace access |
| Replay-from-chain | Walk the Merkle chain, fetch blobs, decrypt, reconstruct |
| Compliance export | SARIF / JSON pack with Walrus blob IDs + Sui txids + Seal proofs |

These are the layers we ADD on top. Claude-mem stays useful for single-machine Claude-Code-only workflows; OneMem adds the verifiable + cross-runtime + shareable dimensions.

---

## Community signal — `claude-with-me` (issue #1745)

A community-built personal dashboard (May 2026, by github/mysoul7306) reads claude-mem's SQLite and renders a "collaboration journey" with profile / relationship / philosophy sections. Bilingual EN+KO. Open source. **Demand signal: the bundled viewer doesn't cover everything users want.** Our dashboard captures that demand by being richer + cross-runtime + verifiable.

---

## License consideration

claude-mem is **Apache-2.0**. We don't fork it (we coexist as a separate plugin), so Apache-2.0 doesn't bind us. But verify before shipping any code that reads claude-mem's SQLite directly (would risk derivative-work claim). Safer pattern: hook our own `PostToolUse` independently; don't piggyback on their hooks or storage.

---

## Sources

- GitHub: https://github.com/thedotmack/claude-mem (77.6k ⭐, Apache-2.0)
- Live install inspection: `~/.claude/plugins/cache/thedotmack/claude-mem/12.6.2/`
- Full source (un-minified) at `~/.claude/plugins/marketplaces/thedotmack/` (auto-mirrored via `npx claude-mem install`)
- `claude-with-me` community dashboard: https://github.com/thedotmack/claude-mem/issues/1745

---

## Deeper repo learnings (2026-05-26)

Six-target follow-up dispatch. All findings sourced from the live install + the un-minified mirror at
`~/.claude/plugins/marketplaces/thedotmack/src/`. Companion file
`HOOKS_AND_VIEWER_REFERENCE.md` has the paste-ready snippets; this section is the architecture write-up.

### 1. Full hook contract (Claude Code) — beyond `hooks.json`

`hooks/hooks.json` registers six hook surfaces. Each hook is a one-liner `bash` command that:
1. Reconstructs `$CLAUDE_PLUGIN_ROOT` (falls back to newest `~/.claude/plugins/cache/thedotmack/claude-mem/[version]/`).
2. Runs `node $_R/scripts/bun-runner.js $_R/scripts/worker-service.cjs hook <platform> <event>`.
3. Always echoes `{"continue":true,"suppressOutput":true}` to stdout (some events override with `hookSpecificOutput`).

| Hook event | Matcher | Subcommand passed to worker | Timeout | Purpose |
|---|---|---|---|---|
| `Setup` | `*` | `node scripts/version-check.js` (not the hook bridge) | 300 s | Validate plugin version + dependencies on every launch |
| `SessionStart` | `startup\|clear\|compact` | `worker-service.cjs start` then `hook claude-code context` | 60 s + 60 s | Boot the worker daemon, inject prior context preamble |
| `UserPromptSubmit` | (no matcher) | `hook claude-code session-init` | 60 s | Allocate `sessionDbId`, optionally run semantic injection (`/api/context/semantic`) |
| `PostToolUse` | `*` | `hook claude-code observation` | 120 s | Capture every tool call into the observation queue |
| `PreToolUse` | `Read` | `hook claude-code file-context` | 60 s | Inject prior observations about the file being read (file-context gate) |
| `Stop` | (no matcher) | `hook claude-code summarize` | 120 s | Trigger session summarization at session end |

**Hook input contract** — Claude Code pipes the standard payload over stdin
(`{session_id, cwd, prompt, tool_name, tool_input, tool_response, transcript_path, agent_id, agent_type, hook_event_name, ...}`).
The Bun-runner reads stdin with a 5 s watchdog (`bun-runner.js:96-118`) and a tracked failure mode for
"empty stdin payload" (issue #2188) that writes a `CAPTURE_BROKEN` marker file under
`~/.claude-mem/CAPTURE_BROKEN` rather than blowing up the hook (`bun-runner.js:148-191`). This is the
load-bearing reliability pattern.

**Hook response contract** — the worker emits one of:
```json
{"continue": true, "suppressOutput": true}                            // default no-op
{"continue": true, "suppressOutput": true, "exitCode": 0}             // explicit success
{"hookSpecificOutput": {"hookEventName": "SessionStart",
                        "additionalContext": "<preamble>"},
 "systemMessage": "..."}                                              // context injection
{"hookSpecificOutput": {"hookEventName": "PreToolUse",
                        "additionalContext": "...",
                        "permissionDecision": "allow"}}                // PreToolUse gate
```

Exit codes (`src/shared/hook-constants.ts:13-18`): `0 SUCCESS`, `1 FAILURE`, `2 BLOCKING_ERROR`,
`3 USER_MESSAGE_ONLY`. **Worker-unavailable errors deliberately exit 0** (`hook-command.ts:84-90`) so
that a dead daemon never blocks the user's prompt — failure is silent and recovered on next launch.

**Permission prompts:** none. Hooks run as the user; no permission UI surfaces.

**Per-runtime platform adapters** live in `src/cli/adapters/{claude-code,cursor,gemini-cli,windsurf,raw}.ts`.
Each adapter normalizes its native payload shape into `NormalizedHookInput` then formats the response
back to that runtime's expected schema. The seven internal events
(`context | session-init | observation | summarize | user-message | file-edit | file-context`) are the
abstract dispatch labels — they're invoked uniformly across all runtimes.

### 2. `worker-service.cjs` full REST API surface

The worker is an Express app (CORS-allowed for `localhost`/`127.0.0.1` only,
`5mb` JSON body limit, `express.static` serving `plugin/ui/`). It binds on
`CLAUDE_MEM_WORKER_HOST=127.0.0.1` × `CLAUDE_MEM_WORKER_PORT=37777` (defaults in
`scripts/worker-cli.js:5`). **No auth scheme** — security is "localhost only + admin endpoints
gated by `requireLocalhost` middleware" (`src/services/server/Middleware.ts:61-83`).

Routes are split across nine handler classes under
`src/services/worker/http/routes/`. Full enumeration (method + path + handler file) appears in
`HOOKS_AND_VIEWER_REFERENCE.md`. Aggregate count: **42 GET + 19 POST + 1 DELETE = 62 endpoints**
plus `/`, `/health`, `/stream`.

**Transport layer:** vanilla HTTP + one **Server-Sent Events** endpoint at `GET /stream`
(`ViewerRoutes.ts:53`). No WebSocket. The SSE broadcaster
(`src/services/worker/SSEBroadcaster.ts`) maintains a `Set<Response>` of connected clients and
fans out `data: {...}\n\n` lines for events of type `connected | initial_load |
new_observation | new_summary | new_prompt | processing_status` (`useSSE.ts:51-92`).

**Hook → worker IPC**: hooks call the worker over HTTP. `src/cli/handlers/observation.ts`
posts to `/api/sessions/observations`; `session-init.ts` posts to `/api/sessions/init`;
`context.ts` does `GET /api/context/inject`. There is no Unix socket, named pipe, or shared-memory
channel — it's just localhost HTTP. The viewer also calls these endpoints; the worker is the
single source of truth for both the hook write path and the dashboard read path.

**DB schema interaction (`src/services/sqlite/migrations.ts`)**:
- `sessions` (project, source, archive_path, created_at_epoch)
- `memories` (session_id, text, document_id, keywords, origin)
- `observations` (memory_session_id FK → sdk_sessions, project, text, type, created_at_epoch)
- `sdk_sessions` (content_session_id, memory_session_id, project, status)
- `streaming_sessions` (same shape, for SDK streaming mode)
- `observation_queue` (per-session backlog of un-processed tool calls)
- `overviews`, `diagnostics`, `transcript_events`, `schema_versions`, `PendingMessageStore`

SQLite is the local source-of-truth; a vector DB (Chroma, optional) sits beside it for semantic
search. The worker uses `better-sqlite3` synchronously inside handler scope.

### 3. `viewer.html` React app structure

Source lives at `src/ui/viewer/`, built into `plugin/ui/viewer-bundle.js`. **Plain React 18** (`createRoot`)
mounted at `#root`. No router (single-page). No Redux/Zustand — just React state hooks. No SWR/React Query —
custom hooks wrap `fetch` and `EventSource`.

**Top-level architecture** (`src/ui/viewer/`):
```
App.tsx                   # Root component, hosts Header + Feed + modals
├── components/
│   ├── Header.tsx, Feed.tsx, ObservationCard.tsx, SummaryCard.tsx,
│   ├── PromptCard.tsx, WelcomeCard.tsx, ContextSettingsModal.tsx,
│   ├── LogsModal.tsx, TerminalPreview.tsx, GitHubStarsButton.tsx,
│   ├── ScrollToTop.tsx, ThemeToggle.tsx, ErrorBoundary.tsx
├── hooks/
│   ├── useSSE.ts          # EventSource('/stream'), auto-reconnect, type-discriminated dispatch
│   ├── useSettings.ts     # GET/POST /api/settings
│   ├── useStats.ts        # GET /api/stats
│   ├── usePagination.ts   # cursor pagination for observations/summaries/prompts
│   ├── useContextPreview.ts, useGitHubStars.ts, useSpinningFavicon.ts, useTheme.ts
├── utils/api.ts           # `authFetch` (currently just `fetch` — no auth)
├── constants/api.ts       # API_ENDPOINTS map (single source of all paths)
├── constants/{timing,ui,settings}.ts
└── types.ts               # Observation, Summary, UserPrompt, StreamEvent, FeedItem
```

**Routing approach:** no router. State held in `<App>` (`currentFilter`, `contextPreviewOpen`,
`logsModalOpen`, `welcomeDismissed`, paginated arrays). Filter is a string project name
held in state and applied to merged feed arrays via `useMemo`.

**State management:** local React state + hook-encapsulated SSE store. `useSSE()` returns
`{observations, summaries, prompts, projects, isProcessing, queueDepth, isConnected}`. The Feed
is reconstructed from `[...observations, ...summaries, ...prompts].sort(by created_at_epoch desc)`
on every render — small enough that this is fine.

**Data fetching pattern:**
1. SSE for live updates (push) — `useSSE` connects on mount, reconnects with `TIMING.SSE_RECONNECT_DELAY_MS`.
2. REST + cursor pagination for historical data (pull) — `usePagination` triggers via
   `IntersectionObserver` on a sentinel div at the bottom of the feed (`Feed.tsx:27-49`).
3. Dedup by project via `mergeAndDeduplicateByProject` util.

**Style approach:** raw CSS embedded in `viewer.html` (76 KB HTML with CSS variables for theme
tokens — `--color-bg`, `--color-fg`, etc., light/dark/system modes). No Tailwind, no CSS-in-JS, no
modules. Monospace font (Monaspace Radon) loaded inline as base64.

**Component patterns worth adopting:**
- `ErrorBoundary` wraps the whole app (`index.tsx:13-16`).
- `IntersectionObserver`-driven infinite scroll instead of pagination buttons.
- Single `API_ENDPOINTS` constant; all hooks reference it (no hardcoded URLs in components).
- Type-discriminated SSE event dispatch (`switch (data.type)` with exhaustive `case` arms).
- Welcome card with persistent dismissal via `localStorage`.

### 4. Install flag system for cross-runtime support

The shipped binary `claude-mem` (npm package, entry `dist/npx-cli/index.js`) drives install. The
runtime detection + per-runtime installer pattern lives at
`src/npx-cli/commands/install.ts` + `src/services/integrations/*.ts`.

**Flag surface:**
```
npx claude-mem install [--ide <id>] [--provider claude|gemini|openrouter] [--model <name>] [--no-auto-start]
```
Without `--ide`, interactive multi-select uses `@clack/prompts` against the auto-detected IDE list
(`detectInstalledIDEs()` in `src/npx-cli/commands/ide-detection.ts`).

**Per-runtime install switches** (`install.ts:145-300`):
| `--ide` value | Installer module | What it writes |
|---|---|---|
| `claude-code` | (registers plugin only) | `~/.claude/plugins/installed.json` + marketplace symlink + `enabledPlugins[claude-mem@thedotmack]=true` in `~/.claude/settings.json` |
| `cursor` | `CursorHooksInstaller.installCursorHooks` + `configureCursorMcp` | `.cursor/hooks/*` + MCP config |
| `gemini-cli` | `GeminiCliHooksInstaller.installGeminiCliHooks` | `~/.gemini/settings.json` (merges `hooks` block with Gemini's event names: `SessionStart`, `BeforeAgent`, `AfterAgent`, `BeforeTool`, `AfterTool`, `PreCompress`, `Notification` → mapped to internal events) + `~/.gemini/GEMINI.md` |
| `opencode` | `OpenCodeInstaller.installOpenCodeIntegration` | OpenCode plugin install |
| `windsurf` | `WindsurfHooksInstaller.installWindsurfHooks` | Windsurf hook config |
| `openclaw` | `OpenClawInstaller.installOpenClawIntegration` | Copies pre-built `openclaw/dist/` bundle to `~/.openclaw/extensions/claude-mem/` + registers in `~/.openclaw/openclaw.json` plugins.slots.memory + writes a synthetic `package.json` with `openclaw.extensions: ["./dist/index.js"]` |
| `codex-cli` | `CodexCliInstaller.installCodexCli` | Adds `codex` watch entry to `~/.claude-mem/transcript-watch.json` + writes a `<claude-mem-context>` block into `~/.codex/AGENTS.md` |
| `copilot-cli`, `antigravity`, `goose`, `roo-code`, `warp` | `McpIntegrations.MCP_IDE_INSTALLERS[id]` | MCP-config-only integration per IDE |

The marker pattern: cross-runtime install **never modifies the runtime's binary**. Each installer
writes/merges a config or hooks file native to that runtime. Claude Code's plugin manifest is the
only "first-class plugin"; everyone else is bridged via hooks-or-MCP.

**Runtime detection** (`ide-detection.ts`): probes for binaries (`which cursor`, `which gemini`,
…), config dirs (`~/.openclaw`, `~/.codex`, `~/.claude`), and known marketplace paths.

**Plugin self-update:** `installedPluginsPath()` records `installPath, version, installedAt, lastUpdated`
under `plugins["claude-mem@thedotmack"]`. The plugin cache (`~/.claude/plugins/cache/thedotmack/claude-mem/<version>/`)
is recreated on every install; the older version directories are not pruned.

### 5. `/learn-codebase` slash command implementation

**Anticlimactic but instructive.** `plugin/skills/learn-codebase/SKILL.md` (21 lines, verbatim
elsewhere) is just a system-prompt instruction telling Claude to read every source file in full
using its `Read` tool with offset/limit pagination. **No chunking pipeline, no embeddings, no
batching strategy on the plugin side** — the entire "ingest the codebase" workflow is "let the
agent burn tokens reading files, and the PostToolUse hook captures each Read as an observation
via the normal observation pipeline." Compression + embedding (if Chroma is enabled) happen
asynchronously in the worker via the standard `/api/sessions/observations` path.

Implication for OneMem: we don't need a fancy `learn` pipeline at v0.1 either. The
hook-capture path IS the pipeline; the skill is just a prompt that says "read everything."

### 6. Worker-service IPC patterns OneMem should adopt

The HTTP-only IPC pattern (no sockets, no shared memory) is intentional and worth keeping:

1. **Hook → worker call shape:** `fetch('http://127.0.0.1:<port>/api/...', { method, body })`
   via the shared `an()` helper inside the worker bundle (`src/cli/handlers/*.ts`).
2. **Worker-down failure mode:** `isWorkerUnavailableError(error)` catches the transport-layer
   error patterns (`ECONNREFUSED`, `EPIPE`, etc., 5xx, 429) and silently exits 0
   (`hook-command.ts:12-44, 84-90`). The user's prompt is never blocked by a dead daemon.
3. **Worker startup:** `SessionStart` hook lazily spawns the worker via `worker-cli.js start`,
   which writes `~/.claude-mem/worker.pid` (with port + PID + start time), polls
   `/api/readiness` for up to 10 s (15 s on Windows), and confirms via `/api/health`
   (`worker-cli.js:5,395+`).
4. **Wrapper/inner split (Windows):** `worker-wrapper.cjs` spawns `worker-service.cjs` with IPC
   (`stdio: ['inherit', 'inherit', 'inherit', 'ipc']`); restart/shutdown messages flow over IPC
   from inner to wrapper, which then handles process-tree kill via `taskkill` on Windows or
   `SIGTERM`/`SIGKILL` on POSIX. This solves the Windows Terminal tab-pileup bug
   (`bugfixes-2026-01-10.md` #625/#628).
5. **Recovery:** if the worker dies mid-session, the next hook fires, transport fails, hook exits
   0, and on the next `SessionStart` the worker is respawned. The PID file is stale-checked via
   `process.kill(pid, 0)` and cleaned up automatically (`worker-cli.js`).

**For OneMem:** adopt items 1, 2, 4, 5 verbatim. For item 3, our worker boot also needs to surface
the MemWal credentials state (logged in / logged out / token stale) — the claude-mem pattern of
"health endpoint returns full status object" (`Server.ts:161-176`) is the right shape; we add
`memwal: { signedIn, accountId, sealReady }`.

---

## License footnote (deeper context)

All quoted code excerpts in this README and in `HOOKS_AND_VIEWER_REFERENCE.md` are © Alex Newman /
`thedotmack`, licensed under Apache-2.0. They are reproduced here as research notes only. OneMem's
implementation must be **clean-room**: read the contract and architecture, do not copy the source
verbatim. The hook-event names + JSON shapes + REST paths are arguably API surface (not
copyrightable), so re-implementing the same contract is fine and is in fact the point of the
"coexist alongside claude-mem" story.
