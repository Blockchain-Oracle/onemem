---
purpose: Table of canonical Mysten reference apps and exactly what to mine from each for OneMem.
verified: 2026-05-23
---

# Reference Apps to Mine for OneMem

These are the Mysten-shipped reference apps closest in shape to OneMem. Clone, study, and lift wholesale where applicable. Each row: repo, what it covers, what OneMem should lift.

| App | Repo | Tech stack | What to lift for OneMem |
|---|---|---|---|
| **OnlyFins** | `MystenLabs/onlyfins-example-app` | React + Vite + dApp Kit + Move + Enoki (zkLogin) + Seal + Walrus + sponsored-tx | **Closest clone target.** `frontend/move/sources/posts.move` → adapt `seal_approve_access` → `onemem::seal_approve`. `frontend/src/lib/seal-client.ts` → reuse verbatim. `frontend/src/hooks/usePostDecryption.ts` → adapt to decrypt OneMem trace blobs. `frontend/src/utils/walrus-fetch.ts` (retry + 25s timeout) → reuse verbatim. `frontend/src/utils/post-transform.ts` → adapt for transforming `AuditEntry` Sui objects. `backend/src/createPosts.ts` PTB pattern → adapt for `onemem::commit_memory`. `backend/src/encryptImages.ts` server-side Seal encrypt pattern → adapt for trace blob encryption. The `ViewerToken` capability + `seal_approve_access` Move pattern is the cleanest "purchase / earn access → decrypt" reference. |
| **ticketing-poc** | `MystenLabs/ticketing-poc` | Next.js + Enoki (zkLogin Google) + sponsored-tx + Move (Ed25519 permits) | **Signed-attestation pattern.** `move/sources/key_registry.move` → adapt for OneMem's `AgentKeyRegistry` (Ed25519 pubkey + nonce table). `move/sources/ticket.move::new_mint_permit` → adapt for `onemem::new_commit_permit` (verify Ed25519 sig + consume nonce). `app/src/app/api/permit/mint-ticket/route.ts` → adapt for backend signing of OneMem commit permits. `app/src/app/hooks/useMintTicket.tsx` → adapt for end-to-end orchestration (permit → sponsor → sign → execute). The 5-step purchase flow IS OneMem's 5-step commit flow with different field names. |
| **sui-stack-messaging chat-app** | `MystenLabs/sui-stack-messaging` (subdir `chat-app/`) | React + Rust/Axum relayer + Move + Seal envelope encryption + Walrus | **Envelope encryption pattern.** `move/packages/sui_stack_messaging/sources/seal_policies.move::seal_approve_reader` → reuse as a template for permission-typed Seal policies. The 2-layer encryption (Seal-wrapped DEK + AES-256-GCM payload) is the right pattern for OneMem trace blobs > 100KB. `relayer/` Rust/Axum scaffold → reuse if OneMem ships its own relayer. The 7 granular permission types (`MessagingSender`, `MessagingReader`, `EncryptionKeyRotator`, etc.) are a good model if OneMem adds RBAC. |
| **MemWal apps/researcher** | `MystenLabs/MemWal` (subdir `apps/researcher/`) | Next.js + MemWal SDK + Vercel AI SDK | Long-running agent reference. Use as a North Star for what an "agent that needs persistent memory across days" looks like. OneMem could plug in here as middleware to commit every memory write authoritatively. |
| **MemWal apps/chatbot** | `MystenLabs/MemWal` (subdir `apps/chatbot/`) | Next.js + Vercel AI SDK + `withMemWal()` middleware | `withMemWal(model, {...})` integration pattern. OneMem's competing middleware would slot in identically: `withOneMem(model, {...})` that wraps recall/save with onchain commits. |
| **MemWal apps/noter** | `MystenLabs/MemWal` (subdir `apps/noter/`) | Next.js + zkLogin + MemWal SDK | zkLogin onboarding pattern for a memory-using app. OneMem dashboard onboarding can mirror exactly. |
| **MemWal apps/app (dashboard)** | `MystenLabs/MemWal` (subdir `apps/app/`) | Vite + React 19 + dApp Kit + Enoki + Seal + Walrus + react-three-fiber + lucide-react | **What NOT to be.** This is the MemWal dashboard at memwal.ai — credentials portal + setup wizard + playground. OneMem dashboard must be different: timeline + per-agent activity feed + decrypted-trace viewer + replay. Read it to understand the gap. |
| **sui examples/custom-indexer** | `MystenLabs/sui` (subdir `examples/custom-indexer/`) | Rust + Sui Indexer Alt | **Audit ledger viewer backend.** OneMem needs to index its own `MemoryCommit` authenticated events into a queryable store for the dashboard. This is the canonical Rust indexer reference. |
| **sui examples/usdc-transfer-app** | `MystenLabs/sui` (subdir `examples/usdc-transfer-app/`) | TS + React | If OneMem adds payment / metered plans, reference for USDC handling on Sui. |
| **sui dapps/sponsored-transactions** | `MystenLabs/sui` (subdir `dapps/sponsored-transactions/`) | Vite + TS + Move | Standalone sponsored-tx UI scaffold (without Enoki). Useful if OneMem ships a self-hosted sponsor flavor for power users. |
| **walrus-pocs** | `MystenLabs/walrus-pocs` | Node.js + React (focused single-purpose modules) | Lift the SDK hooks: `useSealEncrypt`, `useSealSession`, `useSealDecrypt`, `write.ts`, `download.ts`, `delete.ts`. Drop into OneMem dashboard directly. |
| **Walrus-Onboarding** | `MystenLabs/Walrus-Onboarding` | Multiple modules — TS + Move | Module 07 (upload relay), Module 11 (batch / quilts) are the cleanest Walrus integration references. Use as the source of truth for `writeBlob`/`writeFiles` patterns. |
| **sui-move-bootcamp K5/seal-demo** | `MystenLabs/sui-move-bootcamp` (subdir `K5/seal-demo/`) | Move + TS standalone | **The cleanest Seal Move reference.** 3 minimal policies: `private_seal.move` (owner-only), `timelock_seal.move` (Clock-gated unlock), `allowlist_seal.move` (shared mutable allowlist). `ts/src/index.ts` is a 1-file end-to-end encrypt → SessionKey → PTB → decrypt walkthrough. Read these before writing OneMem's policy. |
| **nautilus** | `MystenLabs/nautilus` | Rust + AWS Nitro Enclave + Move | TEE template for the Day 23-29 relayer-in-TEE story. Apache 2.0 reference build, "not feature complete, not audited" — clone, adapt the offchain handler, write a `seal_approve_tee` policy in OneMem's package. |
| **sui-gas-pool** | `MystenLabs/sui-gas-pool` | Rust | Reference implementation for sponsored-tx gas pool. If OneMem runs its own sponsor (no Enoki), this is the production-grade reference. Skip if using Enoki. |
| **zklogin-verifier** | `MystenLabs/zklogin-verifier` | Rust | Self-hosted zkLogin signature verifier endpoint. Reference if OneMem needs to verify zkLogin sigs server-side (rare — most apps verify onchain). |

