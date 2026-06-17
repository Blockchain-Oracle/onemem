# Shared API Surface — OneMem SDKs

> Current note, 2026-06-17: this is a historical API design, not the live SDK
> contract. Current TypeScript truth lives in `packages/sdk-ts/src/`; current
> Python truth lives in `packages/sdk-python/onemem/`. Do not assume TS/Python
> full parity without checking those packages.

Original intent: `@onemem/sdk-ts` and `onemem-sdk-python` expose matching
memory, trace, and namespace concepts with language-idiomatic names.

---

## Top-level client

```ts
// TypeScript
const client = OneMem.create({
  key: env.ONEMEM_PRIVATE_KEY,         // Ed25519 hex; delegate key
  accountId: env.ONEMEM_ACCOUNT_ID,    // MemWalAccount Sui object ID
  serverUrl: 'https://relayer.memwal.ai',
  namespaceId: '0x...',                // default MemoryNamespace ID
  agentId: 'claude-code-1.2.3',        // identity for trace emission
  environment: 'production',           // env tag for traces
  network: 'mainnet',                  // sui network
});
```

```python
# Python — identical shape
client = OneMem.create(
    key=env.ONEMEM_PRIVATE_KEY,
    account_id=env.ONEMEM_ACCOUNT_ID,
    server_url='https://relayer.memwal.ai',
    namespace_id='0x...',
    agent_id='hermes-0.14',
    environment='production',
    network='mainnet',
)
```

**Naming convention:** camelCase in TS, snake_case in Python (idiomatic for each). Semantics identical.

---

## Memory API (Mem0-mirror)

These methods mirror Mem0's API exactly so migration is trivial.

| Method | Returns | Purpose |
|---|---|---|
| `client.add(text, opts?)` | `{ memoryId, walrusBlobId, suiTxDigest }` | Write a memory; calls MemWal's `remember` + emits `ActionCall` with `tool_name="memwal_write"` |
| `client.search(query, opts?)` | `{ results: Memory[] }` | Vector search via MemWal's `recall` |
| `client.get(memoryId)` | `Memory` | Fetch single memory by ID; decrypts via Seal |
| `client.update(memoryId, text)` | `{ memoryId, walrusBlobId, suiTxDigest }` | Update memory; emits new version blob + chain commit |
| `client.delete(memoryId)` | `{ suiTxDigest }` | Soft-delete memory; emits `MemoryDeleted` event |
| `client.getAll(opts?)` | `{ memories: Memory[], pageInfo }` | List memories (filterable by namespace/agent/etc) |
| `client.history(memoryId)` | `Memory[]` | All versions of a memory (we go further than Mem0 here — version history is on-chain) |
| `client.batchUpdate(items)` | `{ results: BatchResult[] }` | Bulk update |
| `client.batchDelete(memoryIds)` | `{ results: BatchResult[] }` | Bulk delete |
| `client.feedback(memoryId, feedback, reason?)` | `void` | Mem0-pattern feedback signal |
| `client.export(opts?)` | `{ exportId, downloadUrl, includesVerification }` | Tamper-evident export (Walrus IDs + Sui txids + Seal proofs included) |

**`opts` shape (shared across methods):**
```ts
{
  namespaceId?: string;           // override default
  agentId?: string;               // override default
  runId?: string;                 // session/run scoping (Mem0 5-tuple compat)
  userId?: string;                // Mem0 5-tuple compat
  orgId?: string;                 // Mem0 5-tuple compat
  metadata?: Record<string, any>;
  memoryClass?: 'semantic' | 'episodic' | 'procedural';  // LangMem taxonomy
  contextTier?: 'L0' | 'L1' | 'L2';                      // OpenViking taxonomy
  topK?: number;                  // search only
  filters?: SearchFilters;        // search only
  threshold?: number;             // search only — minimum relevance
}
```

