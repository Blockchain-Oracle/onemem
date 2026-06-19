I now have complete coverage of both the official Walrus mechanics and OneMem's integration. Compiling the reality brief.

## Scope

Two-part reality brief: (1) what Walrus (decentralized blob storage) is and how it actually works — storage/read paths (publisher/aggregator HTTP API, `walrus` CLI, `@mysten/walrus` TS SDK with real method names), blob IDs, epochs/cost/availability model, testnet vs mainnet endpoints, current SDK version; (2) exactly how OneMem integrates Walrus today, grounded in `/Users/abu/dev/hackathon/sui-overflow/onemem/packages` (especially `sdk-ts`) and `config/networks.json`. Reality only — no recommendations.

## Sources Checked

OneMem code (primary):
- `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/src/walrus.ts` (full read)
- `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/src/client.ts` (Walrus wiring, lines 40-44, 66-95, 125-208)
- `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/src/traces.ts` (payload resolution, lines 35-115)
- `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/src/memory.ts` (MemWal+Walrus memory path, lines 1-125)
- `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/src/index.ts` (exports)
- `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/package.json` (deps)
- `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/tests/walrus.unit.test.ts`, `tests/sdk.integration.test.ts`, `tests/memory.integration.test.ts`
- `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/lib/decrypt.ts`
- `/Users/abu/dev/hackathon/sui-overflow/onemem/config/networks.json`, `config/networks.schema.json`
- `/Users/abu/dev/hackathon/sui-overflow/onemem/scripts/get-wal.ts`
- `/Users/abu/dev/hackathon/sui-overflow/onemem/pnpm-lock.yaml` (resolved versions)
- grep across `packages/`, `config/`, `scripts/`

Official Walrus docs (primary, via Context7):
- `/websites/sdk_mystenlabs_walrus` (sdk.mystenlabs.com/walrus) — TS SDK
- `/mystenlabs/walrus` (github.com/MystenLabs/walrus docs, version `testnet-v1.43.1`) — HTTP API, CLI, system params

## Verified Facts

### A. What Walrus is

