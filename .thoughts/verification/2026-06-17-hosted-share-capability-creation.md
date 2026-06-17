# Verification Audit: Hosted Share Capability Creation

## Verdict

Pass for automated code, route, and guardrail coverage.

Hosted `/share` is now implemented as an owner-initiated sponsored capability
minting surface. The server still owns transaction construction, Enoki
sponsorship, execution, and object-change parsing; the browser only signs
server-returned sponsored bytes. Automated verification covers validation,
allowlists, ReadOnly/ReadWrite capability parsing, browser render/no-config
behavior, and quality gates. Live wallet-popup execution was not completed in
automated smoke, so live sponsored share execution remains a manual proof item.

## Artifacts Checked

- Spec:
  `.thoughts/specs/2026-06-17-hosted-share-capability-creation.md`
- Stories:
  `.thoughts/stories/2026-06-17-hosted-share-capability-creation.md`
- Plan:
  `.thoughts/plans/2026-06-17-hosted-share-capability-creation.md`
- Quality profile:
  `.thoughts/quality/2026-06-17-project-quality-profile.md`
- Prototype:
  `/Users/abu/Downloads/One Mem 2/Share.html`
- Implementation:
  `apps/hosted-dashboard/lib/sponsored-provisioning.ts`
  `apps/hosted-dashboard/app/api/share/sponsored/prepare/route.ts`
  `apps/hosted-dashboard/app/api/share/sponsored/execute/route.ts`
  `apps/hosted-dashboard/app/share/page.tsx`
  `apps/hosted-dashboard/app/share/HostedShareView.tsx`
  `apps/hosted-dashboard/scripts/browser-smoke.mjs`
  `apps/hosted-dashboard/lib/sponsored-provisioning.test.ts`
  `tests/structure.test.ts`
- Status/docs:
  `.thoughts/wiki/context-engineering-status.md`
  `.thoughts/wiki/index.md`
  `.thoughts/wiki/log.md`
  `docs/05-our-architecture/06-dashboard/route-share.md`
  `docs/05-our-architecture/06-dashboard/hosted-deploy.md`
  `docs/05-our-architecture/06-dashboard/ui-architecture.md`
  `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`
  `docs/05-our-architecture/06-dashboard/data-flow.md`

## Requirement Traceability

- R1: `SponsoredProvisioningAction` now includes `ro-cap-share` and
  `rw-cap-share`.
- R2: `resolveSponsoredProvisioningRequest()` validates sender, recipient,
  namespace ID, Admin cap ID, action, and network before sponsorship.
- R3: `moveTargets()` resolves each action to one exact OneMem Move target and
  `allowedAddresses` includes sender plus recipient.
- R4: `executeSponsoredProvisioning()` parses
  `NamespaceCapability<ReadOnly|ReadWrite>` object IDs from transaction
  `objectChanges`.
- R5: `apps/hosted-dashboard/app/share/page.tsx` and `HostedShareView.tsx`
  provide a hosted-owned `/share` route with disconnected, manual-input, and
  ready-to-share states.
- R6: `HostedShareView` uses dApp Kit `useSignTransaction` on bytes returned by
  `/api/share/sponsored/prepare`; private Enoki config remains server-only.
- R7: The UI loads `loadHostedProvisioningState()` for matching connected
  account/network and leaves inputs editable for recovery/manual demos.
- R8: Successful UI state records recipient, kind, capability ID, and
  transaction digest from the execute response.
- R9: The public verification-link helper remains on `/share`.
- R10: The route boundary states that recipient claim links and owner-driven
  revoke are separate future work.

## Acceptance Criteria Coverage

- AC1: Passed. Unit tests reject malformed recipient input before Enoki calls.
- AC2: Passed. Unit tests assert strict ReadOnly/ReadWrite target and address
  allowlists through the pure resolver.
- AC3: Passed. Unit tests inject transaction effects and assert ReadOnly and
  ReadWrite capability IDs are parsed by kind.
- AC4: Passed. Hosted browser smoke visits `/share`, verifies public verifier
  copy, sponsored mint copy, account gate, boundary copy, and missing-config API
  behavior.
- AC5: Passed in final quality gates listed below.
- AC6: Passed. Status, wiki index, log, and current dashboard docs were updated.

## Quality Gates

- `pnpm --filter @onemem/hosted-dashboard test`: passed, 5 files / 24 tests.
- `pnpm --filter @onemem/hosted-dashboard typecheck`: passed.
- `pnpm --filter @onemem/hosted-dashboard lint`: passed.
- `pnpm --filter @onemem/hosted-dashboard build`: passed.
- `pnpm --filter @onemem/hosted-dashboard browser:smoke`: passed, 43 checks.
- `pnpm test:structure`: passed after this audit was registered.
- `git diff --check`: passed.

## Deviations From Plan

- The share APIs were added under `/api/share/sponsored/*` instead of reusing
  only `/api/onboarding/sponsored/*`, while still sharing the same helper. This
  keeps route ownership clearer and preserves onboarding compatibility.
- Automated smoke intentionally clears `ENOKI_PRIVATE_KEY` and
  `ENOKI_SECRET_KEY`, so it proves no-config honesty rather than completing a
  wallet-popup transaction.

## Gaps And Risks

- Live sponsored share execution with a real connected browser wallet remains
  manual/live proof.
- Recipient `/share/[capability_id]` claim flow is not implemented. A later
  slice implements a read-only recipient capability object view instead.
- Owner-driven revoke still requires protocol support beyond the v0.1 holder
  self-revoke path.
- Hosted share history is not persisted server-side; future UI should read from
  on-chain capability events instead of inventing local history.

## Follow-ups

- Build claim/transfer semantics only after the protocol meaning is scoped.
- Add event-backed share history for owner/recipient views.
- Run live wallet/sponsorship proof when a connected browser wallet and Enoki
  config are available.

## Evidence Log

- Context7 refreshed Enoki sponsored transaction docs from
  `/websites/enoki_mystenlabs`.
- Hosted browser smoke wrote
  `apps/hosted-dashboard/.browser-smoke/hosted-sponsored-provisioning.png`.
- A subagent docs audit identified stale hosted-share docs; current-facing docs
  were updated in this slice.
