---
purpose: Concise reference for Seal threshold encryption — how policies work, SessionKey flow, server vs manual encryption, the OnlyFins pattern.
sources:
  - https://docs.sui.io/sui-stack/seal/sui-stack-seal
  - https://seal-docs.wal.app
  - MystenLabs/onlyfins-example-app, MystenLabs/sui-move-bootcamp K5/seal-demo, MystenLabs/walrus-pocs
verified: 2026-05-23
---

# Seal Deep Dive (for OneMem)

## What it is

Seal is decentralized secrets management built on Sui. Identity-Based Encryption (IBE) with threshold key servers and Move-enforced access policies. Three components:

1. **Onchain access policies** — `entry fun seal_approve*` you write in Move. Seal key servers `dry_run_transaction_block` these to decide grant/deny.
2. **Key servers** — offchain services holding IBE master keys. Each returns a key share IF the policy passes; t-of-n threshold combines shares into the full decryption key.
3. **Client-side encryption** — all encrypt/decrypt happens in the user's environment. Key servers NEVER see plaintext.

## The `seal_approve` convention

```move
// Must be entry fun (NOT public). First param is id: vector<u8>.
// Seal prepends packageId to form full identity.
// Abort = deny. Success = grant.
entry fun seal_approve_access(
    id: vector<u8>,
    post: &Post,
    token: &ViewerToken,
) {
    assert!(token.post_id == object::id(post), ENotAuthorized);
    assert!(token.encryption_id == post.encryption_id, EWrongEncryption);
}
```

Rules:
- `entry`, not `public`.
- First param `id: vector<u8>` — the Seal inner identity. Same id used at encryption time MUST be replayed in the PTB at decryption time.
- Abort with a meaningful error code on denial.
- Never called from another PTB command during Seal evaluation — Seal key servers invoke it standalone.

## Three reference policies (from sui-move-bootcamp K5/seal-demo)

1. **Owner-only** (`private_seal.move`): single assertion comparing BCS-encoded caller address to `id` bytes.
2. **Time-lock** (`timelock_seal.move`): `id` encodes a `u64` unlock timestamp; check vs `Clock` at `0x6`.
3. **Allowlist** (`allowlist_seal.move`): shared `Allowlist` object with a list of addresses; admin adds/removes without re-encryption.

## OnlyFins / OneMem purchase-gated pattern

```move
entry fun seal_approve_access(
    id: vector<u8>,
    post: &Post,
    token: &ViewerToken,
) {
    assert!(token.post_id == object::id(post), ENotAuthorized);
    assert!(token.encryption_id == post.encryption_id, EWrongEncryption);
}
```

