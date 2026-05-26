# TypeScript SDK — `@onemem/sdk-ts`

Implements the `shared-api-surface.md` contract in TypeScript. Wraps `@mysten-incubation/memwal` + `@mysten/sui` + `@mysten/seal`.

---

## Package layout

```
onemem-sdk-ts/
├── package.json
├── tsconfig.json
├── tsup.config.ts                     # bundler (ESM + CJS dual)
├── src/
│   ├── index.ts                       # public exports
│   ├── client.ts                      # OneMem.create() entry point
│   ├── auth.ts                        # OneMem.login() / logout() / currentAccount()
│   ├── memory.ts                      # add / search / get / update / delete / etc
│   ├── namespace.ts                   # namespace.create / share / revoke / etc
│   ├── trace.ts                       # trace.startSession / appendCall / closeCall / verifySession / replaySession
│   ├── relayer.ts                     # HTTP client wrapping MemWal relayer with /manual flow
│   ├── chain.ts                       # Sui PTB builders (mint namespace, append call, etc)
│   ├── seal.ts                        # Seal /manual encryption/decryption helpers
│   ├── types/
│   │   ├── memory.ts
│   │   ├── namespace.ts
│   │   ├── trace.ts
│   │   ├── errors.ts
│   │   └── move-types.ts              # codegen'd from data-model.md (see below)
│   ├── codegen/                       # Move-to-TS type bindings
│   │   └── README.md                  # how to regenerate from contract IDs
│   ├── compatibility.ts               # SDK version self-check (mirrors MemWal pattern)
│   ├── credentials.ts                 # ~/.onemem/credentials.json reader/writer
│   └── utils/
│       ├── hash.ts                    # SHA-256, hex helpers
│       └── retry.ts                   # exponential backoff for relayer calls
├── tests/
│   ├── memory.test.ts
│   ├── namespace.test.ts
│   ├── trace.test.ts
│   ├── verify.test.ts
│   └── compatibility.test.ts
└── examples/
    ├── basic-memory.ts
    ├── share-namespace.ts
    ├── trace-session.ts
    └── verify-and-replay.ts
```

---

## `package.json`

```json
{
  "name": "@onemem/sdk-ts",
  "version": "0.1.0",
  "description": "Verifiable agent memory + trace SDK on Sui + Walrus + Seal + MemWal",
  "license": "Apache-2.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./types": {
      "import": "./dist/types.mjs",
      "types": "./dist/types.d.ts"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "engines": { "node": ">=18.0.0" },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "codegen": "tsx scripts/codegen-move-types.ts"
  },
  "dependencies": {
    "@mysten-incubation/memwal": "^0.x",
    "@mysten/sui": "^1.x",
    "@mysten/seal": "^0.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "tsup": "^8.x",
    "typescript": "^5.x",
    "vitest": "^1.x",
    "tsx": "^4.x"
  }
}
```

---

## Public entry point

```ts
// src/index.ts
export { OneMem } from './client.js';
export type {
  OneMemConfig,
  Memory,
  Namespace,
  Capability,
  TraceSession,
  ActionCall,
  TraceEvent,
  VerificationDetails,
  ReplayedSession,
  Credentials,
  SearchOptions,
  AddOptions,
} from './types/index.js';
export {
  OneMemAuthError,
  OneMemNetworkError,
  OneMemChainError,
  OneMemSealError,
  OneMemValidationError,
  OneMemCompatibilityError,
  OneMemVerificationError,
} from './types/errors.js';
```

---

## Client construction (`src/client.ts`)

