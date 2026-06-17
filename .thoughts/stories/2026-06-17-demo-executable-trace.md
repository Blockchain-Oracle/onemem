# Stories: Executable Demo Trace

## Traceability

- Story 1 covers R1, R2, R3, R4, R5 and AC6.
- Story 2 covers R6 and AC5.
- Story 3 covers R7, R8, AC1, AC2, AC3, AC4, and AC7.

## Story 1: Demo Operator Runs A Safe Payment Trace

As a demo operator,
I want to run one command that creates a mocked payment trace on testnet,
so that I can show OneMem's verify moment without moving real funds.

### Acceptance Criteria

- The command creates a real TraceSession on Sui testnet.
- The command verifies the session after writing all calls.
- The command prints or writes the session ID and Suiscan URL.
- The output explicitly states that no real payment was sent.

### Scenarios

Given a funded testnet signer,
when I run the demo command,
then it writes the mocked payment calls and exits successfully only after
verification passes.

## Story 2: Maintainer Repairs The Generic SDK Smoke

As a maintainer,
I want the generic SDK smoke script to use the current SDK API,
so that live trace smoke testing does not rot behind stale method names.

### Acceptance Criteria

- The script uses `startSession`, `appendCall`, `closeCall`, and `endSession`.
- The script creates and verifies a real testnet TraceSession.

## Story 3: Reviewer Gets Regression Coverage

As a reviewer,
I want tests and structure checks for the executable demo,
so that the demo does not regress back to README-only status.

### Acceptance Criteria

- Pure demo call/hash helpers have unit tests.
- Structure tests assert the demo package files exist.
- The demo package typechecks, lints, and passes tests.

## Open Questions

- None blocking.
