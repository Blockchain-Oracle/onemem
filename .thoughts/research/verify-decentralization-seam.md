I now have full end-to-end confirmation of every load-bearing claim. The two write paths are clearly distinct: the native OneMem trace path (`{content}` → Seal.encrypt → Walrus.uploadBlob → trace::emit_call, requires session+namespace+RW cap), and the MemWal memory path (MemWal does its own Seal+Walrus; OneMem optionally adds an on-chain ActionCall pointing at MemWal's blob_id). Here is the adversarial verdict.

---

# ADVERSARIAL VERIFICATION VERDICT

Every load-bearing claim was re-checked against PRIMARY sources: the **installed** `@mysten/walrus@1.1.7` / `@mysten/seal@1.1.3` `.d.mts` type definitions (not docs — the actual compiled types OneMem links against), the official Mysten Context7 docs as a cross-check, live testnet RPC, and OneMem's real source. Proposing nothing.

## (a) `@mysten/walrus` and `@mysten/seal` API methods exist as described

**CONFIRMED — `@mysten/walrus` `writeBlob` / `readBlob` / `walrus()` extension / `RetryableWalrusClientError`.**
Verified against installed `.d.mts` at `node_modules/.pnpm/@mysten+walrus@1.1.7_.../@mysten/walrus/dist/client.d.mts`:
- `client.d.mts:727` — `writeBlob({ blob, deletable, epochs, signer, owner, attributes, onStep, resume, signal }): Promise<{ blobId; blobObject }>`. Param is `blob` (matches OneMem `walrus.ts:178`).
- `client.d.mts:135` — `readBlob: ({ blobId, signal }: ReadBlobOptions) => Promise<Uint8Array>`.
- `client.d.mts:12` — `declare function walrus<...>({ packageConfig, name, ...options })`; `types.d.mts:53` — `uploadRelay?: UploadRelayConfig`.
- `error.d.mts:3,23` — `RetryableWalrusClientError` is an exported class.

**CONFIRMED — the brief's `bl:` doc-typo claim is correct and now proven.** The official Walrus doc snippet literally shows `bl: file` (Context7 `/websites/sdk_mystenlabs_walrus`), but the installed `WriteBlobOptions` type names the field `blob`. So OneMem's `blob:` (`walrus.ts:178`) is the real API; `bl:` is a docs typo. The brief's inference was right.

**CONFIRMED — `@mysten/seal` `SealClient` / `encrypt` / `decrypt` / `SessionKey.create`.**
Verified against installed `node_modules/.pnpm/@mysten+seal@1.1.3_.../@mysten/seal/dist/`:
- `client.d.mts:6` `class SealClient`; `:22` `encrypt({ kemType?, demType?, threshold, packageId, id, data, aad? }): Promise<{ encryptedObject; key }>`; `:52` `decrypt({ data, sessionKey, txBytes, checkShareConsistency?, checkLEEncoding? }): Promise<Uint8Array>`.
- `types.d.mts:19-24` — `SealClientOptions { serverConfigs: KeyServerConfig[]; verifyKeyServers? }`; `KeyServerConfig { objectId; weight; apiKeyName?; aggregatorUrl? }`. Matches OneMem `seal.ts:113-118` (`serverConfigs.map(s => ({ ...s, weight: 1 }))`, `verifyKeyServers`).
- `session-key.d.mts:36` — `SessionKey.create({ address, packageId, ttlMin, suiClient })`; `:55-56` `getPersonalMessage()`, `setPersonalMessageSignature()`; `:51` `isExpired()`. All match `seal.ts:174-183`.
- Cross-confirmed by official Seal docs (Context7 `/mystenlabs/seal`): identical `encrypt`/`decrypt`/`SessionKey.create` shapes and the `seal_approve` PTB pattern (`tx.pure.vector("u8", fromHEX(id))`, `tx.build({ onlyTransactionKind: true })`) — matching `seal.ts:222-234`.

Note: the briefs cited `decrypt` accepting `checkShareConsistency` as "unverified" — **CONFIRMED present** in installed 1.1.3 (`client.d.mts:56`). OneMem does not pass it (relies on the default).

## (b) How sdk-ts ACTUALLY writes one encrypted memory end-to-end

There are **two separate write paths**; the briefs conflated them at one point. Verified in source:

**Path 1 — native OneMem trace payload (the genuinely "Seal→Walrus→on-chain" path).** `traces.ts:102-115` `resolvePayload`: for `{ content, encrypt: true }` → `requireSeal().encrypt(content, namespaceId)` (`seal.ts:194-201`, Seal IBE on `packageId=sealPackageId`, `id=namespaceId`) → `requireWalrus().uploadBlob(ciphertext)` (`walrus.ts:171` `writeBlob`) → on-chain `trace::emit_call` (`traces.ts:178`) storing the Walrus blobId; integrity hash is `sha256(plaintext)` (`traces.ts:107`). **CONFIRMED this path requires session + namespace + ReadWrite cap**: `emit_call` on-chain takes `&NamespaceCapability<ReadWrite>` (live RPC below), and `appendCall` passes `sessionId`, `namespaceId`, `rwCapId` (`traces.ts:172-186`). Encrypt also requires `namespaceId` (`TracePayloadError`, `traces.ts:158`).

**Path 2 — MemWal memory write (`memory.ts:170-205`).** **REFUTED that OneMem itself does Seal→Walrus here.** OneMem calls `memwal.rememberManual(text, namespace)` (`memory.ts:175`); MemWal's own package does the client-side Seal-encrypt + Walrus store and returns `blob_id`. OneMem then **optionally** emits a OneMem `ActionCall` (`toolName: "memwal_write"`, `input: { walrusBlob: remembered.blob_id, hash: sha256(text) }`) — but ONLY if `opts.sessionId && opts.onememNamespaceId && opts.rwCapId` are all supplied (`memory.ts:186`). Without those three, the memory is still written to MemWal/Walrus but there is **no on-chain attestation**. So the on-chain leg of the memory path is conditional on session+namespace+RW-cap; the MemWal/Walrus leg is not.

## (c) Deployed packageId vs originalPackageId

**CONFIRMED, and refined with one correction to the MemWal/Sui brief.** Live testnet RPC (`fullnode.testnet.sui.io`):
- `0xc2e8…f138` (= `package_id`): `type: package`, `version: 2`, `owner: Immutable`, `previousTransaction: 6aARmWJad…`.
- `0x64c1…eafc` (= `original_package_id`): `type: package`, `version: 1`, `owner: Immutable`.
- Registry `0x3c78…16e0`: type `0x64c14fc0…::registry::OneMemRegistry`, `Shared` — type prefix is the **original** id. **CONFIRMED** type-vs-policy split.
- **Hard empirical proof of the split**: `sui_getNormalizedMoveFunction` on the CURRENT package `0xc2e8` for `seal_policy::seal_approve` returns a function whose struct params (`MemoryNamespace`, `NamespaceCapability<KIND>`) all carry address `0x64c1…` (the original). Likewise `trace::emit_call` on `0xc2e8` takes `TraceSession`/`MemoryNamespace`/`NamespaceCapability<ReadWrite>` all at `0x64c1…`. This is exactly why `client.ts:140-153` sets `policyPackageId = packageId` (call target = `0xc2e8`) but `typePackageId = originalPackageId` (type args = `0x64c1`). **CONFIRMED.**

**CORRECTION to the MemWal/Sui brief:** it said the recorded deploy tx represents the deployment and inferred "upgraded at least once." Inspecting that tx (`sui_getTransactionBlock` on `6aARmWJad…`) shows its commands are `[MoveCall, Upgrade, MoveCall]` and it **PUBLISHED `0xc2e8` while mutating the UpgradeCap `0x2834…`**. So `networks.json`'s `tx_digest`/`deployed_at` (2026-06-18) record the **UPGRADE** transaction (v1→v2), NOT the original publish of `0x64c1`. "Upgraded at least once" is CONFIRMED; the nuance that the manifest's tx is the upgrade (the original-publish tx is earlier and not in the manifest) is a fact the brief got slightly wrong.

**REFUTED — `entry fun seal_approve` convention.** Both briefs flagged the doc said `entry fun` but contract says `public fun`. Live RPC settles it: `seal_approve` on-chain is `"visibility": "Public", "isEntry": false`. The deployed reality is `public fun` (non-entry), and Seal's testnet key servers accept it (the decrypt path is exercised in OneMem). The deep-dive doc's `entry fun` text is wrong relative to deployed code.

## Versions (re-confirmed against lockfile/RPC, with one brief gap corrected)
- `@mysten/walrus@1.1.7`, `@mysten/seal@1.1.3`, `@mysten/sui@2.17.0`, `@mysten/walrus-wasm@0.2.2` — all CONFIRMED resolved (`pnpm-lock.yaml:1546,1571,1598`).
- **Gap in the MemWal/Sui brief (it listed memwal version as "not checked"):** lockfile resolves **BOTH** `@mysten-incubation/memwal@0.0.5` AND `@0.0.7`, plus `@mysten-incubation/oc-memwal@0.0.4` which pulls `memwal@0.0.7` (`pnpm-lock.yaml:431,22,360`). So the declared peer range `^0.0.5` resolves to multiple coexisting memwal versions in the tree, not a single `0.0.5`.

## Net
Riskiest claims hold up. All named `@mysten/walrus` and `@mysten/seal` methods exist exactly as used (verified against the installed `.d.mts`, not just docs). The encrypted-write path and its session/namespace/cap requirements are as described, with the clarification that the MemWal memory path's encryption is done by MemWal (not OneMem) and the on-chain attestation leg is conditional. The packageId/originalPackageId split is empirically proven on-chain. Two brief inaccuracies corrected: (1) the manifest's deploy tx is the v1→v2 **upgrade**, not the original publish; (2) deployed `seal_approve` is `public`/non-entry, refuting the deep-dive's `entry fun` text. One brief gap filled: memwal resolves to `0.0.5` AND `0.0.7` simultaneously.

Key files: `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/src/walrus.ts`, `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/src/seal.ts`, `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/src/traces.ts`, `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/src/memory.ts`, `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/src/client.ts`, `/Users/abu/dev/hackathon/sui-overflow/onemem/config/networks.json`. Installed type defs verified at `node_modules/.pnpm/@mysten+walrus@1.1.7_.../dist/client.d.mts` and `node_modules/.pnpm/@mysten+seal@1.1.3_.../dist/{client,types,session-key}.d.mts`.