**`Memory` shape:**
```ts
{
  id: string;                     // Sui-level memoryId
  text: string;                   // decrypted plaintext
  walrusBlobId: string;
  suiTxDigest: string;
  namespaceId: string;
  agentId: string;
  userId?: string;
  runId?: string;
  metadata: Record<string, any>;
  memoryClass: 'semantic' | 'episodic' | 'procedural';
  contextTier: 'L0' | 'L1' | 'L2';
  createdAt: number;              // epoch ms
  updatedAt: number;
  version: number;                // bumped on each update
  verified: boolean;              // SDK self-checks chain integrity
}
```

---

## Namespace API (OneMem addition)

These don't exist in Mem0 — we add them for the Sui-capability sharing model.

| Method | Returns | Purpose |
|---|---|---|
| `client.namespace.create(name, kind, opts?)` | `{ namespaceId, adminCapId, suiTxDigest }` | Mint a new namespace + own initial Admin cap |
| `client.namespace.list()` | `Namespace[]` | List namespaces user owns or has caps for |
| `client.namespace.get(namespaceId)` | `Namespace` | Fetch namespace metadata |
| `client.namespace.share(namespaceId, recipientAddress, capKind)` | `{ capabilityId, suiTxDigest }` | Mint + transfer a cap to another address |
| `client.namespace.revoke(namespaceId, capabilityId)` | `{ suiTxDigest }` | Burn a previously-minted cap |
| `client.namespace.deactivate(namespaceId)` | `{ suiTxDigest }` | Soft-delete (writes blocked, existing data still verifiable) |
| `client.namespace.reactivate(namespaceId)` | `{ suiTxDigest }` | Re-enable writes |
| `client.namespace.getCapabilities(namespaceId)` | `Capability[]` | List all caps minted from this namespace |

**`Namespace` shape:**
```ts
{
  id: string;
  owner: string;                  // Sui address
  name: string;
  kind: 'USER' | 'AGENT' | 'ORG' | 'SESSION' | 'SHARED';
  active: boolean;
  merkleRoot: string;             // hex
  walrusBlobCount: number;
  createdAt: number;
  sealPackageId: string;
}
```

**`Capability` shape:**
```ts
{
  id: string;
  namespaceId: string;
  kind: 'ReadOnly' | 'ReadWrite' | 'Admin';
  owner: string;                  // current holder Sui address
  grantedAt: number;
  grantedBy: string;
}
```

---

## Trace API (the OneMem headline)

These don't exist in Mem0. They are the "agent action ledger" surface.

| Method | Returns | Purpose |
|---|---|---|
| `client.trace.startSession(opts?)` | `{ sessionId, suiTxDigest }` | Begin a trace session in the namespace |
| `client.trace.endSession(sessionId, status?)` | `{ suiTxDigest }` | Close session (status: COMPLETED/FAILED/ABORTED) |
| `client.trace.appendCall(sessionId, callData)` | `{ callId, suiTxDigest }` | Append an `ActionCall` (PENDING status) — used by plugin hooks |
| `client.trace.closeCall(sessionId, callId, outputData, status, level?)` | `{ suiTxDigest }` | Close call with output → finalizes Merkle chain entry |
| `client.trace.getSession(sessionId)` | `TraceSession` | Fetch session metadata |
| `client.trace.listSessions(opts?)` | `TraceSession[]` | List sessions for namespace/agent (paginated) |
| `client.trace.getCalls(sessionId)` | `ActionCall[]` | List all calls in a session (tree-structured by parent_call_id) |
| `client.trace.verifySession(sessionId)` | `{ verified: boolean, brokenAt?: string, details: VerificationDetails }` | **Walk the Merkle chain; assert integrity end-to-end.** |
| `client.trace.replaySession(sessionId, opts?)` | `ReplayedSession` | **Reconstruct full session from Walrus blobs + Seal decryption + Sui events.** Returns ordered call tree with all inputs/outputs decrypted. |
| `client.trace.subscribe(sessionId, onEvent)` | `Unsubscribe` | SSE / WebSocket-style live subscription to session events (for dashboard) |

