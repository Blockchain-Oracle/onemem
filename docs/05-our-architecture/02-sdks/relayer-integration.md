# Relayer Integration — OneMem SDKs

How both SDKs talk to the **MemWal relayer** (`https://relayer.memwal.ai`) and the **Sui chain**. Same logic, different language idioms.

The key design choice: **always use MemWal's `/manual` flow** so the relayer never sees plaintext. This is load-bearing for the trust model.

---

## Topology

```
┌───────────────────────────────────────────────────────────────────┐
│                      User's machine                                │
│                                                                    │
│   ┌──────────────┐                ┌──────────────────────┐         │
│   │ Plugin / app │                │ OneMem SDK           │         │
│   │ (hook fires) │ ─── calls ───▶ │ • encrypt via Seal   │         │
│   └──────────────┘                │ • upload to Walrus   │         │
│                                   │ • emit Sui PTB        │         │
│                                   └──────────────────────┘         │
│                                          │            │             │
└──────────────────────────────────────────│────────────│─────────────┘
                                           │            │
                       ┌───────────────────│────────────│─────────────┐
                       │                   ▼            ▼             │
                       │     ┌─────────────────┐  ┌──────────────┐    │
                       │     │ MemWal Relayer  │  │ Sui Mainnet  │    │
                       │     │ relayer.memwal.ai│ │ (fullnode RPC)│    │
                       │     │                 │  │              │    │
                       │     │ - blob storage  │  │ - PTB exec   │    │
                       │     │ - vector index  │  │ - events     │    │
                       │     │ - search        │  │ - cap mgmt   │    │
                       │     │ - NEVER sees    │  │              │    │
                       │     │   plaintext     │  │              │    │
                       │     └─────────────────┘  └──────────────┘    │
                       │              │                    │           │
                       │              ▼                    │           │
                       │     ┌─────────────────┐           │           │
                       │     │ Walrus storage  │           │           │
                       │     │ (encrypted      │           │           │
                       │     │  blobs only)    │           │           │
                       │     └─────────────────┘           │           │
                       │                                   ▼           │
                       │                         ┌──────────────────┐  │
                       │                         │ Seal key servers │  │
                       │                         │ (threshold       │  │
                       │                         │  decryption)     │  │
                       │                         └──────────────────┘  │
                       │             External infrastructure           │
                       └────────────────────────────────────────────────┘
```

**Trust boundary:** relayer + Walrus + Seal key servers are external. The SDK encrypts on the user's machine before anything leaves. Even if the relayer is compromised, it only sees ciphertext + metadata.

---

## MemWal `/manual` flow vs default

| Mode | Where encryption happens | Trust requirement |
|---|---|---|
| **Default (relayer-handled)** | Server-side. SDK sends plaintext → relayer encrypts → uploads to Walrus | Trust the relayer with plaintext |
| **`/manual` (what we use)** | Client-side. SDK encrypts via Seal → sends ciphertext + embedding to relayer → relayer just indexes + uploads | Trust the SDK code (which is open source) |

We pick `/manual`. Always.

---

## Memory write path (`add()`)

```
SDK.add("user prefers dark mode", { namespaceId: '0x...' })
  │
  ├─▶ 1. Local: compute SHA-256 of plaintext → input_hash
  │
  ├─▶ 2. Local: compute embedding (small text via MemWal SDK's local embedder OR delegate to relayer if config says so)
  │
  ├─▶ 3. Local: Seal.encrypt(plaintext, namespaceSealPackageId) → ciphertext + ephemeral key
  │
  ├─▶ 4. POST relayer /v1/memories/manual
  │       body: { ciphertext, embedding, namespaceId, agentId, metadata }
  │       relayer stores ciphertext in Walrus + indexes embedding in pgvector + returns:
  │       { walrusBlobId, memoryId }
  │
  ├─▶ 5. Build PTB: trace::emit_call(
  │       session, namespace, cap,
  │       parent_call_id=None,
  │       tool_name="memwal_write",
  │       tool_namespace="@onemem/sdk-ts",
  │       walrus_input_blob=walrusBlobId,
  │       input_hash,
  │       label=metadata?.label
  │     )
  │
  ├─▶ 6. Sign PTB with delegate key + execute via SuiClient
  │
  └─▶ 7. Return { memoryId, walrusBlobId, suiTxDigest: result.digest }
```

**Note on embedding:** for v0.1, we let the relayer compute embeddings (it has GPU + LLM provider configs). The plaintext is encrypted before send → relayer can't see it for embedding generation. So we use the relayer's `/v1/embed` endpoint that takes ciphertext + ephemeral key + computes embedding inside a confidential boundary (TEE if Nautilus shipped; otherwise just trusted code at v0.1). Alternative: compute embedding fully locally with a small model. Decision deferred to relayer-integration build phase.

---

## Memory read path (`search()`)

```
SDK.search("dark mode", { namespaceId: '0x...', topK: 5 })
  │
  ├─▶ 1. POST relayer /v1/search
  │       body: { queryEmbedding (or query text encrypted), namespaceId, topK, filters }
  │       relayer returns: [{ memoryId, walrusBlobId, relevance, metadata }, ...]
  │
  ├─▶ 2. For each result above threshold:
  │       a. GET walrus aggregator /v1/blobs/<walrusBlobId> → ciphertext
  │       b. Seal.decrypt(ciphertext, namespaceSealPackageId, sessionKey) → plaintext
  │       c. Local: verify SHA-256 of plaintext matches expected input_hash from chain
  │
  └─▶ 3. Return { results: Memory[] }
```

---

## Trace emit path (`appendCall()`)

