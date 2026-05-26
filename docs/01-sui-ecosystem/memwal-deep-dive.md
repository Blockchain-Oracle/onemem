---
purpose: Synthesis of MemWal architecture from DEEP_DIVE.md §1 + live source inspection.
sources:
  - DEEP_DIVE.md §1 (this folder's parent at /Users/abu/dev/hackathon/sui-overflow/research/sui-overflow-2026/ideas/.greenfield/memwal-cross-tool-mcp/DEEP_DIVE.md)
  - Live: /tmp/sui-research/MemWal (HEAD ~67fe70b on dev branch, 2026-05-23)
  - https://github.com/MystenLabs/MemWal
  - https://docs.memwal.ai, https://memwal.ai, https://staging.memwal.ai
verified: 2026-05-23
---

# MemWal Deep Dive (the layer OneMem wraps)

MemWal is Mysten's privacy-first AI memory primitive. Live on Sui mainnet (relayer.memwal.ai). The competitive landscape OneMem plays alongside — OneMem does NOT replace MemWal; OneMem adds the verifiable audit-and-trace layer MemWal does NOT ship.

## Top-level tree (cloned 2026-05-23)

```
MemWal/
├── apps/
│   ├── app/           # memwal.ai dashboard (Vite + React 19 + dapp-kit + Enoki + react-three-fiber)
│   │                  # 5 pages: LandingPage (257L), Dashboard (849L), SetupWizard (584L),
│   │                  # Playground (1091L), ConnectMcp (545L) — total 3326L of dashboard code
│   ├── chatbot/       # Next.js chatbot — MemWal as memory layer
│   ├── noter/         # zkLogin-authenticated AI assistant (note-taking)
│   └── researcher/    # Long-running research agent demo
├── docs/              # docs.memwal.ai source (VitePress)
├── packages/
│   ├── sdk/                       # @mysten-incubation/memwal — primary TS SDK
│   ├── python-sdk-memwal/         # Python SDK
│   ├── mcp/                       # @mysten-incubation/memwal-mcp — stdio MCP server
│   └── openclaw-memory-memwal/    # @mysten-incubation/oc-memwal — OpenClaw plugin
├── services/
│   ├── contract/      # Move package — services/contract/sources/account.move (~660 lines)
│   ├── indexer/       # Rust Sui-event indexer (single main.rs)
│   └── server/        # Rust relayer (Axum) — Postgres+pgvector for metadata,
│                      # Walrus for encrypted blobs, LoCoMo+LongMemEval benchmarks
└── scripts/
```

## The Move contract — `services/contract/sources/account.move`

**Module:** `memwal::account` — single module, edition 2024, no external deps, ~660 lines.

**Key types:**
- `AccountRegistry has key` — shared object, `accounts: Table<address, ID>` deduplication index.
- `MemWalAccount has key, store` — owner address + `vector<DelegateKey>` (max 20) + `active: bool` + `created_at`.
- `DelegateKey has store, copy, drop` — 32-byte Ed25519 pubkey + derived Sui address + label + created_at.

**Versioning:** Both registry + account carry a `version: u64` stored as a dynamic field on UID (`VERSION_DF_KEY = b"version"`). Current `VERSION = 2`. Every mutating entry function gates on `assert_object_version(&obj.id)`. Migration paths:
- `migrate_account(account)` — owner self-migrates.
- `admin_migrate_account(cap, account)` — UpgradeCap-holder batch-migrates.
- `migrate_registry(cap, registry)` — admin migrates the shared registry.

**`seal_approve` policy** (lines 531-551):
```move
entry fun seal_approve(
    id: vector<u8>,
    account: &MemWalAccount,
    ctx: &TxContext,
) {
    assert_object_version(&account.id);
    assert!(account.active, EAccountDeactivated);
    let caller = ctx.sender();
    let owner_bytes = sui::bcs::to_bytes(&account.owner);
    let is_owner    = (caller == account.owner) && has_suffix(&id, &owner_bytes);
    let is_delegate = is_delegate_address(account, caller);
    assert!(is_owner || is_delegate, ENoAccess);
}
```

Helper `seal_key_id(owner) = bcs::to_bytes(owner)` — clients use this to compute the Seal id.

**Events emitted:**
- `AccountCreated` — account_id + owner.
- `DelegateKeyAdded` / `DelegateKeyRemoved` — account_id + pubkey + label.
- `AccountDeactivated` / `AccountReactivated` — admin lifecycle.
- `AccountMigrated` — version bump.

**Critical gap (OneMem's wedge):**
- NO `MemoryWritten` event.
- NO `ObservationCommitted` event.
- NO `AgentActionAttested` event.
- NO per-blob ACL.
- NO audit-log object type.
- NO agent-id binding on individual memories (delegate keys are account-wide, not per-memory).

The on-chain commitment is ONLY the account + delegate keys. Everything else (memory writes, recall queries, fact extractions) lives on the relayer's Postgres + Walrus blobs, NOT on Sui events. This is the unguarded surface.

## The four shipped apps

### `apps/app/` — the dashboard (memwal.ai)

3326 lines of dashboard code split across 5 pages:
- **LandingPage.tsx** (257L) — marketing + react-three-fiber visuals.
- **Dashboard.tsx** (849L) — delegate-key CRUD (`generateDelegateKey`, `addDelegateKey`, `removeDelegateKey`), copy-key UI, syntax-highlighted `MemWal.create({...})` snippets. **MAX_DELEGATE_KEYS=20** (matches the contract).
- **SetupWizard.tsx** (584L) — onboarding flow.
- **Playground.tsx** (1091L) — try `remember`, `analyze`, `recall` interactively.
- **ConnectMcp.tsx** (545L) — wires the MCP server into Cursor / Claude Desktop / Claude Code / Antigravity / Codex.

Tech: `@mysten/dapp-kit`, `@mysten/enoki` (zkLogin), `@mysten/seal`, `@mysten/walrus`, react-three-fiber, lucide-react.

**What it IS:** credentials portal + setup wizard + playground.
**What it is NOT:** memory-content viewer. NO timeline. NO "what's in my memory across time." NO audit trail. NO cross-runtime view. NO trace replay.

→ This is the gap OneMem fills.

### `apps/chatbot/` — Next.js chatbot

Reference for `withMemWal(model, {...})` Vercel AI SDK middleware. Shows how MemWal slots into a real LLM chat app with auto-recall on user turn + auto-save on assistant turn.

### `apps/noter/` — zkLogin-authenticated AI assistant

Reference for zkLogin onboarding + persistent memory across sessions. OneMem's dashboard can model auth flow on this.

### `apps/researcher/` — long-running research agent

Multi-turn research workflow with persistent memory. Reference for "agent has worked on this topic for days" patterns. Useful prior art for showing OneMem tracking agent decisions across long contexts.

## SDK surface

### `packages/sdk/` (`@mysten-incubation/memwal`)

API: `remember`, `rememberAndWait`, `recall`, `analyze`, `analyzeAndWait`, `restore`, `health`, `embed`, `rememberManual`, `recallManual` + job-status polling.

`RecallOptions = { topK, maxDistance, namespace }`. Distance is L2 from a server-side embedder; `< 0.25` = near-duplicate, `< 0.7` = "use only this filter."

Compatibility contract checked in `compatibility.ts` — server returns `minSupportedSdk` per language. Production-grade rigor.

### `packages/mcp/` (`@mysten-incubation/memwal-mcp`)

Stdio MCP server. Tools: `memwal_login`, `memwal_logout`, `memwal_remember`, `memwal_recall`, `memwal_analyze`, `memwal_restore`. Browser-based wallet login; creds cached at `~/.memwal/credentials.json`.

**Implication:** Mysten owns the "use MemWal from any MCP-capable tool" lane. OneMem should NOT compete here — instead, OneMem can listen on the MCP transport and emit OneMem attestations when MCP tools fire memory ops.

### `packages/openclaw-memory-memwal/` (`@mysten-incubation/oc-memwal`)

OpenClaw memory plugin. Two hooks (`before_prompt_build` for recall, `agent_end` for capture). Production-grade — Zod schema validation, env-var resolution, retry wrapping, prompt-injection detection on read AND write, namespace isolation via session key parsing (`agent:<name>:<uuid>`).

**Implication:** The OpenClaw lane is owned. OneMem's coverage angle is anything BUT OpenClaw (Claude Code, Codex, Gemini, Hermes, custom agents).

## Relayer architecture (`services/server/`)

- Rust / Axum.
- Postgres + pgvector for vector metadata.
- Walrus for encrypted blob storage (via Seal envelope encryption).
- Sui events for account/delegate-key changes only.
- Benchmarks against LoCoMo + LongMemEval datasets — competing head-on with Mem0 quality.
- Endpoints: `https://relayer.memwal.ai` (mainnet), `https://relayer.staging.memwal.ai` (testnet), `https://relayer.dev.memwal.ai` (dev).
- Open PRs: **Nautilus TEE deployment** (MEM-51 — relayer-in-TEE), replay-protection nonces, configurable embedding provider/model/dims, Anthropic compatibility for middleware, k6 stress tests, MEM-31 relayer observability (Langfuse-style tracing).

## Active development signals (PRs / branches as of 2026-05-23)

- 100+ branches, 11 open PRs.
- Recent merges (last 7 days): `MEM-62 workshop friction fixes` (TODAY), `MEM-59 extract.v5 granularity-aware dedup`, `MEM-57 pre-extraction dedup`, `MEM-54 per-fact importance`, `MEM-46 dashboard delegate-key import refinement`, `MEM-51 Nautilus TEE relayer template`, `MEM-30 k6 stress tests`.
- Branches worth flagging: `feature/rename-delegate-to-agent-id` (signals an "agent-first" rename incoming — OneMem should adopt the same `agent_id` term to stay aligned), `feature/mem-31-add-relayer-observability-tracing-monitoring-and-apm` (internal observability, not user-facing).

## What's missing (OneMem's lane)

1. **Audit ledger** — no on-chain `MemoryCommit` / `AgentActionAttested` event type. The entire memory write history lives on Postgres rows the relayer controls. Trustless verification requires OneMem.
2. **Trace events** — no per-tool-call commitment. Agent actions (which tool was called, with what arguments, producing which output) are invisible on chain.
3. **Cross-runtime viewer** — the dashboard is single-runtime (MemWal SDK only). It cannot show "all memories my agents wrote across Claude Code + Codex + custom agents." OneMem's audit ledger naturally aggregates across runtimes (any agent that hits OneMem appears in the timeline).
4. **Memory-content timeline view** — the dashboard shows account state, not memory state. There is no UI for "what was added today, what was deleted, what was recalled."
5. **Light-client verifiability** — even the events MemWal DOES emit (account / delegate-key changes) use `event::emit`, not `event::emit_authenticated`. OneMem can offer a strict superset by emitting `emit_authenticated` for both account-level AND memory-level events.
6. **Per-blob ACL / fine-grained access control** — MemWal's `seal_approve` is account-wide. OneMem can offer per-trace-blob policies (e.g. "only this agent can decrypt traces it wrote") for stronger compartmentalization.

## OneMem ↔ MemWal compatibility

OneMem should:
- Reuse MemWal's `DelegateKey` shape (32-byte Ed25519 + derived Sui address + label) so the same agent key works for both systems.
- Reuse the `account:account_id` Seal namespace convention.
- Accept MemWal account IDs as input — OneMem wraps MemWal accounts rather than replacing them.
- Emit OneMem-native authenticated events on every MemWal SDK call when wired in as middleware / interceptor.
- Provide a "MemWal-mode" where every `remember` / `analyze` / `recall` on the MemWal SDK auto-fires an OneMem commit.

This positions OneMem as the **verifiable audit + cross-runtime trace layer**, not a MemWal competitor — Mysten owns the memory primitive, OneMem owns the verifiability + observability around it.
