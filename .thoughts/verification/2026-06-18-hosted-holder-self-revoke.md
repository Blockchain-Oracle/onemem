# Verification Audit: Hosted Holder Self-Revoke

## Verdict

Pass with one live-proof caveat.

Hosted recipient capability pages now have a wallet-signed sponsored
self-revoke path for the capability holder. Owner-driven revocation remains out
of scope and unclaimed.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-18-hosted-holder-self-revoke.md`
- Spec:
  `.thoughts/specs/2026-06-18-hosted-holder-self-revoke.md`
- Stories:
  `.thoughts/stories/2026-06-18-hosted-holder-self-revoke.md`
- Plan:
  `.thoughts/plans/2026-06-18-hosted-holder-self-revoke.md`
- Hosted helper:
  `apps/hosted-dashboard/lib/sponsored-provisioning.ts`
- Hosted recipient page:
  `apps/hosted-dashboard/app/share/[capability_id]/page.tsx`
  `apps/hosted-dashboard/app/share/[capability_id]/ShareCapabilityAccountHint.tsx`
- Tests:
  `apps/hosted-dashboard/lib/sponsored-provisioning.test.ts`
  `apps/hosted-dashboard/scripts/browser-smoke.mjs`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| R1: Helper accepts self-revoke action | `SponsoredProvisioningAction` includes `cap-self-revoke`; request validation requires `capId` and `capKind`. |
| R2: Helper builds typed Move call | `buildTransactionKindBytes` calls `namespace::revoke_capability` with type argument `namespace::<KIND>` and the cap object. |
| R3: Execution returns revoke metadata | `executeSponsoredProvisioning` returns `revokedCapId`, `capKind`, and `txDigest` after successful effects. |
| R4: Recipient page exposes client self-revoke | `ShareCapabilityAccountHint` prepares, signs, and executes the sponsored revoke flow. |
| R5: Connected wallet must match owner | Client action derives `matches` from connected wallet and capability owner; button stays disabled otherwise. |
| R6: Admin safety | Admin pages require an acknowledgement checkbox before enabling self-revoke. |
| R7: Owner-driven revoke remains unclaimed | Docs and UI continue to state owner-driven revocation is unsupported in contract v0.1. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| AC1: Unit coverage | `apps/hosted-dashboard/lib/sponsored-provisioning.test.ts` covers self-revoke request resolution, cap validation, success output, and failed transaction propagation. |
| AC2: Browser smoke without config | `browser:smoke` posts `cap-self-revoke` to `/api/share/sponsored/prepare` and verifies 503 missing config with no secret leak. |
| AC3: Hosted package gates | Hosted tests, typecheck, production build, and browser smoke all passed. |
| AC4: Structure tests | `mise exec -- pnpm test:structure` passed, 361/361. |
| AC5: No owner-driven revoke claim | Docs and UI state owner-driven revoke is unsupported in contract v0.1. |

## Quality Gates

Executed:

```bash
mise exec -- pnpm --filter @onemem/hosted-dashboard test
mise exec -- pnpm --filter @onemem/hosted-dashboard typecheck
mise exec -- pnpm --filter @onemem/hosted-dashboard build
mise exec -- pnpm --filter @onemem/hosted-dashboard browser:smoke
mise exec -- pnpm test:structure
mise exec -- pnpm exec biome check apps/hosted-dashboard tests/structure package.json
git diff --check
```

Results:

- Hosted tests: passed, 39/39.
- Hosted typecheck: passed.
- Hosted production build: passed.
- Hosted browser smoke: passed, 53 checks.
- Structure tests: passed, 361/361.
- Biome check: passed, 50 files checked.
- Git whitespace check: passed.

## Deviations From Plan

- None.

## Gaps And Risks

- Live wallet-popup self-revoke has not been executed yet.
- Production Enoki policy may require external allowlist configuration for the
  new `namespace::revoke_capability` target.

## Follow-ups

- Run a live connected-wallet self-revoke proof when Enoki and wallet state are
  available.

## Evidence Log

- Contract source confirms holder-only self-revoke.
- Hosted unit tests confirm the new action is deterministic and non-mutating in
  tests.
- Browser smoke confirms the self-revoke prepare endpoint fails closed without
  hosted sponsorship config and does not leak configured secret names.