```ts
import { SuiClient } from '@mysten/sui/client';
import { MemWalManual } from '@mysten-incubation/memwal/manual';
import { SealClient } from '@mysten/seal';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import * as memory from './memory.js';
import * as namespace from './namespace.js';
import * as trace from './trace.js';
import { assertCompatibility } from './compatibility.js';

export class OneMem {
  readonly suiClient: SuiClient;
  readonly memwal: MemWalManual;
  readonly seal: SealClient;
  readonly keypair: Ed25519Keypair;
  readonly config: OneMemConfig;

  // Namespaced sub-APIs
  readonly namespace: typeof namespace;
  readonly trace: typeof trace;

  private constructor(config: OneMemConfig, keypair: Ed25519Keypair, suiClient: SuiClient, memwal: MemWalManual, seal: SealClient) {
    this.config = config;
    this.keypair = keypair;
    this.suiClient = suiClient;
    this.memwal = memwal;
    this.seal = seal;
    
    // Bind sub-APIs with `this` context
    this.namespace = bindNamespaceAPI(this);
    this.trace = bindTraceAPI(this);
  }

  static async create(config: OneMemConfig): Promise<OneMem> {
    // Validate config
    // Construct SuiClient, MemWalManual, SealClient, Ed25519Keypair from config.key
    // Compatibility check against relayer
    await assertCompatibility(config.serverUrl);
    return new OneMem(config, keypair, suiClient, memwal, seal);
  }

  // Memory API methods (directly on the client per Mem0 ergonomic)
  add = memory.add.bind(this);
  search = memory.search.bind(this);
  get = memory.get.bind(this);
  update = memory.update.bind(this);
  delete = memory.del.bind(this);
  getAll = memory.getAll.bind(this);
  history = memory.history.bind(this);
  batchUpdate = memory.batchUpdate.bind(this);
  batchDelete = memory.batchDelete.bind(this);
  feedback = memory.feedback.bind(this);
  export = memory.exportFn.bind(this);
  health = async () => { /* hits relayer /health + suiClient.getLatestSuiSystemState */ };
}
```

---

## Move type codegen

The single source of truth for data types is `01-protocol/data-model.md` (Move structs). We codegen TypeScript types from the deployed contract IDs.

```ts
// scripts/codegen-move-types.ts
// Pulls Move struct definitions from the deployed onemem package
// Outputs to src/codegen/move-types.ts
//
// Strategy: at SDK build time, fetch the published package via @mysten/sui
// and use BCS schema introspection to generate matching TS interface types.
//
// Why not @mysten/move-binding (Rust-based)? Because we need TS output.
// Alternative considered: hand-write types. Rejected — they'd drift from Move.
```

**Open question for build-strategy conversation:** auto-codegen at every SDK release vs hand-write + CI lint? Both are viable. Auto-codegen is safer + slower; hand-write is faster + lints catch drift. Decision deferred to build phase per Abu's data-types-coordination concern.

---

## Auth flow (`src/auth.ts`)

```ts
// OneMem.login() — browser-based wallet flow
export async function login(opts?: LoginOptions): Promise<Credentials> {
  // 1. Open browser to https://app.onemem.ai/cli-login?nonce=<nonce>
  // 2. User connects wallet (via dApp Kit) + signs nonce + creates MemWalAccount if needed
  // 3. Browser posts { delegateKey, accountId, signature } back to local CLI server (port :12340)
  // 4. CLI server validates signature + writes ~/.onemem/credentials.json
  // 5. Returns Credentials object
}
```

Same pattern as `@mysten-incubation/memwal-mcp`. Credentials file format:

```json
{
  "delegateKey": "<ed25519 private key hex>",
  "delegatePublicKey": "<hex>",
  "accountId": "<sui object id>",
  "suiAddress": "<sui address that signed>",
  "createdAt": <epoch>,
  "expiresAt": <epoch>,
  "sdkVersion": "0.1.0"
}
```

---

## Memory API implementation (`src/memory.ts`)

