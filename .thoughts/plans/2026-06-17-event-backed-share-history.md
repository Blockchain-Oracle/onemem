# Plan: Event-backed Share History

## Inputs

- Research:
  `.thoughts/research/2026-06-17-event-backed-share-history.md`
- Spec:
  `.thoughts/specs/2026-06-17-event-backed-share-history.md`
- Stories:
  `.thoughts/stories/2026-06-17-event-backed-share-history.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Current hosted share implementation.
- Context7 Sui SDK event-query docs.

## Assumptions

- Hosted history can be read without wallet connection or sponsorship.
- The SDK should own the event-joining logic so future local dashboard or CLI
  surfaces can reuse it.
- Browser smoke can verify the panel and empty state without relying on a live
  namespace.

## Open Questions

- Whether to add local dashboard history in a later slice.

## Phase 1: SDK Event History Reader

### Goal

Create reusable capability-history rows from Sui events.

### Work

- Add a helper for querying capability minted/revoked events.
- Join rows by cap id and mark active/revoked state.
- Expose `NamespacesAPI.getCapabilityHistory(namespaceId)`.
- Add unit tests for event joining, timestamps, tx digests, and sorting.

### Checks

- `pnpm --filter @onemem/sdk-ts test`
- `pnpm --filter @onemem/sdk-ts typecheck`
- `pnpm --filter @onemem/sdk-ts build`

### Acceptance Criteria Covered

R1, R2, R3, AC1, AC5.

### Stop Condition

The SDK returns deterministic history rows from injected event pages.

## Phase 2: Hosted API And UI

### Goal

Show event-backed history on hosted `/share`.

### Work

- Add `GET /api/share/history`.
- Add hosted helper tests for validation and response shape.
- Add a client history panel component below share source/last minted cards.
- Refresh the panel after a successful share.
- Add browser-smoke assertions for history panel empty state.

### Checks

- `pnpm --filter @onemem/hosted-dashboard test`
- `pnpm --filter @onemem/hosted-dashboard lint`
- `pnpm --filter @onemem/hosted-dashboard typecheck`
- `pnpm --filter @onemem/hosted-dashboard build`
- `pnpm --filter @onemem/hosted-dashboard browser:smoke`

### Acceptance Criteria Covered

R4, R5, R6, R7, AC2, AC3, AC4.

### Stop Condition

Hosted `/share` renders history panel states and passes browser smoke.

## Phase 3: Docs And Verification

### Goal

Make the new event-history truth durable.

### Work

- Update structure tests for route/API/helper/artifacts.
- Update route/share docs, status wiki, project log, and hosted README as
  needed.
- Write verification audit.

### Checks

- `pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

R8, AC6.

### Stop Condition

Verification audit maps requirements to code and passing command evidence.

## Verification Checkpoint

Write
`.thoughts/verification/2026-06-17-event-backed-share-history.md` before
claiming this slice complete.

## Handoff Notes

Do not add owner-driven revoke, claim transfer, or fake share rows. Live
wallet-popup share execution remains separate manual proof.
