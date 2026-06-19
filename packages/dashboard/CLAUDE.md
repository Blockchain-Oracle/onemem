# `@onemem/dashboard` — Coding Agent Context

Root routing: `AGENTS.md`. Context: `.thoughts/`.

The **local** dashboard for Product A (claude-mem, decentralized): a readable, *alive* view of the memory your coding agents capture. Next.js 15 (App Router, `output: 'standalone'`), served at `localhost:4040`; `apps/hosted-dashboard/` wraps it for the hosted surface.

> Being rebuilt (Phase 3): a claude-mem-style readable memory feed (observation/summary cards, the files view, per-runtime color pills, project selector, alive SSE, cost meter). The old trace/verify/sessions UI has been removed.

## Non-negotiables
- **App Router only**; Next.js 15 conventions.
- **Brand tokens from `@onemem/brand`** (cdr-kit: lavender / chartreuse / cream / sui-blue) — don't hardcode hex; import `@onemem/brand/tokens.css`.
- **Alive feed = SSE from the local worker** (`@onemem/worker` at `127.0.0.1:4041`, proxied via `/api/worker/*`). Don't invent a new transport.
- **No trace / no verify UI.** Memory is stored via MemWal; the dashboard reads it — it does not anchor or verify on-chain.
- **TDD** (Vitest unit + integration). Browser-check local routes with the Chrome plugin (real-integration rule) before claiming UI done.

## Build / run
- `next build` → `.next/standalone`; `bin/onemem-dashboard` launches it for local mode.
