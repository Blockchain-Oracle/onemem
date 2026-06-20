# claude-mem source spec → OneMem Product A (Phase 3), de-traced

**Date:** 2026-06-20 · **Source of truth:** real source `git clone https://github.com/thedotmack/claude-mem` (cloned to `/tmp/claude-mem-src`), plus my prior blueprint `git show 8a50980:.thoughts/research/2026-06-19-grounding/02-claude-mem-blueprint.md`. The blueprint is trace-era — everywhere it says `proof_status`/anchored/verified, we instead do a **MemWal durable-write** track (no verify feature; decentralization = living on MemWal/Walrus/Seal).

## Architecture: thin hooks → worker brain → dashboard
- **Hooks stay <100ms and `exit(0)` if the worker is down** (never block the agent). claude-mem's load-bearing reliability pattern; OneMem already has it in `onemem-lib.mjs`.
- **Worker (the brain), 127.0.0.1:4041:** SQLite = the *alive cache* (raw event written synchronously inside the request → instant SSE). A background loop compresses raw events → structured observations (off the hot path). On Stop → 5-section summary. Compressed observations + summaries are durably written to **MemWal** (async enrichment). The worker also serves the dashboard SSE.
- **Dashboard:** reads the worker (SSE push + REST pull); renders the alive card feed.

## Worker SQLite schema (Phase 3 redesign — local dev DB, no migration needed)
- `sessions(id PK, runtime, project, project_path, namespace_id, onemem_session_id, status open|closed, started_at, ended_at)` — add `project` (basename, for filtering).
- `events(id PK, session_id, seq, tool_name, tool_namespace, input_preview, output_preview, status pending|compressed|skipped, content_hash, created_at)` — **raw** tool calls (the instant write + compression queue). Replaces today's raw `observations`.
- `observations(id PK, session_id, seq, type, title, subtitle, facts JSON, narrative, concepts JSON, files_read JSON, files_modified JSON, content_hash, blob_id, created_at)` — **compressed** (the cards). `blob_id` = MemWal durable ref, NULL until stored.
- `summaries(id PK, session_id, request, investigated, learned, completed, next_steps, notes, content_hash, blob_id, created_at)`.
- `prompts(id PK, session_id, seq, text, created_at, blob_id)` — user prompts (prompt cards), from UserPromptSubmit.

## Observer contract (from `src/sdk/prompts.ts` + `parser.ts` + `output-classifier.ts`)
- **Types (8):** bugfix 🔴 · feature 🟣 · refactor 🔄 · change ✅ · discovery 🔵 · decision ⚖️ · security_alert 🚨 · security_note 🔐. Exactly one per observation; invalid → fallback to first.
- **Concepts (7):** how-it-works · why-it-exists · what-changed · problem-solution · gotcha · pattern · trade-off. 2–5 per observation; remove the type from concepts if echoed.
- **Fields:** type, title, subtitle (≤24 words), facts[] (self-contained, no pronouns), narrative, concepts[], files_read[], files_modified[].
- **Output format = XML.** Observer returns one or more `<observation>…</observation>` blocks (or empty to skip). Per-event input wrapped as `<observed_from_primary_session><what_happened>tool</what_happened><parameters>…</parameters><outcome>…</outcome></observed_from_primary_session>`.
- **Field truncation:** ~16k chars/field, head 60% + `<elided chars=N />` + tail 30% (don't blow the observer's context on a huge Read).
- **Parser:** regex extract scalars + arrays (`<facts><fact>…`); empty string → null; skip a block if title+narrative+facts+concepts all empty; strip a single outer code fence only.
- **Classifier:** `xml` (parseable) · `idle` (empty, benign) · `prose` (non-XML, discard) · `poisoned` (session-exhausted/context-window strings → respawn the observer session). Non-XML prose is discarded, never persisted.
- **Skip routine ops:** empty checks, successful installs with no errors, trivial listings.

