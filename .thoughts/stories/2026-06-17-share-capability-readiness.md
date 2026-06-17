# Stories: Share Capability Readiness

## Traceability

- Spec: `.thoughts/specs/2026-06-17-share-capability-readiness.md`
- Research: `.thoughts/research/2026-06-17-share-capability-readiness.md`
- Prototype discovery: `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`

## Story 1: Owner Grants A Namespace Capability

As a namespace owner,
I want a real CLI command to mint and transfer a namespace capability,
so that dashboard share guidance points to an executable path.

### Acceptance Criteria

- Covers R1, R3, R4, and R6.
- `onemem namespace share <namespace-id> <recipient>` exists.
- The command requires an Admin cap through `--admin-cap` or
  `ONEMEM_ADMIN_CAP_ID`.
- The command supports `ReadOnly` and `ReadWrite`.
- JSON output includes `ok`, `namespaceId`, `recipient`, `capKind`, `capId`, and
  `txDigest`.

### Scenarios

- Given I have an Admin cap, when I run `namespace share` with `--cap ReadOnly`,
  then the SDK mints/transfers a ReadOnly capability.
- Given I omit the Admin cap, when I run `namespace share`, then the CLI explains
  the missing admin-cap requirement.

### Notes

This is signer-backed CLI functionality, not dashboard signing.

## Story 2: Operator Inspects Active Capabilities

As an operator,
I want to list active capabilities for a namespace,
so that I can see what access currently exists without signing.

### Acceptance Criteria

- Covers R2 and R5.
- CLI `namespace capabilities <namespace-id>` lists active minted-minus-revoked
  capabilities.
- Dashboard `/share` shows active capabilities when `ONEMEM_NAMESPACE_ID` is
  configured.
- Empty active capability state is explicit.

### Scenarios

- Given a namespace has active capabilities, when I inspect it, then I see cap ID,
  recipient, and kind.
- Given a namespace has no active capabilities, when I inspect it, then I see an
  explicit empty state.

### Notes

This is event-derived state, not an ACL database.

## Story 3: Dashboard Explains Share And Revoke Readiness

As a demo viewer,
I want the Share page to explain what is currently possible,
so that I do not mistake a prototype revoke button for production behavior.

### Acceptance Criteria

- Covers R4, R6, R7, and R8.
- The public verification link card remains available.
- The owner/share card uses a real CLI command and explains signer/Admin-cap
  requirements.
- The page states that holder self-revoke exists in v0.1, while owner-driven
  revoke is future work.
- No owner-driven revoke button appears.

### Scenarios

- Given no namespace is configured, when I open `/share`, then I see how to set
  up or configure a namespace.
- Given a namespace is configured, when I open `/share`, then I see active
  capability state and the real command to share access.

### Notes

This intentionally narrows the prototype to current protocol truth.

## Open Questions

- Whether to implement holder self-revoke as a CLI command next.
