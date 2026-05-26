# Dashboard Data Flow — OneMem

How the dashboard reads from Sui + Walrus + Seal + MemWal. Critical for understanding why the dashboard works.

---

## Read paths

```
┌──────────────────────────────────────────────┐
│ Dashboard (Next.js, Browser)                  │
│  ├─ React components                          │
│  ├─ SWR cache                                 │
│  └─ SSE EventSource                           │
└──────────────────────────────────────────────┘
        │              │              │
        ▼              ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────────┐
│  Sui RPC   │ │ MemWal     │ │  Local Next.js │
│  (chain    │ │ Relayer    │ │  API routes    │
│  reads via │ │ (search,   │ │  /api/stream   │
│  dapp-kit) │ │ embeddings)│ │  (SSE          │
│            │ │            │ │  forwarder)    │
└────────────┘ └────────────┘ └────────────────┘
        │              │              │
        │              │              ▼
        │              │      ┌────────────────┐
        │              │      │ OneMem SDK     │
        │              │      │ (server-side)  │
        │              │      └────────────────┘
        │              │              │
        │              │              ▼
        │              │      Subscribes to Sui events,
        │              │      forwards via SSE
        ▼              ▼
   On-chain:       Encrypted blobs (Walrus);
   Namespaces,    SDK fetches + Seal-decrypts
   sessions,      client-side (browser-only after
   ActionCalls,   user signs SessionKey)
   Capabilities
```

---

## Per-route data flow

### `/` (overview)

```
On mount:
  1. SWR fetches /api/overview (server-side):
     - Sui RPC: latest 10 ActionCalls in active namespace
     - Sui RPC: total memory count
     - Sui RPC: list of TraceSessions (latest 5)
     - Sui RPC: list of capabilities
  2. SSE subscribes to active namespace's event stream
     - On `new_action_call` → mutate SWR cache → re-render

Client-side:
  - Renders stats + recent activity
  - No decryption (overview shows metadata only)
```

### `/memories`

```
On mount:
  1. SWR fetches /api/memories?namespace=X (server-side):
     - Calls SDK getAll() — returns memory IDs + walrus_blob_ids + metadata (NOT decrypted text)
  2. For each visible row, browser:
     - Fetches encrypted blob from Walrus aggregator (direct, not through Next.js API)
     - Decrypts via Seal /manual (browser-side, requires SessionKey)
     - Renders plaintext text

SSE:
  - `new_action_call` with tool_name="memwal_write" → invalidate cache → re-fetch
```

### `/trace/[session_id]` (the headline)

```
On mount:
  1. SWR fetches /api/sessions/[id] (server-side):
     - Returns TraceSession + all ActionCalls (metadata only)
  2. Render tree skeleton + Gantt skeleton immediately

  3. SSE subscribes specifically to this session's stream
     - `new_action_call` → append to tree
     - `call_closed` → update node status
     - `session_ended` → freeze tree

  4. When user clicks a call (or VerifyDrawer opens):
     - Browser fetches input/output blobs from Walrus
     - Decrypts via Seal
     - Renders content

Verify drawer:
  1. User clicks "Verify"
  2. Browser walks the chain:
     - For each call in order, fetches blob, decrypts, recomputes content_hash
     - Asserts prev_hash matches predecessor
     - Re-derives merkle_root
     - Compares to on-chain merkle_root
  3. UI shows progress bar; on success → chartreuse glow + Verified ✓ badge
```

### `/share/[capability_id]`

```
On mount:
  1. SWR fetches /api/capabilities/[id] (Sui RPC):
     - Returns Capability object metadata
  2. Render cap details + grant/revoke buttons
  3. If user owns Admin cap on the namespace:
     - Mint new cap → calls onemem-sdk → builds PTB → signs via dApp Kit
     - Optionally sponsored via Enoki for the hosted deploy
```

---

## SSE stream architecture

```
Browser EventSource
  └─ GET /api/stream?namespace=0x... 
       │
       ▼
   Next.js API route (Node):
     - Creates a OneMem SDK client (server-side, with elevated read creds)
     - Calls client.trace.subscribe(session_id) per session in scope
     - For each Sui event received:
       - Transforms to dashboard event shape:
         { type: "new_action_call", call: ActionCall, sessionId, namespaceId, timestamp }
       - Writes as SSE message: data: <json>\n\n
     - On client disconnect: unsubscribes
```

Event types streamed:
- `connected`
- `initial_load` (snapshot of current state at connection)
- `new_action_call`
- `call_closed`
- `new_trace_session`
- `session_ended`
- `new_attestation`
- `processing_status` (relayer health, write queue depth)
- `verification_status_change` (when /api/verify finishes async)
- `capability_minted`
- `capability_revoked`

---

## Why server-side Sui reads + client-side Walrus reads

| Read | Where | Why |
|---|---|---|
| Sui RPC (chain metadata) | Server (Next.js API route) | Cacheable; consistent; can use a paid RPC tier in production |
| Walrus blobs (encrypted bytes) | Browser (direct fetch from aggregator) | Decryption requires user's Seal SessionKey which lives in the browser; sending blobs through Next.js would require also sending the key |
| Seal decryption | Browser | SessionKey is user-controlled |
| MemWal search (vector recall) | Server (API route) | Relayer has the embedding model + Postgres; browser doesn't |

This split keeps the trust model intact: the server never sees plaintext, only the metadata + ciphertext routing.

---

## Caching strategy

| Data | Stale-while-revalidate | Invalidate on |
|---|---|---|
| Namespace list | 1 min | Manual refresh + `new_action_call` |
| Memory list (metadata) | 30 sec | `new_action_call` SSE event |
| TraceSession list | 30 sec | `new_trace_session` / `session_ended` |
| ActionCall list per session | 5 sec | `new_action_call` / `call_closed` |
| Decrypted memory text | 5 min | Manual refresh only (decryption is expensive) |
| Verification result | 1 min | Manual re-verify |

---

## Performance budget

| Operation | Budget (p95) |
|---|---|
| `/` overview first render | <500ms (cached) |
| `/memories` first render | <1s (Sui RPC + render) |
| Memory text decryption per item | <300ms (Seal + Walrus) |
| `/trace/[id]` first render | <800ms |
| Verify chain (47-call session) | <15s — show progress bar |
| SSE event-to-UI latency | <500ms |

---

## What we DON'T do at v0.1

- Client-side embedding generation (relies on relayer)
- Local Walrus caching beyond browser HTTP cache
- IndexedDB-backed offline mode (v0.2+)
- Real-time collaborative editing of memories (v0.2+)

---

## Cross-references

- `ui-architecture.md` — components + state
- `../02-sdks/relayer-integration.md` — SDK relayer + chain calls
- `../01-protocol/events-and-attestation.md` — chain events the dashboard subscribes to
- `../../02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` — claude-mem 62-endpoint REST API + SSE pattern
