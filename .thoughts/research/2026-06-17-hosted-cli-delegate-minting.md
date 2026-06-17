# Hosted CLI Delegate Minting Research

Date: 2026-06-17

## Question

Persist hosted onboarding results into the CLI login path and replace the placeholder hosted delegate mint URL with real MemWal delegate credential minting.

## Current Reality

- `onemem login` already owns the local pairing loop:
  - starts a localhost callback server,
  - opens `/cli-login?nonce=<nonce>&port=<port>`,
  - checks the returned nonce,
  - writes `~/.onemem/credentials.json` with mode `0600`.
- Hosted `/cli-login` is still a placeholder:
  - requires `NEXT_PUBLIC_ONEMEM_MINT_URL`,
  - posts `{ delegateLabel, delegateTtlSeconds, nonce, callbackPort }`,
  - returns an honest config error when the mint endpoint is absent.
- Hosted onboarding now mints a real OneMem namespace and ReadWrite capability through Enoki-sponsored transactions, but the result only lives in component state.
- `packages/sdk-ts/src/credentials.ts` can read file-backed `delegateKey`, `accountId`, `memwalPackageId`, `relayerUrl`, and `namespace`.
- The SDK's memory path still requires `ONEMEM_EMBEDDING_API_KEY` or `embeddingApiKey` because OneMem uses the MemWal manual flow.

## Current Documentation / API Checks

- Context7 dApp Kit docs: current dApp Kit supports wallet transaction execution through `signAndExecuteTransaction`, with the wallet setting the sender and returning a digest/effects shape.
- Installed hosted app uses `@mysten/dapp-kit@0.16.16`, which exposes `useSignAndExecuteTransaction`, `useSignTransaction`, `useCurrentAccount`, and `useSuiClient`.
- MemWal docs/API reference list:
  - `generateDelegateKey()`,
  - `createAccount(opts)`,
  - `addDelegateKey(opts)`,
  - `removeDelegateKey(opts)`.
- MemWal delegate docs and installed types agree that delegate key registration is owner-only.
- Installed `@mysten-incubation/memwal@0.0.7` account helper supports wallet signer mode, but directly building the two Move transactions avoids dApp Kit/Sui SDK version adapter risk.

## Registry Discovery

The local testnet `MEMWAL_REGISTRY_ID` is a shared `AccountRegistry` with:

- `accounts: Table<address, object::ID>`

The table ID can be read from the registry object content, and owner lookup works with:

```ts
client.getDynamicFieldObject({
  parentId: accountsTableId,
  name: { type: "address", value: ownerAddress },
});
```

The returned dynamic field value is the MemWal account object ID.

## Decision

Implement hosted CLI pairing as a browser-wallet flow:

1. Read public MemWal config and existing account ID from a server route.
2. If no account exists, create a MemWal account with the connected wallet.
3. Generate a delegate key in the browser using MemWal's `generateDelegateKey()`.
4. Register the delegate public key with the connected wallet by calling `account::add_delegate_key`.
5. Sign the CLI nonce with the delegate key.
6. POST credentials to the CLI localhost callback.
7. Persist OneMem hosted onboarding namespace data in browser storage and include it as `activeNamespaceId` / `namespace` in the credentials payload.

## Constraints

- The hosted server must not mint delegate keys for arbitrary browser users because only the MemWal account owner can add delegate keys.
- The private delegate key must not be displayed or stored in hosted browser storage; it should only be POSTed once to the local CLI callback.
- The CLI must verify the delegate keypair, delegate signature, and Sui
  transaction proof before writing credentials.
- Hosted namespace state must match both wallet address and Sui network before it
  is included in local credentials.
- `embeddingApiKey` remains a separate local requirement unless a future hosted-safe embedding/proxy story is designed.

## Sources

- Local: `packages/cli-ts/src/commands/login.ts`
- Local: `apps/hosted-dashboard/app/cli-login/page.tsx`
- Local: `apps/hosted-dashboard/app/onboarding/SponsoredProvisioning.tsx`
- Local: `packages/sdk-ts/src/credentials.ts`
- Local: installed `@mysten-incubation/memwal@0.0.7/dist/account.*`
- Context7: Sui dApp Kit `signAndExecuteTransaction`
- Web: MemWal/Walrus Memory API reference and quick start
