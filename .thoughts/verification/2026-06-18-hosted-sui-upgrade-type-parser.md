# Verification Audit: Hosted Sui Upgrade Type Parser

Date: 2026-06-18

## Verdict

Conditional pass. The production failure
`transaction did not create expected object type ...::namespace::MemoryNamespace`
was caused by mixing Sui current package IDs with original package IDs after a
package upgrade. Move calls still target current package
`0xc2e839c719e1c61222440f5661199e68de5413d8cfb49dd8bae3223e92fcf138`, while
created object types and event types use original package
`0x64c14fc069fe3d3584b8474b4e9b58beb55373767edecedf6e4c53732d4ceafc`.

The parser/model fix plus the app-side cancel/guard UX hardening are
implemented, tested, built, and deployed to production. A later parser
hardening pass added exact-match-first semantic fallback for OneMem namespace
object shapes and is live as Vercel deployment
`dpl_EfEcJ5xcTVUEeQwGkKFEpV6x9nMg`, aliased to `https://app.onemem.xyz`.
A follow-up production user-flow pass is live as deployment
`dpl_5ntGx66kHTKGdqXLeSnofvsutX98`; it reuses saved namespace/Admin/ReadWrite
state on onboarding, so connected users who already provisioned do not hit the
namespace-create parser path again unless they deliberately choose to create a
new namespace.

The remaining condition is live wallet completion: browser automation cannot
approve `chrome-extension://` Slush prompts directly, so the full
namespace-create plus ReadWrite-capability mint still requires manual wallet
approval before claiming hosted onboarding end-to-end.

## Artifacts Checked

- `config/networks.json`
- `config/networks.schema.json`
- `scripts/codegen-move-types.ts`
- `scripts/codegen-move-python.py`
- `scripts/deploy-contract.sh`
- `scripts/migrate-contract.sh`
- `packages/sdk-ts/src/generated/addresses.ts`
- `packages/sdk-python/onemem/generated/addresses.py`
- `apps/hosted-dashboard/lib/sponsored-provisioning.ts`
- `apps/hosted-dashboard/lib/sponsored-provisioning.test.ts`
- `packages/sdk-ts/src/namespaces.ts`
- `packages/sdk-ts/src/traces.ts`
- `packages/sdk-ts/src/memory.ts`
- `packages/sdk-ts/tests/namespaces-upgrade.unit.test.ts`
- `packages/cli-ts/src/util/sui.ts`
- `packages/cli-ts/src/commands/trace.ts`
- `packages/cli-ts/tests/trace-format.test.ts`
- `packages/sdk-python/onemem/client.py`
- `packages/sdk-python/tests/test_verify.py`
- `apps/hosted-dashboard/walrus-sites/verifier/app.js`
- `tests/structure/walrus-static-verifier.test.ts`

## Requirement Traceability

- Current package ID remains the Move-call target:
  `package_id = 0xc2e839...`.
- Original package ID is now recorded in the network manifest:
  `original_package_id = 0x64c14f...`.
- Generated TS and Python address artifacts now expose
  `originalPackageId` / `original_package_id`.
- Hosted sponsored provisioning parses namespace/Admin/ReadWrite capability
  object changes using the original package ID.
- Hosted sponsored provisioning now also accepts the same
  `MemoryNamespace`/`NamespaceCapability<T>` Move type shape if the package ID
  in object changes drifts again, and failed parser errors include the observed
  created object types.
- Hosted onboarding loads saved provisioning state for the connected account and
  active network before offering a fresh namespace mutation.
- SDK namespace, trace, and memory event/object readers use the original package
  ID where Sui object/event types require it.
- CLI read context now keeps current package ID and original event package ID
  separate, so `trace list` queries upgraded `TraceSessionOpenedEvent` streams
  correctly.
- Python `OneMem.verify_session` now uses `original_package_id` for event
  queries when present.
- App-side onboarding no longer allows Continue past the provisioning step until
  namespace/Admin/RW IDs exist, and a cancel action invalidates stale wallet
  requests so late approvals cannot overwrite a newer run.
- Deploy/migration scripts preserve the current/original package distinction for
  future upgrades.
- Static Walrus verifier event queries now use the original package ID.

## Acceptance Criteria Coverage

- The user-reported transaction was verified on testnet as successful:
  `3X6Qr5Dyq7tWq5zZcUsooNc8JAcWbhZswc1uzz4HNCUH`.
- That transaction created:
  - namespace `0xac24529b68a9579b6bcc4e3c721ff9c49d72a5129eb94623b9c747ec1ef37e6a`
  - Admin cap `0x81f35141cddf5ebcab5c73f88cea613a2cc322a7b0cf66ac07267f1fad605e2f`
  - object types under original package `0x64c14f...`
- Production `/api/onboarding/sponsored/prepare` now builds a valid
  `rw-cap-mint` transaction for that recovered namespace/Admin cap.
- Chrome reload of `https://app.onemem.xyz/onboarding` on the patched deployment
  shows connected account `0x93b37bc1...d119d6`, enabled Continue, and no app
  console errors on fresh load.
- A later Slush-approved namespace-create also landed successfully on testnet:
  `HvxmvsUoMwsTTPhZzvBUztPADvZGN37rau5h8cQd2iDk`, namespace
  `0x6c5d883a66f3ae5b1c89f940e94346c20fdea83a40217c0cd28e1326615b14d1`.
