# Verification Audit: Recipient Share Landing

## Verdict

Pass for automated SDK, hosted route, browser-smoke, and documentation
coverage.

Hosted `/share/[capability_id]` is now a public read-only recipient landing
route. It reads a real Sui `NamespaceCapability` object, derives the capability
kind from the Move phantom type, reads the namespace id from object fields,
loads namespace metadata when available, and compares the connected wallet with
the on-chain object owner. It does not claim to execute a hosted claim
transaction because v0.1 share minting already transfers the capability object
to the recipient address.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-17-recipient-share-landing.md`
- Spec:
  `.thoughts/specs/2026-06-17-recipient-share-landing.md`
- Stories:
  `.thoughts/stories/2026-06-17-recipient-share-landing.md`
- Plan:
  `.thoughts/plans/2026-06-17-recipient-share-landing.md`
- Implementation:
  `packages/sdk-ts/src/namespace-capabilities.ts`
  `packages/sdk-ts/src/namespaces.ts`
  `packages/sdk-ts/tests/namespaces.unit.test.ts`
  `apps/hosted-dashboard/lib/share-capability.ts`
  `apps/hosted-dashboard/lib/share-capability.test.ts`
  `apps/hosted-dashboard/app/share/[capability_id]/page.tsx`
  `apps/hosted-dashboard/app/share/[capability_id]/ShareCapabilityAccountHint.tsx`
  `apps/hosted-dashboard/app/share/HostedShareView.tsx`
  `apps/hosted-dashboard/scripts/browser-smoke.mjs`
  `tests/structure.test.ts`
- Docs/status:
  `docs/05-our-architecture/06-dashboard/route-share.md`
  `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`
  `docs/05-our-architecture/06-dashboard/data-flow.md`
  `docs/05-our-architecture/06-dashboard/hosted-deploy.md`
  `docs/05-our-architecture/06-dashboard/README.md`
  `apps/hosted-dashboard/README.md`
  `.thoughts/wiki/context-engineering-status.md`
  `.thoughts/wiki/index.md`
  `.thoughts/wiki/log.md`
  `.thoughts/wiki/project-map.md`

## Requirement Traceability

- R1: `NamespacesAPI.getCapability()` reads capability type, content, and owner.
- R2: `namespaceCapabilityFromSuiObject()` rejects non-capability objects and
  missing `namespace_id`.
- R3: `loadShareCapability()` returns a typed public not-found result for absent
  capability objects.
- R4: Namespace lookup failures degrade to a visible namespace error while
  preserving capability metadata.
- R5: The route shows capability kind, owner, owner kind, namespace, network,
  namespace summary, and Suiscan links.
- R6: `ShareCapabilityAccountHint` compares the connected dApp Kit account with
  the capability owner and does not offer a fake claim button.
- R7: Browser smoke visits `/share/<missing-capability-id>` and verifies the
  honest not-found state.
- R8: Docs/status now distinguish recipient landing from future claim/transfer
  and owner-driven revoke work.

## Quality Gates

- `pnpm --filter @onemem/sdk-ts test`: passed, 9 files / 70 tests, 2 skipped
  integration files.
- `pnpm --filter @onemem/sdk-ts typecheck`: passed.
- `pnpm --filter @onemem/sdk-ts build`: passed on standalone rerun. A prior
  parallel build attempt failed with an esbuild service-stop error while
  typecheck ran concurrently; rerun by itself succeeded.
- `pnpm --filter @onemem/sdk-ts lint`: passed with existing warnings in older
  integration/suppression files outside this slice.
- `pnpm --filter @onemem/hosted-dashboard test`: passed, 6 files / 28 tests.
- `pnpm --filter @onemem/hosted-dashboard lint`: passed.
- `pnpm --filter @onemem/hosted-dashboard typecheck`: passed.
- `pnpm --filter @onemem/hosted-dashboard build`: passed; Next build lists
  `/share/[capability_id]` as a dynamic route.
- `pnpm --filter @onemem/hosted-dashboard browser:smoke`: passed, 48 checks.
- `pnpm test:structure`: passed, 200 tests.
- `git diff --check`: passed.

## Gaps And Risks

- No live sponsored wallet-popup share execution was performed in this slice.
- The route proves capability object ownership and metadata, not Seal/Walrus
  plaintext access or runtime usage.
- Owner-driven revoke remains unsupported by the v0.1 contract.
- A future claim/transfer protocol would need an explicit contract/API design;
  this page intentionally does not fake one.
