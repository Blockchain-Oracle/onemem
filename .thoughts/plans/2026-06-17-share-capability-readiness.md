# Plan: Share Capability Readiness

## Inputs

- Reality research:
  `.thoughts/research/2026-06-17-share-capability-readiness.md`
- Spec: `.thoughts/specs/2026-06-17-share-capability-readiness.md`
- Stories: `.thoughts/stories/2026-06-17-share-capability-readiness.md`
- Prototype discovery:
  `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`

## Assumptions

- The TS CLI is the right place for signer-backed namespace sharing in v0.1.
- Dashboard `/share` should stay read-only and command-oriented until hosted
  auth/sponsored transaction support exists.
- Existing persisted `~/.onemem/*.json` targets may not have `adminCapId`, so
  code must tolerate it being absent.

## Open Questions

- Holder self-revoke is intentionally left for a follow-up command.
- Hosted recipient claim remains out of scope for this pass.

## Phase 1: CLI Namespace Commands

### Goal

Make the dashboard's share guidance executable through the TS CLI.

### Work

- Extend `ProvisionedTarget` with optional `adminCapId`.
- Persist and print `adminCapId` for freshly provisioned namespaces.
- Add `packages/cli-ts/src/commands/namespace.ts`.
- Register `onemem namespace share` and `onemem namespace capabilities`.
- Add focused unit tests for cap-kind/admin-cap parsing.

### Checks

```bash
pnpm --filter @onemem/cli typecheck
pnpm --filter @onemem/cli test
pnpm --filter @onemem/cli lint
pnpm --filter @onemem/cli build
```

### Acceptance Criteria Covered

AC1, AC2.

### Stop Condition

The CLI exposes real namespace capability commands without requiring dashboard
signing.

## Phase 2: Dashboard Share Surface

### Goal

Translate the prototype Share screen into an honest readiness surface.

### Work

- Fetch configured namespace and active capabilities on `/share`.
- Render public verification link, owner/share readiness, active capability list,
  recipient explanation, and v0.1 revoke limitations.
- Remove the dead static command and any fake owner-revoke affordance.

### Checks

```bash
pnpm --filter @onemem/dashboard typecheck
pnpm --filter @onemem/dashboard lint
pnpm --filter @onemem/dashboard build
```

### Acceptance Criteria Covered

AC3, AC4, AC6.

### Stop Condition

`/share` shows real capability state when configured and a clear no-namespace
state otherwise.

## Phase 3: Verification And Context Update

### Goal

Prove the slice and preserve it in `.thoughts`.

### Work

- Run focused checks plus structure test.
- HTTP-render or browser-check `/share`.
- Write verification audit and update wiki/index/status.

### Checks

```bash
pnpm test:structure
```

### Acceptance Criteria Covered

AC4, AC5, AC6.

### Stop Condition

CLI, dashboard, tests, route output, and Context Engineering artifacts align.

## Verification Checkpoint

Use the `verification-audit` skill before claiming this scope complete.

## Handoff Notes

This scope intentionally leaves hosted recipient claim, dashboard signing,
holder self-revoke CLI, and owner-driven admin revoke for later work.
