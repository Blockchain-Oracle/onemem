Confirmed. `@mysten/seal` is imported in exactly one place in OneMem source: `packages/sdk-ts/src/seal.ts`. The dashboard never touches Seal directly — it goes through `/api/decrypt` → `lib/decrypt.ts` → `@onemem/sdk-ts`. I have everything needed.

## Scope

Two things: (1) how Seal (Mysten's decentralized threshold-encryption / secrets-management product) works — IBE model, key servers, SessionKey, on-chain `seal_approve` policy, the `@mysten/seal` TS SDK surface, and the Walrus pairing; (2) how OneMem uses Seal today, by reading `packages/sdk-ts`, `packages/dashboard`, and `contracts/onemem`. Reality only — current state, no recommendations.

## Sources Checked

Official / library (primary):
- `npm view @mysten/seal version` → `1.2.1` latest; dist-tags `{ latest: 1.2.1, experimental: 0.0.0-experimental-... }`; version list includes 1.1.0–1.1.3, 1.2.0–1.2.1.
- Context7 `/mystenlabs/seal` (High reputation, 417 snippets) — `GettingStarted.mdx`, `UsingSeal.mdx` excerpts: `client.encrypt`, `SessionKey.create`, `client.decrypt`, `getDerivedKeys`/`getPublicKeys`, `new SealClient({ serverConfigs, verifyKeyServers })`.
- GitHub `MystenLabs/seal` README via WebFetch (repo top-level + `docs/` dir listing via `gh api`). Confirms: "decentralized secrets management (DSM)", "identity-based encryption", "lightweight key servers" + "threshold-based decryption keys", "access controlled by onchain policies on Sui", SDK package `@mysten/seal`.
- `https://seal-docs.wal.app/` returned HTTP 403 to WebFetch (could not read directly); content corroborated via Context7 + repo README + the in-repo OneMem deep-dive.

OneMem code (primary):
- `packages/sdk-ts/src/seal.ts` (full read), `packages/sdk-ts/src/client.ts:120-176`, `packages/sdk-ts/src/traces.ts:1-130`, `packages/sdk-ts/src/namespaces.ts` (full), `packages/sdk-ts/tests/seal.unit.test.ts` (full), `packages/sdk-ts/package.json:40-49`.
- `packages/dashboard/lib/decrypt.ts` (full), `packages/dashboard/app/api/decrypt/route.ts` (full), `packages/dashboard/app/trace/[session_id]/TraceView.tsx` (grep), `packages/dashboard/app/settings/SettingsView.tsx` (grep), `packages/dashboard/package.json:29-32`.
- `contracts/onemem/sources/seal_policy.move` (full), `contracts/onemem/CLAUDE.md`.
- `docs/01-sui-ecosystem/seal-deep-dive.md` (full; OneMem's own verified-2026-05-23 reference).
- `pnpm-lock.yaml` + both `node_modules/@mysten/seal/package.json` → installed version.

## Verified Facts

### What Seal is / its model
- Seal = decentralized secrets management on Sui: identity-based encryption (IBE) + threshold key servers + Move-enforced on-chain access policies. Key servers never see plaintext; all encrypt/decrypt is client-side (README; `docs/01-sui-ecosystem/seal-deep-dive.md:14-18`).
- Three components (OneMem deep-dive `seal-deep-dive.md:14-18`): (1) on-chain `seal_approve*` policy functions in Move that key servers `dry_run_transaction_block`; abort = deny, return = grant; (2) off-chain key servers holding IBE master keys, returning key shares, combined t-of-n; (3) client-side encryption.
- `seal_approve` convention (`seal-deep-dive.md:21-40`): first param is `id: vector<u8>`; Seal prepends the `packageId` to form the full identity; the same `id` used at encrypt time must be replayed in the decrypt-time PTB. Reference policies: owner-only, time-lock, allowlist (a shared `Allowlist` object holding addresses; admin adds/removes without re-encryption) (`seal-deep-dive.md:42-46`).
- SessionKey: a short-lived credential authorizing key-share fetches without a per-request wallet popup; wallet signs one personal message per package; scoped to a `packageId` with a TTL (`seal-deep-dive.md:99-117`).

### `@mysten/seal` TS SDK surface (named APIs, from Context7 / official docs)
- `new SealClient({ suiClient, serverConfigs: [{ objectId, aggregatorUrl?, weight }], verifyKeyServers })`.
- `client.encrypt({ threshold, packageId, id, data })` → returns `{ encryptedObject, key }` (`key` = backup symmetric key).
- `SessionKey.create({ address, packageId, ttlMin, suiClient })`; then `sessionKey.getPersonalMessage()` → `keypair.signPersonalMessage(message)` → `sessionKey.setPersonalMessageSignature(signature)`.
- `client.decrypt({ data, sessionKey, txBytes })` → plaintext bytes. `txBytes` come from a Transaction with a `seal_approve` moveCall, built with `onlyTransactionKind: true`.
- Lower-level/advanced APIs exist: `EncryptedObject.parse`, `client.getDerivedKeys`, `client.getPublicKeys`, plus on-chain `bf_hmac_encryption::{new_public_key, verify_derived_keys, parse_encrypted_object, decrypt}` Move targets (Context7 `UsingSeal.mdx`). The OneMem deep-dive also references `sealClient.fetchKeys({ ids, txBytes, sessionKey, threshold })` (`seal-deep-dive.md:136`).
- Walrus pairing (`seal-deep-dive.md:93,160,175`): encrypt with Seal → store `encryptedObject` on Walrus → fetch blob → decrypt locally. For large payloads, docs describe envelope encryption (AES DEK, Seal-encrypt only the DEK) (`seal-deep-dive.md:97,176`).
- Verified testnet decentralized key server objectId used in official docs and OneMem: `0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98`, aggregator `https://seal-aggregator-testnet.mystenlabs.com` (Context7 `UsingSeal.mdx`; `seal.ts:34-35`).

### Versions
- Installed across OneMem: `@mysten/seal@1.1.3` (both `packages/sdk-ts/node_modules` and `packages/dashboard/node_modules`; `pnpm-lock.yaml:1546`). Declared ranges: `sdk-ts/package.json:40` and `dashboard/package.json:31` both `"@mysten/seal": "^1.1.0"`.
- Latest published on npm: `1.2.1` (so OneMem is one minor behind: 1.1.3 vs 1.2.1).
- Paired Mysten libs: `@mysten/sui@2.17.0`, `@mysten/walrus@1.1.7`, `@mysten-incubation/memwal@0.0.5` declared (sdk-ts) with 0.0.7 also resolved in the lockfile.

### How OneMem uses Seal today
**Single integration point.** `@mysten/seal` is imported in exactly one source file across all packages: `packages/sdk-ts/src/seal.ts` (`import { SealClient, SessionKey } from "@mysten/seal"` at line 19). The dashboard has `@mysten/seal` in `package.json` but **no direct import** in `app/`, `lib/`, or `components/` — it always goes through `@onemem/sdk-ts`.

**`SealStore` (`packages/sdk-ts/src/seal.ts`)** — the wrapper class:
- `createSealClient(suiClient, network, config)` (`seal.ts:107-119`) builds a `SealClient` from `SEAL_KEY_SERVERS_BY_NETWORK[network]`; returns `null` when no servers configured (only `testnet` is populated, `seal.ts:29-38`). `verifyKeyServers` defaults `false` (`seal.ts:117`).
- `DEFAULT_SEAL_THRESHOLD = 1`, `DEFAULT_SESSION_TTL_MIN = 10` (`seal.ts:40-41`).
- `encrypt(plaintext, namespaceId)` (`seal.ts:187-202`): calls `seal.encrypt({ threshold, packageId: sealPackageId, id: identityFor(namespaceId), data })`. No signature, no gas. `identityFor` = `strip0x(namespaceId)` (`seal.ts:153-155`) — i.e. the Seal IBE identity is the namespace object id; **all blobs in a namespace share one Seal identity**. Throws `SealEncryptError` on failure or empty ciphertext.
- `decrypt(ciphertext, { namespaceId, capId, capKind })` (`seal.ts:208-244`): builds a `Transaction` with `moveCall` target `` `${policyPackageId}::seal_policy::seal_approve` `` , typeArg `` `${typePackageId}::namespace::${capKind}` `` , args `[ pure.vector("u8", fromHex(id)), object(namespaceId), object(capId) ]`; `tx.build({ onlyTransactionKind: true })`; then `seal.decrypt({ data, sessionKey, txBytes })`. Wraps failures in `SealDecryptError`.
- SessionKey caching (`seal.ts:128-184`): caches the in-flight signed-`SessionKey` **promise** (collapses concurrent decrypts onto one mint+sign), reuses until `isExpired()`, re-mints on expiry, and clears the cache on any decrypt failure so a poisoned key re-mints next call. `mintSessionKey` (`seal.ts:174-184`): `SessionKey.create({ address: signer.toSuiAddress(), packageId: sealPackageId, ttlMin, suiClient })` → `signer.signPersonalMessage(getPersonalMessage())` → `setPersonalMessageSignature`.
- **Package-upgrade handling (3 distinct package ids).** `SealPackageIds` (`seal.ts:60-67`): `sealPackageId` = original/v1 package (used for the IBE identity and SessionKey, because Seal requires the version-1 package object even after upgrades — `seal.ts:10-12`); `policyPackageId` = current package (used for the `seal_approve` call target); `typePackageId` = package defining the `NamespaceCapability<KIND>` type. Wired in `client.ts:140-153`: `sealPackageId = typePackageId = addresses.originalPackageId || addresses.packageId`, `policyPackageId = addresses.packageId`. Unit test `seal.unit.test.ts:109-130` asserts this split.

**Wiring (`client.ts:125-176`)**: `OneMem.create` builds `sealClient`, wraps it in `SealStore`, exposes `onemem.seal` (and `requireSeal()` which throws `SealNotConfiguredError` if absent — `client.ts:210-215`). Seal is only present when key servers exist for the network (testnet by default).

**Encrypt path in traces (`traces.ts:102-115`)**: `CallPayload` `{ content, encrypt? }`. When `encrypt` is set, `resolvePayload` calls `this.client.requireSeal().encrypt(payload.content, encryptForNamespace)` then `requireWalrus().uploadBlob(ciphertext)`. The on-chain integrity hash is `sha256` over the **plaintext** (`traces.ts:107`), so a cap holder can decrypt and re-hash to verify (`seal.ts:16-17`).

**On-chain policy (`contracts/onemem/sources/seal_policy.move`)**: module `onemem::seal_policy`. `public fun seal_approve<KIND>(id: vector<u8>, ns: &MemoryNamespace, cap: &NamespaceCapability<KIND>, _ctx: &TxContext)`. v0.1 behavior: `id` is opaque/trusted from the SDK (lines 12-14, 46-47); asserts `namespace::is_active(ns)` (abort `ENamespaceInactive`); asserts `cap_for_namespace(cap) == object::id(ns)` (abort `EUnauthorized`); plus `assert_cap_for_namespace`. **Any cap kind** (ReadOnly | ReadWrite | Admin) authorizes decryption — write privilege is enforced separately in `trace.move` (lines 9-12). Note: the contract declares `seal_approve` as `public fun`, whereas OneMem's own deep-dive doc states the convention is `entry fun` (`seal-deep-dive.md:24,37`).

**Dashboard decrypt flow (the demo path)**: `app/trace/[session_id]/TraceView.tsx` → `decryptBlob()` → `POST /api/decrypt` (`TraceView.tsx:193-205`). Route `app/api/decrypt/route.ts` (`runtime = "nodejs"`, `force-dynamic`) → `decryptCallContent({ walrusBlobId, namespaceId })` in `lib/decrypt.ts`. That function: `OneMem.create({ network, signer: resolveSigner() })`, finds the local signer's active cap for the namespace via `onemem.namespaces.getCapabilities`, maps tag→`CapKind` (`{0:"ReadOnly",1:"ReadWrite",2:"Admin"}`, default `"ReadWrite"`), reads the blob via `requireWalrus().readBlob`, then `requireSeal().decrypt(...)`, and returns `TextDecoder().decode(plaintext)` (`lib/decrypt.ts:30-46`).
- **Security model as coded (`lib/decrypt.ts:1-12`)**: decryption runs in the **local** dashboard Node server (the user's own machine, key in `~/.onemem`); plaintext never crosses the network. The code comment states the hosted multi-tenant build is intended to do this client-side with a wallet `SessionKey` — labeled "tracked separately," and it is **not implemented today** (no client-side `@mysten/seal` usage exists in the dashboard).
- `lib/decrypt.ts:9-12` states this only decrypts OneMem-sealed **trace-call** blobs (`onemem::seal_policy`); **memory blobs are MemWal-sealed under MemWal's own policy** and are only retrievable via MemWal's query-based recall (MemWal 0.0.5 has no get-by-id), so there is no per-row memory decrypt.

**Tests (`tests/seal.unit.test.ts`)**: mock `@mysten/seal` + `Transaction`. Cover SessionKey reuse within TTL (1 mint/1 sign), re-mint on expiry, `SealDecryptError` carrying cap context, the original-vs-current package-id split for identity/approval, cache-drop-on-failure, threshold propagation into `encrypt`, encrypt-against-original-package, `SealEncryptError` wrapping, and empty-ciphertext rejection. Live round-trips are env-gated (`tests/integration/`, `ONEMEM_INTEGRATION=1`).

## Inferences

- The dashboard's `@mysten/seal` dependency (`dashboard/package.json:31`) appears currently **unused at the source level** (transitive via `@onemem/sdk-ts`, or staged for the not-yet-built hosted client-side SessionKey path). Inference from grep finding zero direct imports; not confirmed by a build-tree analysis.
- The CLAUDE.md non-negotiable "Decrypt CLIENT-side via Seal `/manual`. Server never sees plaintext" describes the local-mode reality only loosely: decryption is server-side in the Next.js Node runtime, which is the user's own machine in local mode. The genuine browser-client-side SessionKey decrypt described in `seal-deep-dive.md:99-119` / `SettingsView.tsx:228` ("Decrypt: client-side (Seal SessionKey)") is aspirational text, not running code. Inference from reading the route + lib + absence of client imports.
- OneMem calls `seal.decrypt(...)` directly (which internally fetches key shares); it does **not** use the explicit `fetchKeys` / `getDerivedKeys` lower-level flow shown in some docs. Inference from `seal.ts:232` vs `seal-deep-dive.md:136`.

## Unknowns And Questions

- Exact `@mysten/seal@1.1.3` API signatures (e.g. whether `decrypt` accepts `checkShareConsistency`, exact `serverConfigs` field names) were taken from Context7 docs reflecting current/`main`, not pinned to 1.1.3; not verified against the installed `.d.ts` (the `dist/index.d.ts` grep returned no matches, suggesting types are re-exported from subpaths I did not open).
- `seal-docs.wal.app` could not be fetched directly (HTTP 403). All Seal-doc facts are corroborated via Context7 + GitHub README + OneMem's in-repo deep-dive, not the canonical site live.
- Whether the discrepancy between the contract's `public fun seal_approve` and the documented `entry fun` convention causes any key-server behavior difference is not verified here (the contract comments claim it was "proved working against testnet key servers," `seal.ts:6-7`).
- Whether any production/mainnet key-server set or `threshold ≥ 2` is configured anywhere is unknown — only `testnet` with threshold 1 is present in code (`seal.ts:29-40`).
- Exact MemWal-side Seal policy for memory blobs (the `@mysten-incubation/memwal` package) was not opened; `lib/decrypt.ts` only asserts it is "MemWal's own policy."

Key files: `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/src/seal.ts`, `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/src/client.ts`, `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/src/traces.ts`, `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/sdk-ts/tests/seal.unit.test.ts`, `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/lib/decrypt.ts`, `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/app/api/decrypt/route.ts`, `/Users/abu/dev/hackathon/sui-overflow/onemem/contracts/onemem/sources/seal_policy.move`, `/Users/abu/dev/hackathon/sui-overflow/onemem/docs/01-sui-ecosystem/seal-deep-dive.md`.