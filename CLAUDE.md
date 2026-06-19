# OneMem — Claude Context

**OneMem = claude-mem + Mem0, but decentralized. Nothing else. NO trace, NO verify-as-product.**

Two products, both on **MemWal** (Seal-encrypted blobs on Walrus + a Sui account/delegate model):
- **A — claude-mem, decentralized:** memory for coding agents (Claude Code / Codex) + a readable, *alive* local dashboard.
- **B — Mem0, decentralized:** an embeddable memory-layer SDK (`add`/`search`/…) + framework providers.

Decentralization is delivered by MemWal (`@mysten-incubation/memwal`); users configure their own MemWal account id + delegate key. The Walrus track's "verifiable memory layer" is satisfied by living on MemWal/Walrus/Seal — we do **not** build a verify/trace feature.

## Start here
1. `AGENTS.md` — the repo router.
2. `BUILD_SEQUENCE.md` — current checkbox roadmap (always know the next step).
3. `.thoughts/plans/2026-06-19-onemem-reset-plan.md` — the approved reset plan.
4. `.thoughts/research/2026-06-19-reality-brief.md` — grounding facts.

## Rule enforcement
- Every change ships via a **PR**. **No direct commits to `main`.**
- Run the **PR review toolkit (5 pr-review agents)** + a completion audit before merge.
- **Test for real, per feature, on testnet as you build** — never batch testing to the end. No `try/catch` masking; find where it breaks.
- Build on MemWal/Walrus/Seal — never fake chain, Walrus, Seal, MCP, runtime, or browser verification.
- `pnpm add` / `uv add` for versions — never hardcode from memory.

## Commands
`pnpm build` · `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm test:structure`
Python: `uv run ruff check .` · `uv run pyright` · `uv run pytest -q`

Keep this file lean (loaded every turn); detail lives in `AGENTS.md` and `.thoughts/`.
