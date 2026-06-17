# Stories: Demo Matrix CI Gate

Date: 2026-06-17

## Traceability

- Spec: `.thoughts/specs/2026-06-17-demo-matrix-ci-gate.md`
- Requirements covered: R1-R6.

## Story 1: Explicit Demo Matrix Gate

As a maintainer,
I want CI to run an explicit deterministic demo matrix gate,
so that demo regressions are visible without searching through broad Turbo
output.

### Acceptance Criteria

- Covers R1, R2, R3, R4.
- Root `test:demo-matrix` exists.
- CI has a named deterministic demo matrix step.
- Structure tests guard both.
- The local command passes.

### Scenarios

Given a change to any demo package,
when CI runs,
then the deterministic demo matrix step runs demo tests, typechecks, lints, and
builds across `demos/*`.

## Story 2: Honest Demo Status

As a demo operator,
I want docs to distinguish deterministic CI coverage from live testnet proof,
so that I do not mistake PR CI for real on-chain demo execution.

### Acceptance Criteria

- Covers R5 and R6.
- Demo pillar README says deterministic demo matrix CI is built.
- E2E test plan states live testnet writes are manual/on-demand for now.

### Scenarios

Given the demo docs,
when I read the implementation status,
then I can tell deterministic demo gates are in CI and live trace proof remains
outside every-PR CI.

## Open Questions

- None blocking this slice.
