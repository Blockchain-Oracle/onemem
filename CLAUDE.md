# OneMem — Claude Compatibility Context

Active Codex routing lives in `AGENTS.md`. Active Context Engineering artifacts
live under `.thoughts/`.

This file remains because Claude-based tools and `pnpm test:structure` expect a
root `CLAUDE.md`. Keep it lean; do not put full plans, specs, research, or
prototype reports here.

## Project Summary

OneMem is a verifiable cross-runtime AI agent memory and action-trace layer for
Sui, Walrus, Seal, and MemWal.

## Start Here

1. Read `AGENTS.md`.
2. Read `.thoughts/wiki/index.md`.
3. Read `.thoughts/quality/2026-06-17-project-quality-profile.md`.
4. For prototype-derived UI work, read
   `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`.

## Package-Specific Context

Read the package-local file before editing these areas:

- `contracts/onemem/CLAUDE.md`
- `packages/sdk-ts/CLAUDE.md`
- `packages/dashboard/CLAUDE.md`
- `packages/plugin-claude-code/CLAUDE.md`

## Current Rules

- Use `AGENTS.md` as the current repo router.
- Use `docs/05-our-architecture/00-overview/BUILD_SEQUENCE.md` as historical
  sequencing context, not as the sole current tracker.
- Use `docs/05-our-architecture/00-overview/TESTING_STRATEGY.md` for the
  historical two-tier testing policy and the quality profile for current gates.
- For docs/context-only changes, run `pnpm test:structure`.
- For code changes, run the affected-stack checks from the quality profile.
- Do not fake chain, Walrus, Seal, MCP, runtime, or browser verification.