Same shape as memory write but the data is a tool call's input. Most plugins emit a pair:
1. `appendCall(...)` when the tool starts (PENDING status, has input blob)
2. `closeCall(...)` when the tool completes (transitions to SUCCESS/FAILURE, fills in output blob)

```
plugin hook fires: PreToolUse(Read, "/path/to/file")
  ─▶ SDK.trace.appendCall(sessionId, {
       toolName: "Read",
       toolNamespace: "claude-code-builtin",
       input: { file_path: "/path/to/file" },
       parentCallId: currentParentCall?.id,
     })
       │
       (same Seal + Walrus + Sui flow as memory write)
       │
       └─▶ Returns { callId }

plugin hook fires: PostToolUse(Read, file_contents)
  ─▶ SDK.trace.closeCall(sessionId, callId, {
       output: { file_contents: "..." },
     }, "SUCCESS")
       │
       (Seal encrypt output → Walrus upload → Sui PTB trace::close_call_with_namespace)
```

---

## Verification path (`verifySession()`)

```
SDK.trace.verifySession(sessionId)
  │
  ├─▶ 1. GET suiClient.queryEvents({
  │       filter: { MoveEventType: `${PKG}::events::ActionCallEmitted` },
  │       additional filter: session_id == sessionId
  │     })
  │     Returns chronologically-ordered events.
  │
  ├─▶ 2. For each event in order:
  │     a. Fetch + decrypt input blob from Walrus
  │     b. If call is closed, fetch + decrypt output blob
  │     c. Recompute content_hash from (tool_name, tool_namespace, input_hash, output_hash?, parent_call_id, captured_at)
  │     d. Assert prev_hash == predecessor.content_hash
  │     e. Re-derive merkle_root by chaining hashes
  │
  ├─▶ 3. Fetch on-chain TraceSession.merkle_root
  │     Assert against derived root
  │
  └─▶ 4. Return:
       ✓ { verified: true, details: { chainLength, expectedRoot, actualRoot } }
       ✗ { verified: false, brokenAt: callId, details: { ... } }
```

**Performance note:** for sessions with hundreds of calls, verification is expensive (one Walrus + one Seal decrypt per call). v0.1 ships sync verify; v0.2 can batch + cache.

---

## SSE subscription (`subscribe()`)

```
SDK.trace.subscribe(sessionId, (event) => { ... })
  │
  ├─▶ 1. Open EventSource to relayer /v1/sessions/:id/stream
  │     (relayer subscribes to Sui events, fans out via SSE)
  │
  ├─▶ 2. Relayer emits SSE events:
  │     - { type: 'connected', sessionId }
  │     - { type: 'new_call', call: ActionCall }  // when ActionCallEmitted fires
  │     - { type: 'call_closed', callId, status }  // when ActionCallClosed fires
  │     - { type: 'session_ended', finalStatus }
  │     - { type: 'verification_status_change', verified: boolean }
  │
  └─▶ 3. SDK fan-outs to user's onEvent callback
```

Dashboard uses this directly for live `/trace/[id]` page updates.

---

## Auth headers + signature

Every relayer call carries:

```
Authorization: OneMem-Delegate v1 <delegate_address>:<base64_signature>
X-OneMem-SDK-Version: 0.1.0
X-OneMem-Account-ID: 0x...
X-OneMem-Namespace-ID: 0x...
```

`<signature>` = Ed25519 sign of `(method + path + body_sha256 + timestamp)` using delegate key. Relayer verifies signature against the delegate key registered to the MemWalAccount.

---

## Retry + backoff

Both SDKs share retry policy:

| Failure | Retry? | Backoff |
|---|---|---|
| Relayer HTTP 5xx | Yes (3 tries) | Exponential: 1s, 2s, 4s |
| Relayer HTTP 4xx | No | Throw `OneMemValidationError` or `OneMemAuthError` |
| Network timeout | Yes (2 tries) | 5s, then 10s |
| Sui chain congestion (insufficient gas / equivocation) | Yes (3 tries) | 2s, 4s, 8s |
| Walrus aggregator 5xx | Yes — try alternate aggregator from public list | None (immediate failover) |
| Seal decryption failure (key server unreachable) | Yes — try alternate seal server | None (immediate failover) |

---

## Caching

v0.1 minimum:
- **Credentials**: cached in memory after first read from `~/.onemem/credentials.json`
- **Namespace metadata**: cached for 5 minutes (TTL) to avoid hammering chain on every call
- **Seal session keys**: cached for the SessionKey TTL (default 10 min per MemWal docs)

NOT cached at v0.1:
- Memory content (too sensitive to keep in process memory unbounded)
- Verification results (must be fresh)
- Trace event stream

---

## Failure semantics

**Atomic guarantees:**
- A memory write either fully succeeds (Walrus + Sui both committed) or fully fails (rolls back: Walrus blob marked deletable if Sui tx fails)
- A trace `appendCall` either fully succeeds (Walrus + Sui) or fully fails
- `closeCall` must succeed if `appendCall` succeeded (otherwise session has dangling PENDING call)

**At-least-once delivery:**
- The relayer's SSE may deliver duplicate events on reconnect. SDK consumers should dedup by `callId`.

---

## Cross-references

- `shared-api-surface.md` — public API methods that use these flows
- `sdk-typescript.md` + `sdk-python.md` — language-specific HTTP clients
- `compatibility-contract.md` — version negotiation in `assert_compatibility`
- `../01-protocol/move-contract.md` — entry functions PTBs target
- `../../02-inspirations/memwal-incubation/README.md` — MemWal `/manual` flow reference
- `../../01-sui-ecosystem/seal-deep-dive.md` — Seal mechanics
- `../../01-sui-ecosystem/walrus-deep-dive.md` — Walrus HTTP API
