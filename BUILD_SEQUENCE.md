# OneMem Reset — Build Sequence (current tracker)

Locked product: **claude-mem + Mem0, decentralized** (see `CLAUDE.md`). Full plan: `.thoughts/plans/2026-06-19-onemem-reset-plan.md`.
Update the checkboxes as work lands. Pause for Abu at major phase transitions.

## Phase 0 — Reset & lock definition ✅
- [x] Checkpoint pre-reset working tree (commit `8a50980` on `pillar-3-plugins`)
- [x] Wipe `.thoughts`, reseed with carried-forward research + plan
- [x] Rewrite `CLAUDE.md` + `AGENTS.md` (lean, no stale trace content, rule enforcement)
- [x] Create `BUILD_SEQUENCE.md`

## Phase 1 — Full cleanup (no dead code) ✅ green build
- [x] Delete `contracts/onemem/`, `services/nautilus-relayer/`, `demos/*`
- [x] sdk-ts: delete `traces.ts`/`seal.ts`/`walrus.ts`/namespaces/generated addresses; strip client/runtime/memory/index → memory-only surface
- [x] worker: delete anchor/reconciler; strip proof columns + `proof_update` (SQLite + SSE intact)
- [x] dashboard: delete sessions/trace/share routes; strip control-cards; memories page = local worker feed only (full readable rebuild = Phase 3)
- [x] cli/mcp/providers/plugins: remove trace/verify/namespace; keep memory paths (init/health minimal pending Phase 2)
- [x] scripts/CI/tests: remove Move/deploy/codegen; rewrite structure tests; delete dead `config/networks.json`
- [x] consolidate MemWal version (root pins `^0.0.7`)
- [x] **GREEN**: typecheck 11/11, build 10/10, test 12/12, test:structure 168/0, lint 0 err, ruff/pyright/pytest pass
- [ ] FOLLOW-UP: internal `docs/` (05-our-architecture, 02-inspirations, etc.) is now orphaned trace-era content — audit + remove/rework (nuanced; folds into Phase 4 docs). Plus residual trace/verify copy in `apps/docs/*.mdx` + `packages/brand/briefs/*.md`.
- [ ] Commit + open PR + run PR review toolkit (5 agents)

## Phase 2 — Product B: Mem0 on MemWal — CORE DONE ✅ (green + real-testnet verified)
- [x] MemWal 0.0.7 dedupe + Node 24 pin (node:sqlite); real testnet add/search proven
- [x] SDK `add`/`search` + SQLite index: `get`/`get_all`/`delete`/metadata/multi-scope (user/agent/run); cross-user isolation enforced
- [x] CLI `add`/`search` + `list`/`get`/`delete` + scope flags (real-tested via local bin)
- [x] MCP memory tools: add/search/get/list/delete; Python SDK mirror
- [x] PR-review fixes (cross-user leak, order-insensitive metadata match, bounded fetch, dead code) + real testnet CRUD/isolation integration green
- [ ] REMAINING (smaller): scope passthrough into providers (Vercel AI/OpenAI Agents/Python already recall+capture from Phase 1); explicit bring-your-own login affordance (env path already works); live MCP/Vercel round-trip with OpenAI key
- [ ] follow-ups: publish `@onemem/worker` for end-user plugin install (Phase 6); `oc-memwal`→memwal 0.0.5 leftover (Phase 3); cli `init`/`health` minimal (rework if needed); replace global `/opt/homebrew/bin/onemem` shadow before demo

## Phase 3 — Product A: claude-mem on MemWal  (branch `reset/phase-3-product-a`)
**Observer auth = ZERO key** (proven live 2026-06-20): rides the user's own coding CLI — `codex exec` for Codex, Claude Agent SDK for Claude. NOT ChatGPT-token spoofing. Spec: `.thoughts/research/2026-06-20-claude-mem-source-spec.md`.

