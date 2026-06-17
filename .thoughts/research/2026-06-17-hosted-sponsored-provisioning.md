# Reality Research: Hosted Sponsored Provisioning

## Scope

Research the current gap between hosted account readiness and real hosted
onboarding provisioning. The target question is: what can the hosted app
honestly sponsor today, using the current Move contract, SDK, Enoki package, and
dApp Kit package?

## Sources Checked

- Current repo status and prior slice:
  - `.thoughts/wiki/context-engineering-status.md`
  - `.thoughts/specs/2026-06-17-hosted-auth-readiness.md`
  - `.thoughts/plans/2026-06-17-hosted-auth-readiness.md`
  - `.thoughts/verification/2026-06-17-hosted-auth-readiness.md`
- Hosted app:
  - `apps/hosted-dashboard/app/onboarding/page.tsx`
  - `apps/hosted-dashboard/app/cli-login/page.tsx`
  - `apps/hosted-dashboard/app/api/enoki/status/route.ts`
  - `apps/hosted-dashboard/components/HostedProviders.tsx`
  - `apps/hosted-dashboard/scripts/browser-smoke.mjs`
  - `apps/hosted-dashboard/package.json`
- SDK and CLI:
  - `packages/sdk-ts/src/namespaces.ts`
  - `packages/sdk-ts/src/runtime.ts`
  - `packages/sdk-ts/src/index.ts`
  - `packages/sdk-ts/src/generated/addresses.ts`
  - `packages/cli-ts/src/commands/init.ts`
  - `packages/cli-ts/src/commands/namespace.ts`
- Move:
  - `contracts/onemem/sources/namespace.move`
  - `config/networks.json`
- Installed package declarations:
  - `apps/hosted-dashboard/node_modules/@mysten/enoki/dist/esm/EnokiClient/type.d.ts`
  - `apps/hosted-dashboard/node_modules/@mysten/enoki/dist/esm/EnokiClient/index.d.ts`
  - `apps/hosted-dashboard/node_modules/@mysten/dapp-kit/dist/esm/hooks/wallet/useSignTransaction.d.ts`
  - `apps/hosted-dashboard/node_modules/@mysten/sui/package.json`
  - `apps/hosted-dashboard/node_modules/@mysten/sui/dist/transactions/index.d.mts`
  - `apps/hosted-dashboard/node_modules/@mysten/sui/dist/utils/index.d.mts`
- Context7:
  - `/websites/enoki_mystenlabs`
  - `/websites/sdk_mystenlabs`
- Web:
  - Enoki sponsored transactions:
    `https://docs.enoki.mystenlabs.com/ts-sdk/sponsored-transactions`
  - Enoki SDK examples:
    `https://docs.enoki.mystenlabs.com/ts-sdk/examples`
  - Enoki typedoc:
    `https://sdk.mystenlabs.com/typedoc/modules/_mysten_enoki.html`
  - Sui transaction auth docs:
    `https://docs.sui.io/develop/transactions/transaction-auth/auth-overview`

## Verified Facts

- Hosted auth readiness is complete: hosted routes now have dApp Kit providers,
  optional Enoki wallet registration, and real connected-account state.
- Hosted onboarding still does not mint a namespace. The current page explicitly
  labels MemWalAccount/namespace provisioning as pending.
- Hosted `/cli-login` still delegates credential minting to
  `NEXT_PUBLIC_ONEMEM_MINT_URL`; without that URL, it throws a clear error
  rather than returning fake credentials.
- `apps/hosted-dashboard/app/api/enoki/status/route.ts` reads
  `ENOKI_PRIVATE_KEY` server-side and never exposes it to the client.
- Enoki docs state sponsored transactions require private API keys and should be
  executed through a backend service. The backend creates a sponsored
  transaction from transaction-kind bytes, the client signs returned bytes, and
  the backend executes with digest + signature.
- Installed `@mysten/enoki@0.6.20` exposes `EnokiClient`,
  `createSponsoredTransaction`, and `executeSponsoredTransaction`.
- Installed Enoki types require `transactionKindBytes` and either:
  - `jwt`, or
  - `sender` with optional `allowedAddresses` and `allowedMoveCallTargets`.
- Installed dApp Kit exposes `useSignTransaction`; its mutation accepts
  `transaction: Transaction | string`, so hosted UI can sign sponsored bytes
  returned from the backend.
- The OneMem package is deployed on testnet only in `config/networks.json` and
  `packages/sdk-ts/src/generated/addresses.ts`.
- `@onemem/sdk-ts` publicly exports `ACTIVE_NETWORK`, `ADDRESSES`,
  `addressesFor`, `NamespaceKind`, and related types from `src/index.ts`.
- `onemem::namespace::create` is public. It creates a shared
  `MemoryNamespace`, transfers an Admin capability to `ctx.sender()`, and emits
  `NamespaceCreatedEvent` plus `NamespaceCapabilityMintedEvent` for Admin.
- `onemem::namespace::mint_capability_readwrite` requires a `MemoryNamespace`
  and the sender-owned Admin capability, then transfers a ReadWrite capability
  to a recipient.
- The current SDK `ensureNamespace` flow provisions a usable trace target in two
  transactions: `namespaces.create()` followed by
  `namespaces.shareReadWrite()` back to the same address.
- A hosted sponsored onboarding flow therefore cannot honestly produce a usable
  trace target in a single transaction with the current contract. It needs at
  least two sponsored user-signed transactions: namespace create, then ReadWrite
  cap mint.
- Enoki sponsorship supports allowed move-call targets and allowed addresses;
  this is the server-side allowlist boundary for OneMem hosted provisioning.

## Inferences

- The next honest hosted slice is not a fake "MemWalAccount" object. In the
  current OneMem contract, the concrete hosted-provisionable target is a
  `MemoryNamespace` plus Admin and ReadWrite capabilities.
- A generic sponsor API with action-specific allowlists is safer than letting
  the client provide arbitrary transaction-kind bytes.
- The first route can prepare and execute only two hard-coded transaction
  actions:
  - create a namespace for the connected sender,
  - mint a ReadWrite cap for the same sender from the resulting Admin cap.
- The UI should preserve the pending language unless and until both sponsored
  transactions complete and object IDs are parsed from the executed digests.

## Unknowns And Questions

- The deployed Enoki private key may be named `ENOKI_PRIVATE_KEY` in this repo,
  while current docs use examples like `ENOKI_SECRET_KEY`. The route should keep
  the existing name and may support an alias without exposing either value.
- Automated CI cannot complete a wallet popup or Google OAuth flow. Full
  end-to-end sponsorship requires a live Enoki private key and a signer capable
  of signing sponsored bytes.
- The long-term hosted session/cookie model is still open.
- Delegate credential minting still needs a separate design after namespace/RW
  cap provisioning.

## Not Included

- No owner-driven revoke design; the current contract supports holder
  self-revoke only.
- No hosted share/revoke UI.
- No MemWal delegate key minting.
- No OAuth provider portal setup.
- No contract changes.
