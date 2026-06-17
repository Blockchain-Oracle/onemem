# Spec: Hosted Sponsored Provisioning

## Objective

Add an honest hosted onboarding path that can prepare and execute Enoki
sponsored transactions for a connected account to create a OneMem namespace and
mint a ReadWrite capability to itself.

## Background And Current Reality

Hosted auth readiness exists, but hosted provisioning is still pending. The
current Move contract creates a namespace and Admin capability in one
transaction, then requires the Admin cap in a later transaction to mint a
ReadWrite cap. Enoki sponsored transactions use a backend private API key to
sponsor transaction-kind bytes, the browser wallet signs returned transaction
bytes, and the backend executes with digest and signature.

## Users

- New hosted users who connect with a browser wallet or Enoki wallet.
- Future CLI-pairing users who need a real namespace/RW capability before
  delegate credential minting.
- Operators verifying hosted deployments without exposing private Enoki keys.

## Goals

- Add server routes that prepare only hard-coded, allowlisted OneMem onboarding
  transactions.
- Keep `ENOKI_PRIVATE_KEY` server-only.
- Let the browser sign sponsored transaction bytes through dApp Kit.
- Parse real namespace/Admin/RW capability object IDs from executed
  transaction digests.
- Update onboarding UI to run the real two-step provisioning flow when a wallet
  is connected.
- Preserve honest pending/error states when Enoki is not configured or a wallet
  signature/execution fails.

## Non-goals

- No hosted share/revoke mutations.
- No delegate-key or MemWal credential minting.
- No persistent hosted session/cookie.
- No contract changes.
- No fake object IDs or simulated successful provisioning.
- No exposure of private Enoki keys or user signatures beyond the execute call.

## Requirements

- R1: Add a server-side sponsored provisioning module that builds only:
  - `namespace::create`, and
  - `namespace::mint_capability_readwrite`.
- R2: Add API routes for preparing and executing sponsored onboarding
  transactions.
- R3: Preparation must validate sender, network, label, namespace ID, and Admin
  cap IDs before creating sponsored transactions.
- R4: Preparation must call Enoki with strict `allowedMoveCallTargets` and
  `allowedAddresses`.
- R5: Execution must call Enoki with digest + signature, wait for the
  transaction, and parse created OneMem object IDs from real transaction
  effects.
- R6: API responses must not include private keys, JWTs, or raw secret material.
- R7: Onboarding UI must use `useSignTransaction` on sponsored bytes returned
  by the server, then call the execute route.
- R8: Onboarding UI must run namespace create before RW cap mint and show the
  real resulting namespace/admin/RW cap IDs only after execution.
- R9: Missing Enoki/private-key configuration must produce clear guidance
  rather than fake success.
- R10: Tests/smoke/builds must cover the server helpers, API missing-config
  behavior, hosted UI, and Context Engineering artifacts.

## Acceptance Criteria

- AC1: With no Enoki private key, the prepare API returns a structured
  not-configured response and does not attempt fake sponsorship.
- AC2: With Enoki private key configured, the prepare code can construct
  sponsored transaction payloads for the two allowed onboarding actions.
- AC3: The UI presents a two-step real provisioning path and uses dApp Kit
  signing before execution.
- AC4: Successful execution can only display IDs parsed from on-chain
  transaction object changes.
- AC5: No client bundle or response exposes `ENOKI_PRIVATE_KEY` or
  `ENOKI_SECRET_KEY`.
- AC6: Hosted typecheck/build/lint/browser smoke and structure tests pass.

## Constraints

- OneMem is deployed only on testnet in the current manifest.
- Use the installed `@mysten/enoki@0.6.20`, `@mysten/dapp-kit@0.16.16`, and
  `@mysten/sui@2.17.0` APIs.
- The contract requires two transactions for a usable hosted trace target.
- Browser/CI tests may not be able to complete a real wallet popup.

## Stories Needed

- Story 1: Connected user starts namespace provisioning.
- Story 2: Connected user signs and executes namespace creation.
- Story 3: Connected user signs and executes ReadWrite capability minting.
- Story 4: Deployment operator sees clear missing-config behavior.

## Open Questions

- Should a later slice persist hosted provisioning results in a server session,
  browser storage, or a claimable CLI pairing payload?
- Should `ENOKI_SECRET_KEY` be standardized as the docs-aligned alias for
  `ENOKI_PRIVATE_KEY`?

## Source References

- `.thoughts/research/2026-06-17-hosted-sponsored-provisioning.md`
- `contracts/onemem/sources/namespace.move`
- `packages/sdk-ts/src/runtime.ts`
- `packages/sdk-ts/src/namespaces.ts`
- `apps/hosted-dashboard/app/onboarding/page.tsx`
- Enoki sponsored transactions:
  `https://docs.enoki.mystenlabs.com/ts-sdk/sponsored-transactions`
- Enoki SDK examples:
  `https://docs.enoki.mystenlabs.com/ts-sdk/examples`
- Sui transaction auth docs:
  `https://docs.sui.io/develop/transactions/transaction-auth/auth-overview`