### 3A — Worker observer pipeline ✅ (commits 44402fa + 0891225)
- [x] store: events (raw hot-path queue) → observations (8 types / 7 concepts / files view) + summaries + prompts; content-hash dedup; blob_id slot; findSessionNeedingSummary
- [x] observer: prompt + tolerant JSON parser + classifier + loop (injectable backend)
- [x] CodexBackend (zero-key `codex exec` + `--output-schema`) + KeyBackend fallback + auto-select
- [x] summaries (5-section) + honest fallback; server hot-path `/api/events` + processing_status SSE; observer loop in index
- [x] 44 unit tests + REAL e2e (observation + 5-section summary via codex, zero key); tsc + lint green
- [ ] ClaudeBackend (Claude subscription via `@anthropic-ai/claude-agent-sdk`) — DEFERRED w/ reason: pipeline proven zero-key via Codex (Abu's runtime); isolated add that slots in without changing the pipeline

### 3B — Durable MemWal write + recall
- [ ] worker writes compressed observations + summaries to MemWal (namespace `cm:<project>`), backfills blob_id; `/api/recall`
- [ ] VERIFY zero-config embedding: does the MemWal relayer embed server-side (no `ONEMEM_EMBEDDING_API_KEY` needed)? — Abu's zero-key requirement; don't assume
- [ ] real testnet round-trip: session A writes → session B recalls; inspect recalled text

### 3C — Hooks rework (recall + prompts)
- [ ] inject.js SessionStart recall injection; new UserPromptSubmit hook (semantic recall + prompt cards); thin observe/summarize → `/api/events` + `/api/prompts`; mirror plugin-codex; handle Codex quirks (session_id required, Stop re-entry, writeCodexOutput)
- [ ] real Claude Code + Codex session end-to-end

### 3D — Dashboard rebuild (alive card feed)
- [ ] centered card feed (observation/summary/prompt), files view, facts↔narrative toggle, per-runtime pills, project selector, processing badge + spinning favicon, honest cost meter, theme; remove dead `proof_update` + "before proof settles" + unused deps; fix/verify hydration; Chrome DevTools UI/mobile

### 3E — Phase 3 verification + completion audit + PR
- [ ] full green; completion audit (no silent cuts); stacked PR on `reset/phase-0-foundation`. (Ultra review due after Phase 4.)

### Deferred from the pre-Phase-3 fix pass (review findings, intentionally NOT fixed yet)
These were triaged during the pre-Phase-3 ultra-review fix pass and deferred on purpose; revisit during Phase 3 SDK/dashboard work:
- [ ] **M1** — local SQLite index mirror sits OUTSIDE the MemWal failure boundary: a MemWal write can succeed while the index `put` fails (or vice versa), so the two can drift. Decide on a reconcile/repair path (or accept + document the eventual-consistency window).
- [ ] **M5** — `getAll` with no `limit` caps at 200 rows with NO truncation signal: a caller can't tell a full list from a truncated one. Return/expose a "more available" marker or a total count.
- [ ] **M6** — metadata `getAll` filtering is best-effort within a bounded over-fetch window (in-app JSON match after a SQL `LIMIT`). Push the predicate into SQL via `json_extract` so metadata filtering is exact, not windowed.
- [ ] **M7** — a corrupt metadata cell is silently dropped to `undefined` in `parseMetadata`; consider surfacing/logging the corruption instead of swallowing it.
- [ ] **L1–L6** — assorted low-severity polish items from the same review (track individually when picked up).

## Phase 4 — Docs (Mintlify, Mem0-quality, our identity)
- [ ] IA + components + welcome thumbnail grid + images (MCP) + milestone section; fix `/verify`→`/share`; remove residual trace docs → PR

## Phase 5 — Landing (honest, simple, human)
- [ ] rewrite copy; no overclaiming → PR

## Phase 6 — Deployment + env cleanup + demo
- [ ] `.env.example` (memory-only); remove trace/contract env vars; rotate secrets
- [ ] testnet throughout; validate MemWal mainnet path; (demo script with Abu at the end)
