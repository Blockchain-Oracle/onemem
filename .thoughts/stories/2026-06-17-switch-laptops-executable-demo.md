# Stories: Switch Laptops Executable Demo

## Traceability

- Spec: `.thoughts/specs/2026-06-17-switch-laptops-executable-demo.md`
- Requirements: R1-R9
- Acceptance criteria: AC1-AC7

## Story 1: Demo Operator Runs Continuity Proof

As a demo operator,
I want one command to create the switch-laptops trace,
so that I can prepare a recording from live testnet evidence instead of a
README script.

### Acceptance Criteria

- Covers R1, R2, R3, R4, R5, R6.
- The command creates two completed sessions in one namespace.
- The command prints/writes session IDs and proof boundaries.

### Scenarios

- Given a funded testnet signer, when I run the demo command, then the command
  writes two sessions and verifies both.
- Given `--network mainnet`, when I run the command, then it fails before
  writing because this safe demo is testnet-only.

### Notes

- The runtime names are mocked labels, not proof that Claude Code or Hermes
  hooks ran.

## Story 2: Reviewer Checks Same-Namespace Continuity

As a reviewer,
I want the artifact to show both sessions under one namespace,
so that I can see what continuity is actually being claimed.

### Acceptance Criteria

- Covers R2, R5, R6.
- The artifact includes `namespaceId`, session summaries, call IDs, and
  verification roots.
- The proof boundaries state what is not proven.

### Scenarios

- Given the artifact, when I compare both session rows, then their namespace is
  identical.
- Given each session ID, when I run the CLI verifier, then each session verifies
  independently.

### Notes

- This does not replace a future dashboard paired-session visualization.

## Story 3: Maintainer Keeps Demo Executable

As a maintainer,
I want tests and structure checks for the switch-laptops package,
so that future cleanup does not silently degrade it back to README-only.

### Acceptance Criteria

- Covers R7, R8, R9.
- Unit tests cover model ordering and deterministic hashes.
- Structure tests include the package in the executable demo guard.
- Docs list the demo as executable with honest status.

### Scenarios

- Given a future refactor, when source files are removed, then structure tests
  fail.
- Given a model change, when call order or continuity claims drift, then unit
  tests catch it.

### Notes

- Structure tests guard existence; behavior remains covered by package tests and
  live smoke.

## Open Questions

- None blocking for this deterministic demo slice.
