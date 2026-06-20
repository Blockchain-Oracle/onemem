# AGENTS.md — OneMem repo router

## What OneMem is
**OneMem = claude-mem + Mem0, but decentralized. Nothing else. NO trace, NO verify-as-product.**
- **Product A — claude-mem, decentralized:** drop-in memory for coding agents (Claude Code / Codex) + a readable, *alive* local dashboard.
- **Product B — Mem0, decentralized:** an embeddable memory SDK (`add`/`search`/…) + framework providers (Vercel AI, OpenAI Agents, CrewAI, LiveKit, ElevenLabs).
- Decentralization = **MemWal** (`@mysten-incubation/memwal`) = Seal-encrypted blobs on Walrus + a Sui account/delegate ownership model. Users configure their own MemWal account id + delegate key.

> A reset is in progress. The agent action-trace + on-chain verify product and OneMem's custom Move contract are being **removed**; memory is stored via MemWal. Track it in `BUILD_SEQUENCE.md`.

## Monorepo (target after cleanup)
- `packages/sdk-ts` — core memory SDK (MemWal + an index for CRUD/scoping); `packages/sdk-python` — Python SDK.
- `packages/cli-ts` (`onemem`) · `packages/mcp-server` — memory CLI + stdio MCP.
- `packages/worker` — local `127.0.0.1` daemon (SQLite + SSE) powering the live dashboard.
- `packages/dashboard` — local Next.js dashboard (cdr-kit design system).
- `packages/plugin-claude-code` · `plugin-codex` · `plugin-openclaw` — runtime capture.
- `packages/provider-vercel-ai` · `provider-openai-agents` · Python providers — framework memory.
- `apps/landing` · `apps/hosted-dashboard` · `apps/docs` (Mintlify).
- **Removed by the reset:** `contracts/onemem/`, `services/nautilus-relayer/`, `demos/*`, and sdk-ts `traces.ts`/`seal.ts`/`walrus.ts`/namespaces (MemWal does its own Seal+Walrus).

## Working rules
- **No improvising / no patch-patch.** Architecture-first; no dead code; full cleanup over surgical strips.
- **PR discipline:** branch → PR → PR review toolkit (5 agents) + completion audit → merge. **No commits to `main`.**
- **Real per-feature testing on testnet, as you build** (CLI→test CLI, SDK→test SDK, MCP→test it, Vercel→test with the real OpenAI key). Chrome DevTools for UI/mobile. **No `try/catch` masking** — find where it breaks.
- Build on MemWal/Walrus/Seal; never fake verification. Use `ctx7` for library docs. `pnpm add`/`uv add` for versions.
- Keep `AGENTS.md` / `CLAUDE.md` lean; detail belongs in `.thoughts/`.

## Context (`.thoughts/`)
- `plans/2026-06-19-onemem-reset-plan.md` — the approved plan.
- `research/2026-06-19-reality-brief.md` + `research/2026-06-19-*` — grounding (decentralization stack, Mem0↔MemWal gap, claude-mem architecture, cleanup audit, docs/UX).
- `SALVAGE-2026-06-19.md` — live deployments + operational facts; the full pre-reset history is in git commit `8a50980`.

## Commands
`pnpm build` · `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm test:structure`
Python: `uv run ruff check .` · `uv run pyright` · `uv run pytest -q`

## Do not
- Re-add trace / verify-as-product (Abu rejected it).
- Fake chain, Walrus, Seal, MCP, runtime, or browser verification.
- Batch testing to the end; swallow errors in `try/catch`.
- Commit to `main`; hardcode dependency versions.

<claude-mem-context>
# Memory Context

# claude-mem status

This project has no memory yet. The current session will seed it; subsequent sessions will receive auto-injected context for relevant past work.

Memory injection starts on your second session in a project.

`/learn-codebase` is available if the user wants to front-load the entire repo into memory in a single pass (~5 minutes on a typical repo, optional). Otherwise memory builds passively as work happens.

Live activity: http://localhost:37701
How it works: `/how-it-works`

This message disappears once the first observation lands.
</claude-mem-context>
