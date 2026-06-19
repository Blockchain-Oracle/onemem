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

## Phase 2 — Product B: Mem0 on MemWal
- [ ] SDK `add`/`search`/`analyze` + index (`get`/`get_all`/`delete`/metadata/multi-scope)
- [ ] login: bring-your-own account + delegate path; rework cli `init`/`health`
- [ ] CLI `add`/`search`; MCP memory tools (already pared to add/search)
- [ ] providers → memory (Vercel AI, OpenAI Agents, Python)
- [ ] real testnet integration tests (SDK/CLI/MCP/Vercel + OpenAI key) → PR

## Phase 3 — Product A: claude-mem on MemWal
- [ ] capture hooks → worker; observer LLM compression (8 types / 7 concepts / files view); summaries
- [ ] store: SQLite cache + MemWal durable; recall (SessionStart + UserPromptSubmit + MCP 3-layer)
- [ ] dashboard rebuild (readable feed, files view, alive SSE, cost meter); fix hydration error
- [ ] real Claude Code + Codex sessions verified; Chrome DevTools UI/mobile → PR

## Phase 4 — Docs (Mintlify, Mem0-quality, our identity)
- [ ] IA + components + welcome thumbnail grid + images (MCP) + milestone section; fix `/verify`→`/share`; remove residual trace docs → PR

## Phase 5 — Landing (honest, simple, human)
- [ ] rewrite copy; no overclaiming → PR

## Phase 6 — Deployment + env cleanup + demo
- [ ] `.env.example` (memory-only); remove trace/contract env vars; rotate secrets
- [ ] testnet throughout; validate MemWal mainnet path; (demo script with Abu at the end)
