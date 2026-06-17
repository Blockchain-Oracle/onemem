# Spec: Hosted CLI Delegate Minting

Date: 2026-06-17

## Scope

Make hosted onboarding and `onemem login` connect into one usable credential flow.

## User-Facing Behavior

When a user runs `onemem login` and opens hosted `/cli-login`:

1. The page requires a connected Sui wallet.
2. The page looks up the wallet's MemWal account through the configured registry.
3. If no MemWal account is found, the user can create one from the same page.
4. The user chooses a delegate label and TTL.
5. The page generates a delegate key locally, asks the wallet to register the delegate public key on-chain, signs the CLI nonce with the delegate key, and sends the credential payload to `localhost:<port>/callback`.
6. The CLI validates the nonce, delegate keypair, and on-chain delegate
   registration transaction before writing `~/.onemem/credentials.json`.
7. If hosted onboarding previously created a OneMem namespace for the same wallet
   and network, the CLI credential payload includes that namespace as the active
   namespace.

## Credential Payload

The browser callback sends:

```json
{
  "nonce": "hex",
  "delegateKey": "hex",
  "delegatePublicKey": "hex",
  "delegateSuiAddress": "0x...",
  "delegateLabel": "onemem-cli",
  "delegateTtlSeconds": 86400,
  "accountId": "0xMemWalAccount",
  "suiAddress": "0xOwner",
  "activeNamespaceId": "0xOneMemNamespace",
  "namespace": "0xOneMemNamespace",
  "memwalPackageId": "0xMemWalPackage",
  "relayerUrl": "https://relayer.staging.memwal.ai",
  "network": "testnet",
  "agentId": "cli-default",
  "createdAt": "ISO-8601",
  "expiresAt": "ISO-8601",
  "sdkVersion": "0.1.0",
  "signature": "serialized Sui personal-message signature over nonce",
  "delegateRegistrationDigest": "Sui transaction digest"
}
```

`activeNamespaceId` and `namespace` are omitted when no hosted onboarding namespace exists for the connected wallet.

## Public Server Route

`GET /api/cli-login/memwal-account?owner=<sui-address>` returns:

- configured Sui network,
- MemWal package ID,
- registry ID,
- relayer URL,
- existing MemWal account ID when found,
- `accountId: null` when no dynamic field exists.

It never returns private keys.

## Persistence

Hosted onboarding saves successful namespace provisioning in browser `localStorage`.

Stored fields:

- `suiAddress`
- `network`
- `namespaceId`
- `adminCapId`
- `rwCapId`
- namespace and RW-cap transaction digests
- `updatedAt`

The CLI-login page reads only records matching the connected wallet address and
the network returned by the MemWal lookup route.

## Security

- Delegate private key is generated in the browser and sent only to localhost callback.
- Delegate private key is not saved to hosted localStorage.
- CLI verifies:
  - nonce matches,
  - required credential fields are present,
  - `delegateKey` derives `delegatePublicKey`,
  - `signature` is a valid Sui personal-message signature over the nonce,
  - signature address matches the delegate Sui address or derived delegate public key,
  - `delegateRegistrationDigest` exists on the submitted network, succeeded,
    was sent by `suiAddress`, called
    `memwalPackageId::account::add_delegate_key`, used `accountId`, and
    registered the submitted delegate public key/address.

## Out of Scope

- Issuing or proxying an embedding API key.
- Revoking old delegate keys.
- Full hosted account session cookies.
- Sponsored MemWal account/delegate transactions. The wallet pays gas for MemWal account/delegate operations in this slice.
