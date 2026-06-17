# Spec: Multi-Agent Coordination Executable Demo

Date: 2026-06-17

## Objective

Convert the multi-agent coordination demo from pending storyboard into an
executable safe testnet harness that records and verifies a mocked
cross-runtime coordination workflow as real OneMem traces.

## Background And Current Reality

The protocol already supports `ActionCall.parent_call_id`, including links
across sessions in the same namespace. Existing executable demos prove safe
testnet trace writing, verification, and honest JSON artifacts. The
multi-agent coordination demo is still a README stub plus an aspirational
architecture script.

## Users

- Demo operators preparing hackathon proof.
- Developers validating cross-runtime trace composition.
- Auditors inspecting whether the repo's demo claims match real chain
  evidence.

## Goals

- G1: Add a private workspace package under `demos/multi-agent-coordination`.
- G2: Model a Claude Code orchestrator delegating to Hermes and CrewAI
  specialist sessions.
- G3: Record the demo as real Sui testnet `TraceSession`s and `ActionCall`s.
- G4: Use `parentCallId` links from orchestrator delegate calls to specialist
  first calls.
- G5: Verify every generated session before reporting success.
- G6: Produce a JSON artifact with namespace, session IDs, call IDs,
  cross-runtime links, verification summaries, report hashes, dashboard routes,
  public verifier routes, Suiscan URLs, and proof boundaries.
- G7: Update docs and structure tests so the demo no longer appears pending.

## Non-goals

- No real Claude Code hook execution.
- No real Hermes or CrewAI execution.
- No LangGraph implementation in this v0.1 harness.
- No real parallelism guarantee.
- No MemWal semantic recall proof.
- No Walrus plaintext availability or Seal decrypt proof.
- No claim that `/trace/[id]` renders a complete cross-session tree today.

## Requirements

- R1: `demos/multi-agent-coordination` must be a private pnpm workspace package.
- R2: The package must expose `test`, `typecheck`, `lint`, `build`, and
  `demo:trace` scripts.
- R3: The command must default to testnet and reject non-testnet networks.
- R4: The command must create at least three real OneMem `TraceSession`s in one
  namespace: orchestrator, market specialist, and risk specialist.
- R5: The market specialist's first call must use the market delegate
  `ActionCall` ID as `parentCallId`.
- R6: The risk specialist's first call must use the risk delegate `ActionCall`
  ID as `parentCallId`.
- R7: The orchestrator final synthesis must reference both specialist report
  hashes and source session IDs.
- R8: The command must verify every generated session from chain data.
- R9: Docs must state what is real and what is mocked.
- R10: Structure tests must guard load-bearing demo files and CE artifacts.

## Acceptance Criteria

- AC1: `pnpm --filter @onemem/demo-multi-agent-coordination test` passes.
- AC2: `pnpm --filter @onemem/demo-multi-agent-coordination typecheck` passes.
- AC3: `pnpm --filter @onemem/demo-multi-agent-coordination lint` passes.
- AC4: `pnpm --filter @onemem/demo-multi-agent-coordination build` passes.
- AC5: `pnpm --filter @onemem/demo-multi-agent-coordination demo:trace --json`
  emits `ok: true` with at least three verified sessions in one namespace.
- AC6: The output contains two cross-runtime links whose child first-call parent
  IDs match the orchestrator delegate call IDs.
- AC7: The generated sessions independently verify through the TS CLI.
- AC8: `pnpm test:structure` passes.

## Constraints

- Use current SDK runtime helpers: `resolveNetwork`, `resolveSigner`, and
  `ensureNamespace`.
- Keep new source files under the repo line cap.
- Use placeholder Walrus blob IDs and plaintext hashes, as existing demo
  harnesses do.
- Keep proof boundaries in the model and generated artifact.

## Stories Needed

- Story 1: Run a safe mocked multi-agent trace demo.
- Story 2: Inspect cross-runtime parent links.
- Story 3: Verify and export honest proof boundaries.

## Open Questions

- Should a later dashboard slice build a true cross-session tree walker using
  `parent_call_id` across sessions?
- Should a later live integration test run real Hermes/CrewAI hooks instead of
  the mocked harness?

## Source References

- Research:
  `.thoughts/research/2026-06-17-multi-agent-coordination-executable-demo.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
