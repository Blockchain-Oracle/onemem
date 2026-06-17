# Spec: Holder Self-Revoke

Date: 2026-06-17

## Problem

The product now supports real capability sharing and active capability listing,
but holders still do not have a supported CLI path to renounce a capability they
own. The dashboard mentions self-revoke but does not provide a real command.

## Scope

In scope:

- Add TS SDK capability kind inspection and self-revoke mutation.
- Add TS CLI `namespace revoke <cap-id>`.
- Refuse Admin-cap revocation by default in CLI.
- Update `/share` to display the holder self-revoke command.
- Verify without running destructive live revoke.

Out of scope:

- Owner-driven revoke of another address's cap.
- Hosted dashboard revoke transactions.
- Move contract changes.

## Requirements

- R1: SDK must derive `ReadOnly`, `ReadWrite`, or `Admin` from a capability
  object's on-chain Move type.
- R2: SDK must expose `revokeCapability({ capId })`, consuming the cap object via
  `namespace::revoke_capability<KIND>`.
- R3: CLI must expose `namespace revoke <cap-id>`.
- R4: CLI must refuse Admin capability revocation unless `--allow-admin` is
  passed.
- R5: CLI output must include capability id, kind, network, and transaction
  digest on success.
- R6: `/share` must point holders to `onemem namespace revoke <capability-id>`
  and still state that owner-driven admin revoke is not supported.

## Acceptance Criteria

- AC1: SDK type parsing has focused unit coverage.
- AC2: CLI safety guard has focused unit coverage.
- AC3: `onemem namespace revoke --help` is available.
- AC4: Focused SDK, CLI, dashboard checks pass.
- AC5: `/share` HTTP-render contains the real revoke command and no fake revoke
  action.
- AC6: Verification audit documents that live revoke was intentionally not run.
