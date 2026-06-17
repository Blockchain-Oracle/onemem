# Spec: Switch Laptops Executable Demo

## Objective

Make the pending "Switch Laptops" demo executable by adding a safe, repeatable
workspace demo that creates two real Sui testnet OneMem `TraceSession`s in the
same namespace: a mocked Laptop A Claude Code memory-write session and a mocked
Laptop B Hermes memory-recall session.

## Background And Current Reality

The docs identify "Switch Laptops" as the headline demo for memory following a
user across machines and runtimes, but the demo is currently README-only. The
repo already has a proven executable demo pattern and SDK helpers for
provisioning/reusing a namespace, writing traces, and verifying from chain data.

## Users

- Demo operator preparing a hackathon recording.
- Reviewer validating that the headline continuity story has a runnable proof.
- Maintainer checking that demo scaffolding remains executable.

## Goals

- Add `demos/switch-laptops` as an executable workspace package.
- Record two real testnet sessions in one OneMem namespace.
- Make the mocked Claude/Hermes boundary explicit.
- Write a JSON artifact with both session IDs, namespace ID, call IDs,
  verification summaries, continuity facts, and proof boundaries.
- Add unit tests for the pure demo model and hashes.
- Update demo/docs/status and structure tests.

## Non-goals

- Do not claim real Claude Code or Hermes hooks ran.
- Do not claim actual MemWal memory recall, Walrus plaintext availability, or
  Seal decryptability.
- Do not require a second laptop, browser login, Enoki, MemWal credentials, or
  real hosted dashboard account state.
- Do not build a new dashboard route in this slice.

## Requirements

- R1: The demo command must default to testnet and reject non-testnet networks.
- R2: The command must reuse/provision one namespace and create two sessions in
  that namespace.
- R3: The Laptop A session must contain calls representing project-context
  capture and memory persistence.
- R4: The Laptop B session must contain calls representing memory recall and
  an answer that uses the recalled context.
- R5: Both sessions must be verified, and the command must exit non-zero if
  either verification fails.
- R6: The output artifact must include both sessions, call IDs, namespace ID,
  Suiscan/dashboard/verify paths, and proof boundaries.
- R7: Tests must cover the deterministic demo model and hash generation.
- R8: Structure tests must guard the executable demo package files.
- R9: Docs must mark Switch Laptops as executable and describe the proof
  boundary honestly.

## Acceptance Criteria

- AC1: `pnpm --filter @onemem/demo-switch-laptops test` passes.
- AC2: `pnpm --filter @onemem/demo-switch-laptops typecheck` passes.
- AC3: `pnpm --filter @onemem/demo-switch-laptops lint` passes.
- AC4: `pnpm --filter @onemem/demo-switch-laptops demo:trace --json` creates
  and verifies two live testnet sessions in one namespace.
- AC5: `pnpm --filter @onemem/cli exec tsx src/index.ts --network testnet --json verify <session>`
  independently verifies both sessions created by the demo.
- AC6: `pnpm test:structure` passes.
- AC7: `git diff --check` passes.

## Constraints

- Use existing SDK and runtime helpers.
- Keep source files under the repository structure-test line cap.
- Do not print private keys or credentials.
- Do not move real assets or write real user memory without explicit proof
  boundaries.

## Stories Needed

- Demo operator runs a safe switch-laptops trace.
- Reviewer sees same-namespace continuity evidence.
- Maintainer verifies the demo package stays wired into the workspace.

## Open Questions

- Whether a later slice should drive real Claude Code and Hermes plugin hooks
  after this deterministic proof exists.

## Source References

- `.thoughts/research/2026-06-17-switch-laptops-executable-demo.md`
- `.thoughts/quality/2026-06-17-project-quality-profile.md`
- `docs/05-our-architecture/08-demos-and-tests/demo-switch-laptops.md`
- `demos/agent-sends-money`
- `packages/sdk-ts/src/runtime.ts`
- `packages/cli-ts/src/commands/verify.ts`
