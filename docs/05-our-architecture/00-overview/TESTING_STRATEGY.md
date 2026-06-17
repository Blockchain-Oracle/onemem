# Testing Strategy

How we test OneMem so "solid is solid" — and so we find breakage *as we build*, not at the end.

> Current note, 2026-06-17: this is the historical two-tier testing policy.
> Current command gates live in
> `.thoughts/quality/2026-06-17-project-quality-profile.md`.

## Two tiers

### Tier 1 — Unit tests (automated, mandatory, CI-default)
- Written **first** (TDD — `superpowers:test-driven-development`); no test = no merge.
- Fast, deterministic, no network/keystore. Mocked boundaries are fine here.
- Run on every commit/PR via CI (`pnpm turbo run test`, `uv run pytest`, `sui move test`).
- Pure logic that MUST be verifiable offline lives here — e.g. the Merkle `content_hash`/`chain_hash` must be unit-tested for byte-exact output (and byte-identical across the TS and Python SDKs).

### Tier 2 — Manual testing on real systems (the real bar)
- After unit tests, **exercise the feature by hand on the real system** — the actual runtime, the real Walrus network, live Sui testnet — and observe it work. Not a substitute for unit tests; a complement that catches what mocks and transpile-only runs hide.
- **Do it continuously, per feature — never batch it to the end.** Waiting until the end hides which change broke what.
- Examples by surface:
  - **SDK** → run a full live-testnet round-trip (namespace → cap → session → calls → close → `verifySession().ok === true`) + a real Walrus blob upload/fetch/decrypt.
  - **Plugin** (Pillar 3) → actually install + run the real runtime (e.g. set up OpenClaw / Claude Code) and trigger the hook by hand.
  - **Dashboard** (Pillar 6) → load the live verified session in a browser and see the "Verified ✓".
- **Capture the manual flow as a repeatable script** where practical: committed, env-gated integration tests (`*.integration.test.ts` / `test_*_integration.py`) that only run under `ONEMEM_INTEGRATION=1` (they need a funded testnet keystore, so they stay OUT of default CI). The committed test is the bonus; the manual run is the bar.

## `/tmp` scratch convention
Before architecting around an unfamiliar library (`@mysten/walrus`, `pysui`, …), spike minimal real usage in a `/tmp` scratch to learn its actual API, then design to fit reality. Scratch spikes are **never committed**.

## Gotchas (learned the hard way)
- **`tsx` / smoke scripts are transpile-only** — they do NOT typecheck or run `tsup`. A green smoke run can sit on top of a real `tsc` error or a package that builds nothing. Always also run `pnpm turbo run typecheck build`.
- **Each TS library package needs its own `tsup.config.ts`** (entry + esm/cjs/dts) or `tsup` emits "No input files" and produces an empty package.
- **CI Actions need billing OR a public repo** — public repos get free unlimited GitHub Actions minutes.

## Per-pillar real-system verification (filled as pillars land)

| Pillar | How we manually verify on a real system |
|---|---|
| 1 — Move contract | Deployed live to Sui testnet; `verify-mainnet.sh` checks package + registry + dynamic fields on-chain. |
| 2 — SDKs | Live testnet round-trip + off-chain Merkle re-verify (TS *and* Python recompute the identical `merkle_root` for the same session); real Walrus blob encrypt→upload→fetch→decrypt round-trip. |
| 3 — Plugins / MCP | _TBD — stand up the real runtime, trigger the hook by hand._ |
| 6 — Dashboard | _TBD — browser-render a live verified session._ |
