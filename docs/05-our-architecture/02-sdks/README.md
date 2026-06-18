# Pillar 2 — Core SDKs (OneMem)

> Current note, 2026-06-17: this is a historical design document. Current SDK
> source and package READMEs are the implementation truth; use
> `.thoughts/` for active planning.

Two SDKs, identical surface: `@onemem/sdk-ts` (TypeScript) + `onemem-sdk-python` (Python). Every downstream pillar (runtimes, frameworks, CLI, dashboard) consumes one of these.

---

## Read order

| File | Purpose |
|---|---|
| `README.md` | This file — design principles + nav |
| `shared-api-surface.md` | Historical API design. Verify against current package source before using it as implementation truth. |
| `sdk-typescript.md` | TS-specific implementation: package layout, deps, types, wraps `@mysten-incubation/memwal` |
| `sdk-python.md` | Python-specific: package layout, deps, wraps `mysten-incubation-memwal-python` |
| `relayer-integration.md` | How SDKs talk to MemWal relayer + Sui chain (manual Seal encryption flow) |
| `compatibility-contract.md` | SDK version negotiation + min-supported-SDK pattern (lifted from MemWal) |

---

## What the SDKs exist to do

1. **Wrap MemWal.** Both SDKs depend on Mysten's `@mysten-incubation/memwal` (TS) or `mysten-incubation-memwal-python` (Py) as their storage layer. We don't reimplement Seal encryption + Walrus upload + vector retrieval — that's Mysten's surface.
2. **Add OneMem on top.** Namespace ops (mint/share/revoke), trace emit (`ActionCall` per tool call), trace verify (Merkle walk + on-chain commit check), session lifecycle.
3. **Match Mem0's ergonomic.** Identical method names + parameter shapes wherever it doesn't conflict with OneMem's additions. A user moving from Mem0 → OneMem should not have to rethink their integration code.
4. **Speak directly to the Sui chain via `@mysten/sui` (TS) / `pysui` (Python)** for `MemoryNamespace` + `TraceSession` + `ActionCall` PTBs.
5. **Use the `/manual` Seal flow** — client-side encryption so the MemWal relayer never sees plaintext. Load-bearing for the trust-model pitch.
6. **Stay version-compatible** with MemWal's `minSupportedSdk` contract — server rejects outdated SDKs with a clear error per `02-inspirations/memwal-incubation/README.md`.

---

## Design principles

1. **Symmetric API surface across TS + Python.** Method names, parameter shapes, return types match 1:1. Documented in `shared-api-surface.md` as the canonical contract. Differences only where the language idioms force them (e.g., TS Promises vs Python async/await — same shape, different syntax).
2. **Mem0-mirror where possible.** `add()`, `search()`, `get()`, `update()`, `delete()` keep their names. We add: `namespace.create()`, `namespace.share()`, `namespace.revoke()`, `trace.startSession()`, `trace.appendCall()`, `trace.verifySession()`, `trace.replaySession()`.
3. **Thin wrapper over MemWal.** Don't reimplement what MemWal already provides. Memory write = MemWal.remember; memory read = MemWal.recall; we add the Sui-side emit + the namespace/trace primitives.
4. **`/manual` Seal flow always.** Never use relayer-handled encryption. Trust-model is non-negotiable.
5. **Browser-based wallet login → `~/.onemem/credentials.json`** (mirrors MemWal MCP pattern). CLI + dashboard share the same credential format.
6. **No worker daemon.** Unlike claude-mem's `worker-service.cjs`, OneMem SDK calls the MemWal relayer directly. Hooks → SDK → relayer + Sui chain. Simpler topology. (claude-mem needed a worker for AST parsing + Chroma; we don't.)
7. **Compatibility contract from Day 1.** Server returns `minSupportedSdk`; clients self-check and surface a clear upgrade message.
8. **Bundle `MoveTypes` codegen artifacts in the SDK package.** Move structs from `01-protocol/data-model.md` get a generated TS/Python representation that's part of the SDK package — single source of truth.

---

## What we satisfy + what surprises (lens check)

| Walrus must-have | How SDKs satisfy |
|---|---|
| "Integrations and tooling that make it easier for developers to adopt Walrus or MemWal" | Both SDKs ARE that tooling — 1-line install + Mem0-ergonomic |
| "Adding persistent memory to existing agent frameworks (plugins/adapters)" | SDKs are the foundation every plugin/adapter builds on |
| "Cross-tool / cross-agent memory sharing" | `namespace.share()` returns a Sui capability the recipient can use immediately |

| Surprise dimension | Why judges recognize it |
|---|---|
| **Mem0 ergonomic with verifiable substrate** | Users get Mem0 UX with on-chain trust. Migration is trivial — nobody else offers this combo |
| **`trace.verifySession()` as an SDK primitive** | Verifiability is callable from any language. Not a dashboard-only feature — programmable |
| **`trace.replaySession()` walks Walrus + Seal + Sui in one call** | Reconstructs the full session from on-chain commits + Walrus blobs + Seal decryption. Unique to our stack |

---

## Inspiration sources

- `../../01-protocol/data-model.md` — canonical Move structs that types derive from
- `../../01-protocol/events-and-attestation.md` — events the SDK subscribes to + emits
- `../../02-inspirations/memwal-incubation/README.md` — MemWal SDK API surface to wrap
- `../../02-inspirations/mem0/README.md` — Mem0 ergonomic to match
- `../../../TRACE_AND_PROVIDERS.md` — provider patterns + trace emit
- `../../../DEEP_DIVE.md` §1+§2 — MemWal source + oc-memwal teardown
- `../../../MEM0_DEEP_DIVE.md` §1 — Mem0 pipeline + public API

---

## Implementation status

Use this table as scoped current orientation. Current API truth lives in
`packages/sdk-ts/src/` and `packages/sdk-python/onemem/`; registry truth comes
from `pnpm registry:status`.

| Component | Status |
|---|---|
| `@onemem/sdk-ts` skeleton | Built; `src/index.ts` exports client, generated addresses, namespace, trace, memory, Seal, Walrus, and Move types. |
| `@onemem/sdk-ts` namespace ops | Built; `NamespacesAPI` covers create, share ReadOnly/ReadWrite, holder self-revoke, admin revoke, and read helpers. |
| `@onemem/sdk-ts` trace emit | Built; `TracesAPI` covers session start/end, action append/close, verification, and Walrus/Seal payload helpers. |
| `@onemem/sdk-ts` published to npm | Current on npm at `0.6.0`. Re-check with `pnpm registry:status`. |
| `onemem-sdk-python` skeleton | Built at `0.2.0`; package exports RPC, trace verification, hashing, memory helpers, and generated addresses. |
| `onemem-sdk-python` parity with TS | Partial; read/verify and memory bridge helpers are present, but full TS write-transaction parity remains future work. |
| `onemem-sdk-python` published to PyPI | Current on PyPI at `0.2.0`. Re-check with `pnpm registry:status --strict`. |
| Compatibility contract live | Source-level compatibility and generated address manifests are live; Python write parity remains an explicit future boundary. |