- Chrome verification on production deployment `dpl_697kAYJWnJQteUYXURrcTYj3foSA`:
  `https://app.onemem.xyz/onboarding` saw connected wallet
  `0x93b37bc1...d119d6`; the provisioning-step Continue button was disabled
  while receipts were empty; starting provisioning showed one
  `Cancel wallet request` button with no app console errors; cancel returned the
  page to idle with message
  `Wallet request cancelled. Any later approval for the old prompt will be ignored.`
- Follow-up chain inspection of recent `NamespaceCreatedEvent` records showed
  successful namespace-create object changes using
  `0x64c14f...::namespace::MemoryNamespace` and
  `0x64c14f...::namespace::NamespaceCapability<0x64c14f...::namespace::Admin>`;
  querying the upgraded package event type returned no current-package
  `NamespaceCreatedEvent` records.
- The new regression first failed with
  `transaction did not create expected object type 0x64c14f...::namespace::MemoryNamespace`
  when object changes used the current package ID, then passed after the
  semantic fallback was added.
- `vercel inspect app.onemem.xyz` confirms production now points at
  `dpl_EfEcJ5xcTVUEeQwGkKFEpV6x9nMg`.
- Live route sweep after the final hardening deployment returned HTTP 200 for
  `/`, `/login`, `/onboarding`, `/dashboard`, `/share`, and
  `/api/enoki/status`.
- Chrome verification on production deployment `dpl_5ntGx66kHTKGdqXLeSnofvsutX98`
  showed onboarding rendering "Already provisioned on testnet" for connected
  wallet `0x93b37bc1...d119d6`, with namespace `0x1363c4b1...5e23f9`,
  Admin cap `0x417e505a...aa0280`, and ReadWrite cap
  `0xecc760ed...790567`.

## Quality Gates

- `pnpm --filter @onemem/sdk-ts build` passed.
- `pnpm --filter @onemem/sdk-ts typecheck` passed.
- `pnpm --filter @onemem/sdk-ts test` passed: 78 passed, 5 skipped.
- `pnpm --filter @onemem/sdk-ts build` passed after the final regression split.
- `pnpm --filter @onemem/cli typecheck` passed.
- `pnpm --filter @onemem/cli test` passed: 55 passed.
- `pnpm --filter @onemem/cli build` passed.
- `pnpm --filter @onemem/hosted-dashboard typecheck` passed.
- `pnpm --filter @onemem/hosted-dashboard build` passed.
- `pnpm --filter @onemem/hosted-dashboard test` passed: 40 passed.
- `pnpm --filter @onemem/hosted-dashboard test -- sponsored-provisioning.test.ts`
  passed after the final semantic fallback: 41 passed.
- `pnpm --filter @onemem/hosted-dashboard typecheck` passed after the final
  semantic fallback.
- `pnpm --filter @onemem/hosted-dashboard build` passed after the final
  semantic fallback.
- `uv run pytest packages/sdk-python/tests` passed: 13 passed, 1 skipped.
- `pnpm test:structure` passed: 432 passed.
- `pnpm test:structure` passed after the final semantic fallback: 433 passed.
- Vercel production build passed: 3 Turbo tasks successful for deployment
  `dpl_697kAYJWnJQteUYXURrcTYj3foSA`.
- Vercel production build passed after the final semantic fallback: 3 Turbo
  tasks successful for deployment `dpl_EfEcJ5xcTVUEeQwGkKFEpV6x9nMg`.
- `node --import tsx --test tests/structure/plugins-apps.test.ts` passed after
  the onboarding saved-state regression: 19 passed.
- `pnpm --filter @onemem/hosted-dashboard test` passed after the onboarding
  saved-state regression: 41 passed.
- `pnpm test:structure` passed after the production user-flow pass: 440 passed.
- Vercel production build passed after the onboarding saved-state fix: 3 Turbo
  tasks successful for deployment `dpl_5ntGx66kHTKGdqXLeSnofvsutX98`.

## Deviations From Plan

- Full onboarding is not yet claimed complete because Slush wallet signature
  prompts require manual approval outside browser automation. The app-side
  stale-request handling is verified; wallet-approved namespace plus RW-cap
  completion remains the next proof.
- Enoki Google sign-in remains unconfigured and separate from wallet-based
  onboarding.

## Gaps And Risks

- Start a fresh hosted onboarding attempt, approve the namespace-create Slush
  prompt, then approve the expected second ReadWrite-capability mint prompt
  before claiming hosted onboarding end-to-end.
- Clean up or ignore earlier duplicate testnet namespace attempts from stale
  prompts; they are harmless testnet artifacts but not the final onboarding
  proof.

## Evidence Log

- Production deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/5ntGx66kHTKGdqXLeSnofvsutX98`
- Previous parser semantic fallback deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/EfEcJ5xcTVUEeQwGkKFEpV6x9nMg`
- Previous parser/UX hardening deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/697kAYJWnJQteUYXURrcTYj3foSA`
- Previous parser-only deployment:
  `https://vercel.com/blockchain-oracles-projects/onemem-hosted-dashboard/6GTDf8iA2U9hQnAwzRtBLzGmenLU`
- Production app:
  `https://app.onemem.xyz`
- Enoki status remains:
  `ok: true`, `keyValid: true`, `signInReady: false`,
  `authProviders: 0`, `allowedOrigins: 0`.
