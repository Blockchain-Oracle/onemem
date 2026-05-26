---
purpose: Concise architectural reference for Walrus, focused on what OneMem needs.
sources:
  - https://docs.sui.io/sui-stack/walrus/sui-stack-walrus
  - https://docs.wal.app
  - https://sdk.mystenlabs.com/walrus
  - MystenLabs/walrus-pocs, MystenLabs/Walrus-Onboarding, MystenLabs/onlyfins-example-app
verified: 2026-05-23
---

# Walrus Deep Dive (for OneMem)

## What it is

Walrus is a decentralized blob storage protocol that uses Sui for coordination, payment, and governance. Erasure-coded across a global storage-node committee. ~5x storage overhead (vs ~100x for full replication). Sui handles the registration / payment / lifecycle; Walrus handles the bytes.

## Architecture

Two paths: write and read.

**Write path:** App → Walrus TS SDK or HTTP publisher → Upload Relay → Storage Nodes (encoded shards) → register `Blob` Sui object on chain.

**Read path:** App → Aggregator HTTP `GET /v1/{blob_id}` → bytes. Or App → Walrus TS SDK `readBlob({ blobId })` → bytes (heavier — ~335 storage-node requests per read).

## Identifiers

Every blob has 2:
- **Blob ID** — content-addressed hash, deterministic from contents, computed offchain.
- **Object ID** — the Sui object ID of the on-chain `Blob` registration record. Because blobs are Sui objects, they can be owned, transferred, wrapped, filtered via `getOwnedObjects` with `StructType: '<WALRUS_PKG>::blob::Blob'`.

## Blob lifecycle

- **Permanent vs deletable** — set at registration time (`deletable: true`). Permanent blobs cannot be deleted.
- **Storage duration** — purchased in **epochs**. Can be extended via `walrus.extendBlob(objectId, additionalEpochs)`. WAL token pays.
- **Attributes** — arbitrary key/value metadata stored as dynamic fields on the Blob object. Set at upload time or updated/deleted later via `executeWriteBlobAttributesTransaction`. Travels with the blob.
- **Sharing** — wrap a blob in a shared object (anyone can fund / extend lifetime). Supported via CLI or manual Move.
- **Deletion** — `walrus.executeDeleteBlobTransaction({ blobObjectId, signer })`. Only for deletable blobs.

## Cost model

- Erasure coding → ~5x raw blob size in storage.
- Pricing: `storagePricePerUnitPerEpoch` × size × epochs. Query via `walrus info --context testnet --json | jq '.storagePricePerUnitPerEpoch'`.
- WAL token (separate from SUI) pays storage. On testnet: `walrus get-wal --context testnet` exchanges 0.5 SUI → 0.5 WAL.
- Upload relay reduces ~2,200 storage-node requests to a single relay request — massive client cost saving in browsers.
- Reads ALWAYS go to ~335 storage nodes via SDK; use aggregators (single HTTP GET) for production read paths.

## Quilts (batch upload — recommended for many small blobs)

Group N small blobs into one Walrus blob using `WalrusFile` / `writeQuilt`. Each sub-file gets an identifier + optional tags. Single registration + single read = N files. Significantly cheaper than N separate uploads.

```ts
const { blobId, index } = await client.walrus.writeQuilt({
  blobs: [
    { contents: bytes1, identifier: 'audit-2026-05-23.json', tags: { 'content-type': 'application/json' } },
    { contents: bytes2, identifier: 'audit-2026-05-22.json' },
  ],
  deletable: true,
  epochs: 30,
  signer: keypair,
});
// Read back: walrus.getFiles({ ids: [`${blobId}/audit-2026-05-23.json`] })
```

For OneMem audit ledger: group all observations for one (account, agent, epoch) into one quilt. Cheaper, atomic, indexable.

## Publishers + Aggregators (HTTP, no SDK)

**Publisher** (HTTP POST upload):
```bash
PUBLISHER=https://publisher.walrus-testnet.h2o-nodes.com
curl -X PUT "$PUBLISHER/v1/blobs?epochs=3&deletable=true&send_object_to=<sui-address>" \
     --upload-file ./blob.bin
# Returns: { newlyCreated: { blobObject: { blobId, ... }}}
```

**Aggregator** (HTTP GET read):
```bash
AGGREGATOR=https://walrus-aggregator-testnet.staking4all.org
curl "$AGGREGATOR/v1/blobs/<BLOB_ID>" -o ./out.bin
```

`send_object_to` parameter is critical in production: shared publishers default to owning the resulting `Blob` Sui object. With `send_object_to`, ownership transfers to your address so you control lifecycle (delete, extend, attributes).

## TS SDK setup

```ts
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { walrus } from '@mysten/walrus';

const client = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: 'https://fullnode.testnet.sui.io:443',
}).$extend(walrus());
```

The `.$extend(walrus())` pattern stacks Walrus methods onto the Sui client. All sui-client APIs remain available alongside `client.walrus.{writeBlob, readBlob, writeFiles, getFiles, ...}`.

## Server-side upload (with Signer)

```ts
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const keypair = Ed25519Keypair.fromSecretKey(/* hex */);
const { blobId } = await client.walrus.writeBlob({
  blob: new TextEncoder().encode('payload'),
  deletable: true,
  epochs: 30,
  signer: keypair,
});
```

For browser uploads (wallets): use `writeFilesFlow` — five-step flow (`encode → register → upload → certify → listFiles`), each step a separate user interaction so wallet popups don't get blocked. Reference: `MystenLabs/ts-sdks/packages/walrus/examples/write-from-wallet`.

## Read

```ts
// Via SDK — ~335 storage-node requests
const bytes = await client.walrus.readBlob({ blobId });

// Via aggregator — single HTTP GET (production read path)
const res = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`);
const bytes = new Uint8Array(await res.arrayBuffer());
```

OnlyFins wraps the aggregator fetch in `fetchFromWalrus` with retry + 25-sec timeout.

## Walrus + Seal (encrypted blobs)

Walrus blobs are PUBLIC by default. To restrict access:
1. Encrypt locally with Seal before upload (`SealClient.encrypt({ threshold, packageId, id, data })`).
2. Upload the encrypted bytes to Walrus.
3. Store the Walrus `blobId` + Seal `encryption_id` on a Sui object.
4. Decrypt path: fetch encrypted bytes from aggregator → build a `seal_approve*` PTB → call `sealClient.fetchKeys({ txBytes, sessionKey })` → `sealClient.decrypt({ data, sessionKey, txBytes })`.

OneMem's pattern: encrypted audit trace blobs go on Walrus, decryption gated by `onemem::seal_approve` (owner OR delegated-agent-key). See `seal-deep-dive.md`.

## OneMem implications

- **Use quilts** for per-epoch audit batches. One write per epoch instead of one per memory.
- **Deletable blobs** so you can clean up test data and rotate keys cleanly.
- **30-epoch retention** is the default rule-of-thumb (~1 month on testnet). Re-extend via `extendBlob` for long-term audit retention.
- **Encrypt everything sensitive** via Seal pre-upload. Walrus is public — never store unencrypted PII / secrets.
- **Use aggregators for reads** in the dashboard. The SDK read path is too request-heavy for browser use.
- **Store the Sui `Blob` object ID** on OneMem's audit-entry events alongside the blob ID — gives you onchain lifecycle handles (delete, attribute updates, extend).
- **Public publisher in production**: pass `send_object_to=<onemem-vault-address>` so the `Blob` object lands in an OneMem-controlled wallet, not the shared publisher's.