User must own a `ViewerToken` whose `post_id` matches the post. OneMem can adapt this to "must own an `AgentDelegate` token whose `account_id` matches" or "must be in the `AuditAccount.agents` list" (MemWal's pattern).

## TS SDK setup

```ts
import { SealClient, SessionKey } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromHEX } from '@mysten/sui/utils';

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
const sealClient = new SealClient({
  suiClient,
  serverConfigs: [
    { objectId: '0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98',
      aggregatorUrl: 'https://seal-aggregator-testnet.mystenlabs.com', weight: 1 },
    { objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3db75', weight: 1 },
  ],
  verifyKeyServers: false,   // false in dev, true in production
});
```

Key server object IDs point to onchain `KeyServer` objects (always the source of truth for the live URL). See https://seal-docs.wal.app/Pricing for the verified list (open + permissioned servers).

## Encrypt

```ts
const { encryptedObject, key } = await sealClient.encrypt({
  threshold: 2,                       // t-of-n; 1 = single-server, 2+ = distributed trust
  packageId: fromHEX('ONEMEM_PKG'),
  id: fromHEX(seal_key_id_hex),       // = onemem::seal_key_id(owner)
  data: encoder.encode(plaintext),
});
// Store encryptedObject (ciphertext) wherever — Walrus, on chain, locally.
// `key` is a backup symmetric key for disaster recovery via seal-cli symmetric-decrypt.
```

For payloads > a few hundred KB, use **envelope encryption**: generate a symmetric AES key, encrypt data with AES, encrypt only the AES key with Seal. Faster + cheaper. Sui Stack Messaging uses this pattern (AES-256-GCM DEK, Seal-encrypted onchain).

## SessionKey flow (browser decryption)

A `SessionKey` is a short-lived credential authorizing Seal key-share fetches without triggering a wallet popup per request. Wallet signs a personal message once per package; the session has a TTL (e.g. 10 min) and is scoped to a specific `packageId`.

```ts
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const keypair = Ed25519Keypair.fromSecretKey(/* hex */);  // or wallet adapter

const sessionKey = await SessionKey.create({
  address: keypair.toSuiAddress(),
  packageId: fromHEX('ONEMEM_PKG'),
  ttlMin: 10,
  suiClient,
});

const { signature } = await keypair.signPersonalMessage(sessionKey.getPersonalMessage());
sessionKey.setPersonalMessageSignature(signature);
```

For browser wallets: replace `keypair.signPersonalMessage` with `useSignPersonalMessage` from `@mysten/dapp-kit-react`.

## Decrypt

```ts
// 1. Build the seal_approve PTB (NEVER executed; Seal dry-runs it).
const tx = new Transaction();
tx.moveCall({
  target: `${ONEMEM_PKG}::account::seal_approve`,
  arguments: [
    tx.pure(seal_key_id_bytes),    // id: vector<u8>
    tx.object(ACCOUNT_ID),          // &AuditAccount
  ],
});
const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

// 2. Fetch key shares
await sealClient.fetchKeys({
  ids: [seal_key_id_hex],
  txBytes,
  sessionKey,
  threshold: 2,
});

// 3. Decrypt locally
const plaintext = await sealClient.decrypt({
  data: encryptedObject,
  sessionKey,
  txBytes,
});
```

For production handling sensitive data: set `checkShareConsistency: true` on decrypt to verify key shares from different servers are consistent before combining. OnlyFins sets it `false` (demo).

## Server-handled vs manual (client-side) encryption

This is the split Mysten exposes (e.g. in MemWal):

- **Server-handled** — the relayer / backend does encryption + Seal interaction. Simpler integration, but the server sees plaintext en route. Trust = the server operator. MemWal default flow.
- **Manual / client-side** — encryption happens in the user's environment using `@mysten/seal` + `@mysten/walrus` + `@mysten/sui` directly. Server NEVER sees plaintext. More setup, true E2EE. MemWal's `*Manual` SDK methods route this way.

For OneMem: the **audit trace blobs** should be client-side encrypted (the dashboard / agent itself encrypts before upload). The on-chain audit event entry stores `blob_id + encryption_id + digest` — Seal-gated decryption guarantees only owner-or-agent can read the trace bytes. Server-handled is fine for non-sensitive metadata.

## Failure modes (from the canonical Seal doc table)

| Error | Cause | Fix |
|---|---|---|
| Session key expired | TTL elapsed | Re-create + re-sign session key |
| Key server unreachable | Network / server down | Retry with backoff, check server status |
| Decryption fails after grant | `id` mismatch between encrypt + approve PTB | Verify `id` bytes round-trip |
| `seal_approve` aborts | Policy check failed | Confirm user owns required object; check Move logic |
| Threshold not met | < t servers responded | Increase timeout, check configs |

## OneMem implications

- OneMem's `seal_approve` mirrors MemWal's — owner OR delegate-agent address. Compatible by design (an OneMem-registered agent key is reusable as a MemWal delegate key if same Ed25519 pubkey).
- Encrypt audit trace blobs **before** Walrus upload; gate decryption with `onemem::seal_approve`.
- Use **envelope encryption** (AES DEK + Seal-encrypt-the-DEK) for traces > 100 KB — common for long agent transcripts.
- Use **threshold ≥ 2** in production (mainnet) to distribute trust. Testnet OK with threshold 1.
- The OneMem dashboard should use a SessionKey with `ttlMin: 30` so users can browse multiple decrypted entries after one wallet signature.
- For relayer-style scenarios (Day 23-29 Nautilus TEE relayer): the TEE holds the SessionKey signed by OneMem's relayer key, and Seal grants only if the policy approves — Nautilus + Seal is a documented combo (see `nautilus-tee.md`).
