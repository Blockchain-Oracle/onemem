# `@onemem/sdk-ts` — Coding Agent Context

Root routing: `AGENTS.md`. Context: `.thoughts/`.

The core memory SDK (Product B — Mem0, decentralized). Wraps **MemWal** (`@mysten-incubation/memwal`), which does its own Seal encryption + Walrus storage internally. `OneMem.create(config)` → `requireMemory().add()` / `.search()`. The Mem0-gap index layer (`get` / `get_all` / `delete` / metadata / multi-scope) lands in Phase 2.

## Non-negotiables
- **Memory is stored via MemWal `/manual`** — the client does Seal encryption; the relayer never sees plaintext. We do NOT reimplement Walrus/Seal here (those modules were removed).
- **No trace / no verify / no custom Move contract.** Decentralization is delivered through MemWal.
- **No singletons** — `OneMem.create(config)` factory; every consumer (CLI, MCP, providers, worker) instantiates its own client with its own delegate key + account id.
- **`pnpm add` for versions**, never hardcode. **TDD** (Vitest unit) + real MemWal-testnet integration per feature.

## Build / test
- `tsup` (ESM+CJS). Node-only runtime helpers live in `@onemem/sdk-ts/runtime`.
- Vitest in `tests/`; real integration against MemWal testnet (per the per-feature testing rule).