```ts
export async function add(this: OneMem, text: string, opts?: AddOptions) {
  // 1. Validate input
  // 2. Resolve namespace (opts.namespaceId || config.namespaceId)
  // 3. Encrypt text via Seal /manual (client-side)
  // 4. Upload encrypted blob to Walrus via MemWal relayer
  // 5. Build PTB: trace::append_call with tool_name="memwal_write", input_hash=sha256(text), walrus_input_blob=blobId
  // 6. Sign + execute PTB
  // 7. Wait for confirmation
  // 8. Return { memoryId, walrusBlobId, suiTxDigest }
}

export async function search(this: OneMem, query: string, opts?: SearchOptions) {
  // 1. Validate query
  // 2. Call MemWal recall: gives back blob IDs + relevance scores
  // 3. For each result above threshold: decrypt via Seal /manual
  // 4. Return { results: Memory[] }
}

// ... other Mem0-mirror methods follow same pattern
```

---

## Trace API implementation (`src/trace.ts`)

```ts
export async function startSession(this: OneMem, opts?: StartSessionOptions) {
  // PTB: trace::start_session(namespace, cap, agent_id, environment, sdk_version)
}

export async function appendCall(this: OneMem, sessionId: string, callData: CallData) {
  // 1. Encrypt input via Seal /manual
  // 2. Upload to Walrus
  // 3. PTB: trace::append_call(session, namespace, cap, parent_call_id, tool_name, tool_namespace, walrus_input_blob, input_hash, label)
  // 4. Return { callId, suiTxDigest }
}

export async function closeCall(this: OneMem, sessionId: string, callId: string, outputData: OutputData, status: CallStatus, level?: Level) {
  // 1. Encrypt output via Seal /manual
  // 2. Upload to Walrus
  // 3. PTB: trace::close_call(session, namespace, cap, call_id, walrus_output_blob, output_hash, status, level, events)
  // 4. Return { suiTxDigest }
}

export async function verifySession(this: OneMem, sessionId: string) {
  // 1. Subscribe to all ActionCallEmitted + ActionCallClosed events for sessionId
  // 2. For each call in order:
  //    a. Fetch + decrypt input blob from Walrus via Seal
  //    b. Fetch + decrypt output blob from Walrus via Seal (if call is closed)
  //    c. Recompute content_hash
  //    d. Assert prev_hash matches predecessor.content_hash
  // 3. Re-derive session merkle_root by chaining
  // 4. Assert against on-chain session.merkle_root
  // 5. Return { verified: true } or { verified: false, brokenAt: callId, details: ... }
}

export async function replaySession(this: OneMem, sessionId: string, opts?: ReplayOptions) {
  // 1. Verify first (throw if integrity broken)
  // 2. Build the tree from parent_call_id structure
  // 3. Return ReplayedSession with all decrypted inputs/outputs
}

export function subscribe(this: OneMem, sessionId: string, onEvent: (event: SessionEvent) => void): Unsubscribe {
  // EventSource (SSE) to relayer's /api/sessions/:id/stream
  // Emits: new_call, call_closed, session_ended, verification_status_change
}
```

---

## Error handling

All public methods wrap internal errors in typed `OneMemError` subclasses (per `shared-api-surface.md` error model). No unwrapped `Error` instances leak through the public API.

```ts
try {
  await client.add('hello');
} catch (err) {
  if (err instanceof OneMemAuthError) { /* prompt re-login */ }
  if (err instanceof OneMemNetworkError) { /* retry */ }
  // etc
}
```

---

## What we DON'T implement (deferred)

- React hooks (`useOneMem`, `useMemory`, `useTrace`) — could be a separate `@onemem/react` package; v0.2
- Edge runtime support (Cloudflare Workers, Vercel Edge) — needs Walrus client without Node deps; v0.2
- Browser-only build — same constraint; v0.2

---

## Cross-references

- `shared-api-surface.md` — the contract this implements
- `relayer-integration.md` — relayer HTTP details
- `compatibility-contract.md` — version self-check
- `sdk-python.md` — Python sibling (identical surface)
- `../01-protocol/data-model.md` — Move structs that types mirror
- `../../02-inspirations/memwal-incubation/README.md` — `@mysten-incubation/memwal` API to wrap
