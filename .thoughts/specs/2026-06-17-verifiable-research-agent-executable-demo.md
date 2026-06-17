# Spec: Verifiable Research Agent Executable Demo

Date: 2026-06-17

## Goal

Convert the verifiable research-agent demo from storyboard-only into an
executable, safe testnet harness that records and verifies a mocked multi-day
research workflow as real OneMem traces.

## Requirements

- R1: `demos/verifiable-research-agent` must be a private workspace package.
- R2: The package must expose deterministic model tests, lint, typecheck, build,
  and `demo:trace` scripts.
- R3: The demo must default to Sui testnet and fail closed for non-testnet
  networks.
- R4: The demo must write at least three real OneMem `TraceSession`s under one
  namespace, representing day-labeled research progression.
- R5: The demo must verify every generated session from chain data before
  reporting success.
- R6: The generated JSON artifact must include namespace ID, session IDs,
  call IDs, verification summaries, same-namespace continuity, memory
  references, Suiscan URLs, dashboard paths, public verifier paths, and proof
  boundaries.
- R7: Docs must clearly explain what the demo proves and does not prove.
- R8: Structure tests must guard the demo package's load-bearing files and
  docs/status must no longer mark it pending.

## Acceptance Criteria

- AC1: `pnpm --filter @onemem/demo-verifiable-research-agent test` passes.
- AC2: `pnpm --filter @onemem/demo-verifiable-research-agent typecheck` passes.
- AC3: `pnpm --filter @onemem/demo-verifiable-research-agent lint` passes.
- AC4: `pnpm --filter @onemem/demo-verifiable-research-agent build` passes.
- AC5: `pnpm --filter @onemem/demo-verifiable-research-agent demo:trace --json`
  emits `ok: true` with three verified sessions in one namespace.
- AC6: The generated sessions can be independently verified by the TS CLI.
- AC7: `pnpm test:structure` passes.

## Out Of Scope

- Real Hermes plugin execution.
- Real web/PDF tools.
- Real MemWal add/search calls.
- Plaintext replay, Walrus availability, or Seal decrypt proof.
- Full demo video.

