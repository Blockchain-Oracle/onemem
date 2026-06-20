# @onemem/sdk-ts

TypeScript SDK for OneMem — a Mem0-style memory layer (`add` / `search` / `get` /
`getAll` / `delete`) built on `@mysten-incubation/memwal`. MemWal stores each
memory as a client-side Seal-encrypted blob on Walrus (the relayer never sees
plaintext); this SDK adds the CRUD + multi-scope surface MemWal lacks.

`OneMem.create(config)` → `requireMemory().add()` / `.search()` / `.get()` /
`.getAll()` / `.delete()`. Current API truth is the source in `src/` and the
exported types from `src/index.ts`.

## Local index

MemWal 0.0.7 is append-only (no get-by-id / get-all / delete primitive), so the
SDK mirrors every write into a local SQLite index (`memory-index.ts`) that backs
`get` / `getAll` / `delete` and post-filters `search`. The index stores the
decrypted plaintext, so it is hardened the same way the credentials file is:
owner-only db file (`0600`) inside an owner-only dir (`0700`), including the
SQLite `-wal`/`-shm` sidecars. `delete` is a SOFT delete — the encrypted Walrus
blob persists until its storage epoch expires.

## Isolation

The MemWal **namespace is the real isolation boundary** — Seal encryption keys
are per-namespace. Per-user isolation comes from `userId` → `user:<id>`
namespacing: each user gets a cryptographically-separate Seal scope. Putting
multiple users inside ONE explicit namespace gives them a SHARED Seal scope —
they are NOT cryptographically isolated; the index `userId`/`agentId`/`runId`/
`metadata` post-filter is convenience, not a security boundary. A memory written
with an explicit `{ namespace, userId }` is, by design, only reachable by reading
with that same `namespace`.

The scope→namespace mapping is centralized in one place (`effectiveNamespace`)
used by `add`/`search`/`getAll`, so identical scope args always resolve to the
same namespace (`getAll({userId})` and `search(q,{userId})` agree).

## Build / test

- `tsup` (ESM+CJS). Node-only runtime helpers live in `@onemem/sdk-ts/runtime`.
- Vitest in `tests/`; real MemWal-testnet integration via
  `scripts/memory-crud-itest.mts` (gated on MemWal creds; run via the root
  `test:integration` script).