## Priority order for OneMem

If you only have time to clone + study 4 repos, do these in order:

1. **MystenLabs/onlyfins-example-app** — closest stack overall, most code reusable verbatim.
2. **MystenLabs/MemWal** (specifically `services/contract/sources/account.move` + `apps/app/`) — what OneMem wraps; what the dashboard should NOT look like.
3. **MystenLabs/ticketing-poc** — signed-permit pattern + Enoki sponsored-tx orchestration.
4. **MystenLabs/sui-move-bootcamp** K5/seal-demo — cleanest Seal Move reference for writing `onemem::seal_approve*`.

Skip everything else until needed.

## Pattern crib sheet — which app teaches which pattern

| Pattern | Reference |
|---|---|
| `seal_approve` Move policy | sui-move-bootcamp K5/seal-demo, MemWal account.move, OnlyFins posts.move |
| Capability pattern (AdminCap delegation) | sui-move-bootcamp C1/capability, sui-stack docs example |
| Authenticated events | (no shipped reference yet — docs only, `develop/accessing-data/authenticated-events.mdx`) — OneMem is the early adopter |
| Versioning via dynamic field on UID | MemWal account.move L568-595 |
| Ed25519 permit + nonce replay protection | ticketing-poc key_registry.move + ticket.move::new_mint_permit |
| Enoki zkLogin + sponsored tx end-to-end | ticketing-poc full app, onlyfins-example-app |
| Walrus + Seal envelope encryption | sui-stack-messaging chat-app (DEK + AES-256-GCM) |
| Walrus writeBlob / readBlob with Signer | walrus-pocs sdk/src/write.ts + download.ts |
| Browser wallet Walrus upload (5-step) | ts-sdks/packages/walrus/examples/write-from-wallet, relay.wal.app |
| useSealSession + useSealDecrypt React hooks | walrus-pocs walrus-seal/app/src/hooks/* |
| Custom indexer (Rust) | sui examples/custom-indexer |
| Nautilus TEE + Move attestation verification | nautilus template repo + sui-stack/nautilus docs |
| Display standard (wallet/explorer rendering) | ticketing-poc move/sources/display.move |