- Walrus is a decentralized blob (binary large object) store that uses **Sui for coordination and governance**. Blob *metadata/availability* is tracked on Sui; the blob *bytes* are erasure-coded and stored across storage nodes (source: `/mystenlabs/walrus` description; OneMem's own `walrus.ts:1-4` comment states the same model OneMem relies on).
- Encoding type seen in API responses is `RS2` (Reed-Solomon based); docs call the scheme RedStuff (source: HTTP API response examples, `/mystenlabs/walrus`).

### B. How a blob is stored and read — three interfaces

**1. Publisher/Aggregator HTTP API** (source: `/mystenlabs/walrus` HTTP API docs):
- Store: `PUT /v1/blobs` on a **publisher**. Query params: `epochs` (int, default 1), `deletable` (bool; defaults true if neither `deletable` nor `permanent` given), `permanent` (bool), `send_object_to` (Sui address). Body = raw bytes / `--upload-file`.
  - Testnet publisher example host: `https://publisher.walrus-testnet.walrus.space`.
  - Response: JSON with either `newlyCreated.blobObject` (fields: `id`, `blobId`, `size`, `encodingType`, `certifiedEpoch`, `registeredEpoch`, `storage.{startEpoch,endEpoch,storageSize}`, `deletable`, plus `resourceOperation` and `cost`) or `alreadyCertified` (`blobId`, `event.txDigest`, `endEpoch`).
- Read: `GET /v1/blobs/{blobId}` on an **aggregator**; also `GET /v1/blobs/by-object-id/{objectId}`. Query options include `strict_consistency_check=true` and `skip_consistency_check=true` (v1.36+).
  - Testnet aggregator example host: `https://aggregator.walrus-testnet.walrus.space`.

**2. `walrus` CLI** (source: `/mystenlabs/walrus` docs): `walrus info` prints system params (epochs, storage nodes, shards, prices). Documented store/read commands exist; OneMem does **not** shell out to the `walrus` CLI (no `walrus store`/`walrus read` invocations found in `scripts/` or `packages/`; `get-wal.ts:5-6` comment explicitly says "No walrus CLI required").

**3. `@mysten/walrus` TypeScript SDK** — real method names (source: `/websites/sdk_mystenlabs_walrus` + OneMem usage):
- Extend a Sui client: `suiClient.$extend(walrus({ uploadRelay: { host, sendTip: { max } } }))` → gives `client.walrus` of type `WalrusClient`.
- `client.walrus.writeBlob({ blob: Uint8Array, deletable: boolean, epochs: number, signer })` → returns `{ blobId }`. (Note: one Context7 snippet shows the param as `bl:` — this is a doc typo; the real field is `blob`, matching OneMem `walrus.ts:178`.)
- `client.walrus.readBlob({ blobId })` → returns `Uint8Array`.
- `client.walrus.writeFiles({ files: WalrusFile[], epochs, deletable, signer })` → returns `[{ id, blobId, blobObject }]` (WalrusFile API; OneMem does not use this).
- `RetryableWalrusClientError` is an exported error class (used by OneMem for transient-error detection, `walrus.ts:15,45`).

### C. Blob IDs

- A blob ID is a content-derived base64url-style string, e.g. `M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk` (source: HTTP API examples). Distinct from the Sui **blob object id** (`0x…`), which is the on-chain object wrapping the blob; aggregator supports lookup by either.

### D. Storage epochs / cost / availability model

(source: `/mystenlabs/walrus` `walrus info` output + available-networks/large-uploads docs)
- Epoch durations: **Mainnet = 14 days (2 weeks); Testnet = 1 day**. Maximum storage duration = **53 epochs** in the future on both networks. Expired blobs must be re-uploaded.
- Both networks: **1000 shards**. Sample testnet `walrus info`: 103 storage nodes, max blob size 13.6 GiB (14,599,533,452 B), storage unit 1.00 MiB.
- Cost: priced in **WAL** (1 WAL = 1,000,000,000 FROST). Sample: 0.0001 WAL per encoded storage unit per epoch + 20,000 FROST per write. Prices/capacity are dynamic (viewable on Walruscan / `walrus info`); writes are paid in **WAL, separate from SUI gas** (also stated in OneMem `walrus.ts:7` and `get-wal.ts:5`).
- Availability: replication via erasure coding; OneMem's comment (`walrus.ts:8-11,28-31`) documents an empirically observed property — a just-written blob is **not instantly readable** (sliver propagation can take >100s) and there is **no "wait until readable" API**.

### E. Testnet vs mainnet endpoints

- Upload relays (used by OneMem): testnet `https://upload-relay.testnet.walrus.space`, mainnet `https://upload-relay.mainnet.walrus.space` (source: OneMem `walrus.ts:20-23`; testnet relay host matches the official SDK doc example).
- Publisher/aggregator example hosts: `https://publisher.walrus-testnet.walrus.space`, `https://aggregator.walrus-testnet.walrus.space` (note the docs use `walrus-testnet` ordering for pub/agg vs OneMem's `testnet.walrus` ordering for the relay — both verbatim from their respective sources).
- Walrus testnet SUI↔WAL exchange used by OneMem (`get-wal.ts:27-30`): package `0x82593828ed3fcb8c6a235eac9abd0adbe9c5f9bbffa9b1e7a45cdd884481ef9f`, exchange object `0xf4d164ea2def5fe07dc573992a029e010dba09b1a8dcbc44c5c2e79567f39073`; calls `wal_exchange::exchange_all_for_wal`.

### F. Current SDK version

- Declared in `packages/sdk-ts/package.json`: `"@mysten/walrus": "^1.1.7"`. Resolved in `pnpm-lock.yaml`: **`@mysten/walrus@1.1.7`** (paired with `@mysten/sui@2.17.0`). Also present: `@mysten/walrus-wasm@0.2.2` (transitive WASM encoder). Walrus protocol docs pulled at version tag `testnet-v1.43.1`.

### G. Exactly how OneMem integrates Walrus today

**Where:** all Walrus code lives in `packages/sdk-ts/src/walrus.ts`. Other packages (dashboard, CLI, MCP, runtime) consume it only through the SDK `OneMem` client — no package calls `@mysten/walrus` directly except this module (grep confirmed; the dashboard hit is `lib/decrypt.ts` calling `onemem.requireWalrus().readBlob`).

**Client construction** (`client.ts:125-176`):
- `OneMem.create()` builds one `SuiJsonRpcClient`, then `extendWithWalrus(base, network, config.walrus)` extends that **same** client (comment `client.ts:131-133`: shared object/coin cache to avoid stale-gas-coin "object unavailable" errors).
- `extendWithWalrus` (`walrus.ts:131-144`) resolves the relay host from `config.uploadRelayHost` or `UPLOAD_RELAY_BY_NETWORK[network]`; returns `null` if no host known → `onemem.walrus` left undefined rather than crashing. When present it calls `base.$extend(walrus({ uploadRelay: { host, sendTip: { max: sendTipMax ?? 1000 } } }))`.
- A `WalrusStore` (`walrus.ts:147-219`) wraps the extended client + signer. `onemem.requireWalrus()` (`client.ts:202-208`) returns it or throws `WalrusNotConfiguredError`.

**Write path** (`WalrusStore.uploadBlob`, `walrus.ts:171-196`): calls `client.walrus.writeBlob({ blob, deletable, epochs, signer, signal: AbortSignal.timeout(60_000) })` → returns `blobId`. Defaults (`walrus.ts:25-37,159-163`): `epochs=3` (`DEFAULT_STORAGE_EPOCHS`), `deletable=false` (trace evidence is permanent), `sendTipMax=1000` MIST, `writeRetries=3`. Retries only transient errors (`RetryableWalrusClientError` or message containing `fetch failed`, `walrus.ts:44-47`) with exponential backoff (base 500ms); terminal errors (insufficient WAL, bad signer) fail fast via `WalrusWriteError`.

**Read path** (`WalrusStore.readBlob`, `walrus.ts:199-218`): calls `client.walrus.readBlob({ blobId, signal: AbortSignal.timeout(30_000) })` → `Uint8Array`. `readRetries=6` (`walrus.ts:31`) — deliberately more generous than writes because fresh blobs propagate slowly; backoff capped at 4000ms (`DEFAULT_MAX_BACKOFF_MS`). Read-retryable set adds abort/timeout signals (`AbortError`, `TimeoutError`, or `"request was aborted"`, `walrus.ts:55-64`). Failure → `WalrusReadError` carrying the blobId.

**How traces use it** (`traces.ts:35-115`): a `CallPayload` is either `{ content }` (raw bytes) or `{ walrusBlob, hash }` (already on Walrus). For `{ content }`: hash defaults to `sha256(content)` (plaintext); if a Seal namespace is given, bytes are Seal-encrypted first (`requireSeal().encrypt`), then `requireWalrus().uploadBlob(toStore)` returns the blob id that goes on-chain. The on-chain integrity hash covers the **plaintext** even when ciphertext is what's stored. For `{ walrusBlob, hash }`, both pass through unchanged. So: **trace metadata + Merkle hashes on Sui; tool input/output payloads as Walrus blobs referenced by blob id** (`walrus.ts:2-4`).

**How memory uses it** (`memory.ts:1-6,52-77`): OneMem does **not** write memory blobs to Walrus itself — `@mysten-incubation/memwal` (`/manual` flow) stores each memory as a **client-side Seal-encrypted Walrus blob** and OneMem emits an on-chain `ActionCall` (`tool_name="memwal_write"`) referencing that blob. The returned `walrusBlobId` is the Walrus blob holding the Seal-encrypted memory (`memory.ts:54-55,77`). `MemoryAttestationError` (`memory.ts:114-125`) covers the case where the blob was written to Walrus via MemWal but the on-chain ActionCall failed.

**Reads in the dashboard** (`dashboard/lib/decrypt.ts:42`): `const ciphertext = await onemem.requireWalrus().readBlob(args.walrusBlobId)` — dashboard decrypt goes through the SDK `readBlob` (i.e. the SDK/relay-extended client), **not** a direct aggregator HTTP GET. No aggregator/publisher HTTP hosts appear anywhere in OneMem source — only the two upload-relay hosts (grep: only `walrus.ts:21-22`).

**Funding** (`get-wal.ts`): a helper script swaps testnet SUI→WAL (default 0.5 SUI) via the Walrus testnet exchange so the active keystore address can pay for Walrus writes. WAL is required separately from SUI gas.

**networks.json:** `config/networks.json` and `config/networks.schema.json` contain **no Walrus fields** (no relay/aggregator/publisher/WAL entries — grep on the schema returned nothing). Walrus relay hosts are hardcoded in `walrus.ts`, not in the network manifest. `networks.json` holds only Sui RPC URLs, suiscan bases, and OneMem package/registry/cap ids; `active` network = `testnet`.

## Inferences

- The `bl:` field name in one official SDK snippet is a documentation typo for `blob:`; OneMem's working code uses `blob:` (`walrus.ts:178`), and the integration test round-trips successfully, so `blob` is the real parameter. (Inference from cross-checking the two sources.)
- OneMem's choice of `epochs=3` plus `deletable=false` means trace/memory blobs persist ~3 testnet epochs (~3 days on testnet, ~6 weeks if run on mainnet at 14-day epochs) before needing re-upload — an inference from combining `DEFAULT_STORAGE_EPOCHS=3` (`walrus.ts:26`) with the documented epoch durations; OneMem does not document re-upload/renewal logic and I found none.
- Because OneMem always writes through the **upload relay** (not direct-to-storage-node) and only configures relay hosts for testnet/mainnet, Walrus is effectively unavailable on `devnet`/`local` in OneMem today (`extendWithWalrus` returns null, `walrus.ts:136-137`). Inferred from `UPLOAD_RELAY_BY_NETWORK` having only testnet/mainnet keys.

## Unknowns And Questions

- Whether `@mysten/walrus@1.1.7` is the latest published version — I confirmed it's what OneMem resolves and that protocol docs are at `testnet-v1.43.1`, but did not query the npm registry for the newest `@mysten/walrus` release.
- Exact WAL cost per OneMem trace/memory write — OneMem sets `sendTipMax` (relay tip in MIST) and `epochs=3`, but the actual WAL storage fee depends on live dynamic pricing and encoded blob size; not computed here.
- Whether mainnet upload-relay (`upload-relay.mainnet.walrus.space`) actually works for OneMem — `networks.json` mainnet section is empty/undeployed (`package_id: ""`), so the Walrus mainnet path appears untested in this repo. Not verified live.
- The precise `WalrusFile` vs raw-blob distinction in the SDK is documented but unused by OneMem; I did not deep-dive `writeFiles`/quilt semantics since OneMem only uses `writeBlob`/`readBlob`.
- I read the head of `walrus.unit.test.ts` and grepped the integration tests for method names, but did not execute any tests (integration tests are env-gated behind `ONEMEM_INTEGRATION=1` per `sdk-ts/CLAUDE.md`), so live testnet round-trip behavior is asserted from code/comments, not a fresh run.