**`callData` shape (for `appendCall`):**
```ts
{
  toolName: string;
  toolNamespace: string;          // "claude-code-builtin" / "mcp:filesystem" / "@onemem/mcp"
  input: any;                     // serializable
  parentCallId?: string;
  label?: string;
}
```

**`outputData` shape (for `closeCall`):**
```ts
{
  output: any;                    // serializable
  events?: TraceEvent[];          // optional in-call events (exceptions, warnings, metrics)
}
```

**`TraceSession` shape:**
```ts
{
  id: string;
  namespaceId: string;
  agentId: string;
  environment: string;
  sdkVersion: string;
  startedAt: number;
  endedAt?: number;
  rootCallId?: string;
  lastCallId?: string;
  callCount: number;
  merkleRoot: string;             // hex
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'ABORTED';
}
```

**`ActionCall` shape (matches Move struct):**
```ts
{
  id: string;
  sessionId: string;
  parentCallId?: string;
  toolName: string;
  toolNamespace: string;
  walrusInputBlob: string;
  walrusOutputBlob?: string;
  inputHash: string;              // hex SHA-256
  outputHash?: string;
  contentHash: string;            // hex
  prevHash: string;               // hex
  startedAt: number;
  endedAt?: number;
  level: 'DEBUG' | 'DEFAULT' | 'WARNING' | 'ERROR';
  status: 'PENDING' | 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'CANCELLED';
  events: TraceEvent[];
  capturedByAddress: string;
  label?: string;
}
```

---

## Auth + lifecycle

| Method | Returns | Purpose |
|---|---|---|
| `OneMem.login(opts?)` | `Credentials` | Browser-based wallet flow → writes `~/.onemem/credentials.json` |
| `OneMem.logout()` | `void` | Clear local credentials |
| `OneMem.currentAccount()` | `Account` | Read credentials + return MemWalAccount + delegate key info |
| `client.health()` | `{ ok: boolean, sdkVersion, minSupportedSdk, relayerStatus, suiNetwork }` | Relayer + chain health check (mirrors MemWal pattern) |

---

## What we explicitly DON'T expose (out of scope at v0.1)

- Webhooks API — we emit Sui events natively; dashboard subscribes via SSE. No HTTP webhook server.
- RBAC API — Sui capability transfer handles access control.
- Multi-modal `add()` — text only at v0.1; image/PDF deferred to v0.2.
- Custom categories CRUD — `memoryClass` enum is fixed at v0.1.
- Cloud account management (orgs/users/billing) — OSS-only at v0.1.

---

## Error model

Both SDKs throw / raise typed exceptions:

| Exception | When |
|---|---|
| `OneMemAuthError` | Missing / invalid credentials |
| `OneMemNetworkError` | Relayer unreachable or returns non-2xx |
| `OneMemChainError` | Sui tx failed or chain returns error |
| `OneMemSealError` | Encryption/decryption failed |
| `OneMemValidationError` | Bad input (e.g., empty text, invalid namespace ID format) |
| `OneMemCompatibilityError` | SDK version below `minSupportedSdk`; user must upgrade |
| `OneMemVerificationError` | Merkle chain broken (returned by `verifySession`; thrown by `replaySession` if integrity fails) |

---

## Cross-references

- `../01-protocol/data-model.md` — Move struct definitions these types mirror
- `sdk-typescript.md` — TS-specific package layout + deps + types
- `sdk-python.md` — Python-specific package layout + deps + types
- `relayer-integration.md` — how SDK actually talks to MemWal + Sui
- `compatibility-contract.md` — `minSupportedSdk` self-check logic
- `../../02-inspirations/mem0/README.md` — Mem0 API we mirror
- `../../02-inspirations/memwal-incubation/README.md` — MemWal SDK we wrap
