# `@onemem/sdk-ts` — Coding Agent Context

Active repo routing lives in `AGENTS.md`; active Context Engineering artifacts
live under `.thoughts/`.

THIN wrapper over `@mysten-incubation/memwal`. We add verifiable-trace primitives on top of MemWal's account/capability model — we do NOT reimplement MemWal's primitives.

## Read before editing
- `docs/05-our-architecture/02-sdks/shared-api-surface.md` — the canonical API the SDK exposes
- `docs/05-our-architecture/01-protocol/` — Move types this SDK serializes/deserializes
- `docs/02-inspirations/memwal-incubation/` — what MemWal already provides; don't re-do

## Non-negotiables
- **Always use the Seal `/manual` flow.** Not `/auto`. Per `docs/01-sui-ecosystem/seal-deep-dive.md`. Manual flow keeps the delegate-key model honest — `seal_approve` runs against on-chain policy.
- **Move types come from codegen.** Don't hand-write Move struct types in TS. Run `pnpm exec tsx scripts/codegen-move-types.ts` after Move contract changes.
- **No singletons.** The SDK exposes a `OneMem.create(config)` factory — every consumer (dashboard, CLI, MCP server) instantiates its own client with its own delegate key + namespace.
- **TDD per `superpowers:test-driven-development`.** Failing Vitest first, then implementation.

## Build
- `tsup` (per `TOOLING_DECISIONS.md`) — ESM+CJS dual output for both Node CLI consumers and browser dashboard consumers.

## Tests
- Vitest. Unit tests in `tests/`. Integration tests against a local Sui devnet live in `tests/integration/` and are gated behind `ONEMEM_INTEGRATION=1` env var.
