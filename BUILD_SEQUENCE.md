# OneMem Reset — Build Sequence (current tracker)

Locked product: **claude-mem + Mem0, decentralized** (see `CLAUDE.md`). Full plan: `.thoughts/plans/2026-06-19-onemem-reset-plan.md`.
Update the checkboxes as work lands. Pause for Abu at major phase transitions.

## Phase 0 — Reset & lock definition
- [x] Checkpoint pre-reset working tree (commit `8a50980` on `pillar-3-plugins`)
- [x] Wipe `.thoughts`, reseed with carried-forward research + plan
- [x] Rewrite `CLAUDE.md` + `AGENTS.md` (lean, no stale trace content, rule enforcement)
- [x] Create `BUILD_SEQUENCE.md`
- [ ] Commit Phase 0 + open PR

## Phase 1 — Full cleanup (no dead code)
- [ ] Delete `contracts/onemem/`, `services/nautilus-relayer/`, `demos/*`
- [ ] sdk-ts: delete `traces.ts`/`seal.ts`/`walrus.ts`/namespaces/generated addresses; strip client/runtime/memory/index
- [ ] worker: delete anchor/reconciler; strip proof columns + `proof_update`
- [ ] dashboard: delete sessions/trace routes; strip runtimes control-cards; re-source memory listing
- [ ] scripts/CI/tests: remove Move/deploy/codegen; clean structure tests
- [ ] internal `docs/` (05-our-architecture etc.): remove stale trace-era architecture docs
- [ ] consolidate MemWal version (`0.0.5`/`0.0.7` → one)
- [ ] repo builds + typechecks green, no dangling imports → PR

## Phase 2 — Product B: Mem0 on MemWal
- [ ] SDK `add`/`search`/`analyze` + index (`get`/`get_all`/`delete`/metadata/multi-scope)
- [ ] login: bring-your-own account + delegate path
- [ ] CLI `add`/`search`; rework `init`/`health`; MCP memory tools
- [ ] providers → memory (Vercel AI, OpenAI Agents, Python)
- [ ] real testnet integration tests (SDK/CLI/MCP/Vercel + OpenAI key) → PR

## Phase 3 — Product A: claude-mem on MemWal
- [ ] capture hooks → worker; observer LLM compression (8 types / 7 concepts / files view); summaries
- [ ] store: SQLite cache + MemWal durable; recall (SessionStart + UserPromptSubmit + MCP 3-layer)
- [ ] dashboard rebuild (readable feed, files view, alive SSE, cost meter); fix hydration error
- [ ] real Claude Code + Codex sessions verified; Chrome DevTools UI/mobile → PR

## Phase 4 — Docs (Mintlify, Mem0-quality, our identity)
- [ ] IA + components + welcome thumbnail grid + images (MCP) + milestone section; fix `/verify`→`/share` → PR

## Phase 5 — Landing (honest, simple, human)
- [ ] rewrite copy; no overclaiming → PR

## Phase 6 — Deployment + env cleanup + demo
- [ ] `.env.example` (memory-only); remove trace/contract env vars; rotate secrets
- [ ] testnet throughout; validate MemWal mainnet path; (demo script with Abu at the end)