## Summary contract (Stop hook)
- `<summary>` with **request · investigated · learned · completed · next_steps** (+ optional notes). MUST use `<summary>` root, not `<observation>`.

## SSE events (worker → dashboard)
`connected` · `session` (started) · `session_ended` · `new_observation` (compressed card) · `new_summary` · `new_prompt` · `processing_status {isProcessing, queueDepth}`. The dashboard prepends cards on `new_observation`/`new_summary`/`new_prompt` and drives the spinner/queue badge on `processing_status`.

## Recall (from `src/services/context/*`, `timeline-formatting.ts`) — injected markdown
```
# [project] recent context, <date time tz>

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor 🔵discovery ⚖️decision ✅change
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs])

Stats: N obs (Xt read) | Yt work | Z% savings

### <day>
42 9:15a 🔴 Fixed Read timeout logic
43 9:20a 🔵 Discovered root cause in connection pool
S6 Audit types (Jun 20, 10:15am)

**Most Recent Summary:**
**Request:** … **Investigated:** … **Learned:** … **Completed:** … **Next Steps:** …
```
- **SessionStart:** deterministic recent-timeline injection (recent observations + last summary, token-budgeted).
- **UserPromptSubmit:** semantic recall — MemWal `recallManual(prompt)` for the project namespace, injected as additional context.
- **MCP 3-layer:** `search` → `timeline` → `get_observations`.

## Durable MemWal seam (the decentralization)
- Worker uses `@onemem/sdk-ts` `createMemoryRecorder({ namespace })` → `.capture(json)` / `.recall(query, topK)` (fire-and-forget, never throws). Compressed observation/summary JSON → `rememberManual` → `blob_id` stored back in SQLite. Recall via `recallManual`/`restore`.
- **Namespace = per-project** `cm:<project>` so a new session recalls prior work in the same repo. Cost-aware: only *compressed* observations/summaries go to Walrus; raw `events` stay local.

