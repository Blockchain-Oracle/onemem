# Stories: Multi-Agent Coordination Executable Demo

Date: 2026-06-17

## Traceability

- Spec:
  `.thoughts/specs/2026-06-17-multi-agent-coordination-executable-demo.md`
- Requirements covered: R1-R10.

## Story 1: Run A Safe Multi-Agent Demo

As a demo operator,
I want to run one command that records a mocked multi-agent coordination flow,
so that I can show real OneMem testnet traces without triggering real external
agents or financial effects.

### Acceptance Criteria

- Covers R1, R2, R3, R4, R8, R9.
- Package scripts exist and pass.
- `demo:trace --json` rejects `--network mainnet`.
- Live testnet output reports `ok: true`.

### Scenarios

Given a funded testnet signer,
when I run `demo:trace --json`,
then the command creates orchestrator and specialist sessions in one namespace
and verifies all of them before success.

Given a non-testnet network argument,
when I run the command,
then it exits non-zero with an explicit testnet-only error.

### Notes

The runtime labels are mocked. This story is about safe, reproducible trace
proof.

## Story 2: Inspect Cross-Runtime Links

As a developer,
I want specialist sessions to start under orchestrator delegate call IDs,
so that I can prove the protocol supports cross-session composition.

### Acceptance Criteria

- Covers R5 and R6.
- The output includes one market specialist link and one risk specialist link.
- Each link records parent session, parent call, child session, child first
  call, source runtime, and target runtime.

### Scenarios

Given the orchestrator emitted `delegate_market_specialist`,
when the Hermes specialist session starts,
then its first call's `parentCallId` equals the market delegate call ID.

Given the orchestrator emitted `delegate_risk_specialist`,
when the CrewAI specialist session starts,
then its first call's `parentCallId` equals the risk delegate call ID.

## Story 3: Verify Honest Boundaries

As an auditor,
I want the artifact and docs to separate real proof from mocked behavior,
so that demo claims remain defensible.

### Acceptance Criteria

- Covers R7, R8, R9, R10.
- The final orchestrator call references both specialist report hashes.
- The artifact includes proof-boundary text.
- Docs avoid claiming real Claude/Hermes/CrewAI/LangGraph execution.
- Structure tests guard package files and CE artifacts.

### Scenarios

Given a generated artifact,
when I inspect the final synthesis,
then it cites market and risk report content hashes and source sessions.

Given the README,
when I read proof boundaries,
then I can tell which parts were written to Sui and which parts are mocked.

## Open Questions

- None blocking this executable demo.
