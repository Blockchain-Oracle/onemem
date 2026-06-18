# Plan: Admin Capability Revoke

## Inputs

- Research: `.thoughts/research/2026-06-18-admin-capability-revoke.md`
- Spec: `.thoughts/specs/2026-06-18-admin-capability-revoke.md`
- Stories: `.thoughts/stories/2026-06-18-admin-capability-revoke.md`
- Existing quality profile and repo rule: product source files under 400 lines.

## Assumptions

- Dynamic fields on `MemoryNamespace.id` are acceptable for new revocation
  state because the package already uses dynamic fields for versioning.
- Deployed package migration sequencing is separate from making the source tree
  internally correct.
- Hosted dashboard admin revoke can follow after protocol/tooling support.

## Open Questions

- Whether the release should preserve old trace close signatures through a
  temporary compatibility wrapper. This plan prioritizes source consistency and
  enforcement.

## Phase 1: Protocol Enforcement

### Goal

Add Admin-gated cap ID revocation and enforce it across all authorization gates.

### Work

- Add namespace dynamic-field marker helpers.
- Add `admin_revoke_capability`.
- Update trace close signatures to receive namespace and call the namespace
  gate.
- Update `seal_approve` to reuse the namespace gate after preserving its
  wrong-namespace error.

### Checks

- `mise exec -- pnpm --filter @onemem/contracts test`
- Move tests for marker, trace denial, and Seal denial.

### Acceptance Criteria Covered

- AC1, parts of AC4.

### Stop Condition

- Contract tests pass and no gate accepts a revoked cap.

## Phase 2: SDK, CLI, MCP

### Goal

Expose admin revoke through the public TS and agent-facing tooling.

### Work

- Add SDK `adminRevokeCapability`.
- Update trace SDK calls for namespace-aware close/end.
- Add CLI `namespace admin-revoke`.
- Add MCP revoke tool.

### Checks

- Focused package tests for SDK/CLI/MCP.
- Typecheck/build where package scripts require it.

### Acceptance Criteria Covered

- AC2, AC3, parts of AC4.

### Stop Condition

- Tooling compiles and tests prove command/tool registration and safety guards.

## Phase 3: Docs And Structure Guards

### Goal

Document the two revoke paths without over-claiming object deletion.

### Work

- Update CLI, SDK, architecture, and MCP docs.
- Add or update structure tests if command surfaces are guarded there.

### Checks

- `mise exec -- pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

- AC5.

### Stop Condition

- Docs and structure tests agree with implementation.

## Verification Checkpoint

- Produce `.thoughts/verification/2026-06-18-admin-capability-revoke.md`.
- Include command outputs, test coverage, deviations, and live-test omissions.

## Handoff Notes

- Hosted owner/admin revoke UI is a follow-up.
- A disposable live testnet cap can be used later to prove end-to-end mutation
  without risking real user access.