## Observer LLM — ZERO API KEY (rides the user's Claude Code subscription)
**VERIFIED in real source 2026-06-20 (Abu flagged "no API key" as a hard blocker).** claude-mem runs the observer with NO key by piggybacking on the user's existing Claude Code login:
- Dep: `@anthropic-ai/claude-agent-sdk`; calls `query()` which spawns the user's installed `claude` CLI (`src/shared/find-claude-executable.ts` — probes `--permission-mode dontAsk --version`, newest capable wins).
- Auth: reads the **fresh OAuth token from the macOS keychain** (service `"Claude Code-credentials"` → `claudeAiOauth.accessToken`, `src/shared/oauth-token.ts`) and injects it as `CLAUDE_CODE_OAUTH_TOKEN` into an isolated subprocess env (`EnvManager.buildIsolatedEnvWithFreshOAuth`).
- Hardening (`src/sdk/hardened-options.ts` + `EnvManager` BLOCKED_ENV_VARS): strips `ANTHROPIC_API_KEY` (never silently bill a key — issue #733), `CLAUDECODE` (else "cannot launch inside another Claude Code session"), stale `CLAUDE_CODE_OAUTH_TOKEN`, `ANTHROPIC_BASE_URL/AUTH_TOKEN`, `CLAUDE_CODE_EFFORT_LEVEL`. `permissionMode: 'dontAsk'`, `allowedTools: []` (observer makes NO tool calls — pure text→XML).
- API key is used ONLY in the hosted server variant (`src/server/*`) or as an OPTIONAL fallback from `~/.claude-mem/.env` (GEMINI/OPENROUTER/ANTHROPIC). **Default local = zero key.**

**OneMem decision (LOCKED 2026-06-20, proven live):** the observer **spawns the user's own coding CLI in non-interactive mode** — zero key, sanctioned, runtime-symmetric. **NO ChatGPT-token spoofing.**
- **Codex sessions → `codex exec`** — PROVEN on Abu's ChatGPT login, zero key: `codex exec --skip-git-repo-check --sandbox read-only --ephemeral --ignore-user-config --output-schema <obs-schema.json> -o <out.json> -` with the observer prompt on **stdin**. `--output-schema` forces the exact observation JSON → **no XML parsing on the Codex path**. Live test returned a clean, correctly-typed `bugfix` observation (good facts/concepts/files). ~14k tokens/call overhead (Codex base prompt) → **amortize by batching** tool calls per compression. `codex exec` is a subprocess (no npm dep).
- **Claude sessions → `@anthropic-ai/claude-agent-sdk` `query()`** (or `claude --print --output-format json`), zero key via the Claude subscription (what claude-mem does). Add `@anthropic-ai/claude-agent-sdk` via `pnpm add` (don't hardcode version). Claude path may use the XML observer prompt + parser, or a JSON-instructed prompt.
- **Selection:** prefer the session's host-runtime CLI (codex session → codex; claude session → claude); else the other available CLI; else BYO key (`ONEMEM_OBSERVER_API_KEY`); else capture + durably store **RAW** (labeled, no fake compression).
- Both paths run the user's own installed CLI as intended → honest + zero-config. Observer abstraction: `ObserverBackend { name; available(); compress(prompt, schema) -> json }` with CodexBackend / ClaudeBackend / KeyBackend implementations.

### Codex (verified 2026-06-20, real source)
- **Capture:** Codex fires the SAME hook events (`codexAdapter` EVENT_NAMES: PreToolUse/PermissionRequest/PostToolUse/SessionStart/UserPromptSubmit/Stop). plugin-codex hooks are valid. Quirks to handle in 3C: Codex **requires `session_id`** in the payload (skip if absent), the **Stop hook can re-enter** (guard it), Codex **ignores `systemMessage`** (use `writeCodexOutput`, already present). `platform_source='codex'` (`src/shared/platform-source.ts`) is a display tag only.
- **claude-mem itself is Claude-only** for the observer (`worker-service.ts:259` defaults `provider='claude'`; gemini/openrouter only if a key is configured) — even a Codex session in claude-mem is compressed by Claude. **OneMem improves on this:** Codex sessions are compressed by the user's own **`codex exec`** (zero-key, PROVEN live on Abu's ChatGPT login), so a Codex-sub-only user with NO Claude is fully covered. This is the sanctioned CLI path — NOT the ToS-gray-area ChatGPT-token spoof (which is locked to client `app_EMoamEEZ…`, hits an undocumented `chatgpt.com/backend-api/codex/responses` endpoint with a spoofed system prompt, and can flag the account — rejected).

## Zero-key holistic (Abu's requirement) — RESOLVED 2026-06-20 (proven on testnet)
MemWal has TWO modes. The **main `MemWal` class (relayer mode)** needs only `{ key (delegate), accountId, serverUrl? }` — **NO embedding key**; the relayer is a Rust **TEE** that embeds + SEAL-encrypts + uploads to Walrus server-side (`memwal.d.ts`: "relayer continues embedding, encrypting, uploading"). The `/manual` client (what Product B's SDK uses) is the one that requires `embeddingApiKey` (client-side embedding, plaintext-never-leaves-device). **Product A (worker) uses relayer mode → 100% key-free.** Proven: zero-key `remember`→`recall` round-trip on testnet (blob `XWtzll…`, recall distance 0.48) + full worker e2e (observation → durable blob `ae37ce2a…`), no embedding key. Trade: relayer mode sends plaintext to the TEE (vs client-side Seal). For zero-config on a TEE this is the right call; manual-mode (client-side Seal, BYO key) can be an opt-in "max privacy" mode later. NOTE: Product B (manual mode, shipped in PR #2) could also move to relayer mode for zero-key — follow-up.

## Cost meter — honest only (MemWal exposes NO cost API; confirmed in its `.d.ts`)
Show only real measurables: durable memories stored (blob count + bytes from `blob_id` rows) + live Sui gas balance via JSON-RPC + Walrus storage epochs. **No invented "WAL price."**
