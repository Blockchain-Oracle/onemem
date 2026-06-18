# Stories: Trace Close Upgrade Compatibility

## Traceability

- Spec: `.thoughts/specs/2026-06-18-trace-close-upgrade-compatibility.md`
- Requirements: R1-R7
- Acceptance Criteria: AC1-AC5

## Story 1: Operator Upgrades Without ABI Breakage

As a OneMem operator,
I want existing public trace close signatures to remain in the package,
so that Sui upgrade compatibility checks do not fail on an avoidable ABI change.

### Acceptance Criteria

- Covers R1, AC1, AC4.
- The old function names still exist with their old public signatures.
- No struct layout changes are introduced.

## Story 2: Revoked Caps Cannot Use Legacy Close Paths

As a namespace admin,
I want old close functions to stop rather than skip namespace revoke checks,
so that upgrade compatibility does not re-open a security gap.

### Acceptance Criteria

- Covers R2-R3, R6, AC1.
- Old close functions abort with a dedicated error.
- Namespace-aware close functions keep the existing close behavior and revoked-cap
  enforcement.

## Story 3: SDK Users Keep The Same TS API

As an SDK user,
I want `closeCall` and `endSession` to keep working through the TS API,
so that I do not need to learn new SDK method names while the SDK targets the
correct Move functions internally.

### Acceptance Criteria

- Covers R4-R5, AC2-AC3.
- SDK transactions target the new namespace-aware Move functions.
- The testnet smoke script passes `namespaceId` during close operations.

## Open Questions

- Live testnet upgrade and metadata rewrite are follow-up once dry-run
  compatibility is proven.
