# MemWal (Mysten Incubation) — Inspiration + Foundation Pack

**Source-of-truth files** (read these for full depth):
- `../../../DEEP_DIVE.md` §1 — full MemWal repo source audit (4 packages + 4 apps + 3 services + contract)
- `../../../DEEP_DIVE.md` §2 — `@mysten-incubation/oc-memwal` teardown (manifest + hooks + APIs)
- `../../../refs/sdk-snippets.md` — paste-ready code snippets

This README distills how OneMem uses MemWal as the storage + memory primitive layer, and what we ADD on top.

---

## What MemWal is (one paragraph)

Mysten's official agentic-memory product, beta. Active development on `dev` branch (last commit ~6 hours before this research). Ships as:
- **`@mysten-incubation/memwal`** — TypeScript SDK (primary)
- **`@mysten-incubation/memwal-mcp`** — stdio MCP server for Cursor / Claude Desktop / Claude Code / Antigravity / Codex
- **`@mysten-incubation/oc-memwal`** — production-grade OpenClaw memory plugin (4 Mysten engineers, 15 versions, prompt-injection defense, Zod validation)
- **`python-sdk-memwal`** — Python SDK
- **`services/server`** — Rust relayer (Postgres for vector metadata, Walrus for encrypted blobs); benchmarks against LoCoMo + LongMemEval (head-to-head vs Mem0)
- **`services/indexer`** — Rust Sui event indexer
- **`services/contract/account.move`** — Move package: `AccountRegistry`, `MemWalAccount`, `DelegateKey`, Seal access policy
- **`apps/app`** — memwal.ai dashboard (3,326 lines, credentials/setup focus)
- **`apps/chatbot`** — Next.js chatbot reference
- **`apps/noter`** — zkLogin AI assistant reference
- **`apps/researcher`** — long-running research agent reference

---

## How OneMem uses MemWal

### As the storage primitive
- All memory writes go through `MemWal.create({key, accountId, serverUrl, namespace})` → `remember()` / `analyze()`
- All memory reads go through `recall({topK, maxDistance, namespace})`
- Encryption can be relayer-handled (default) OR client-side via `MemWalManual` + the `/manual` flow
- **OneMem uses the `/manual` flow** so the relayer never sees plaintext — that's load-bearing for the trust-model pitch

### As the foundation contract pattern
`services/contract/account.move` defines `MemWalAccount + DelegateKey + seal_approve` — we use this verbatim as the per-user account primitive. Our additions go on top: `MemoryNamespace` (groups related memories), `TraceSession` (per-agent session), `ActionCall` (per-tool-call attestation).

### As the OpenClaw integration
Our OpenClaw plugin uses `@mysten-incubation/oc-memwal` as its storage adapter (NOT a fork; a dependency). We add trace capture + dashboard sync on top. Same engineering quality, more features.

---

## What MemWal already has (so we don't reinvent)

### TypeScript SDK API surface (`@mysten-incubation/memwal`)
```ts
import { MemWal, MemWalManual, withMemWal } from "@mysten-incubation/memwal";

// Server-handled encryption (default)
const memwal = MemWal.create({
  key: env.MEMWAL_PRIVATE_KEY,
  accountId: env.MEMWAL_ACCOUNT_ID,
  serverUrl: "https://relayer.memwal.ai",
  namespace: "my-app",
});

await memwal.remember("User prefers dark mode");
await memwal.rememberAndWait("Project uses pnpm");  // blocks until indexed
const { results } = await memwal.recall("user preferences", { topK: 5, maxDistance: 0.7 });
await memwal.analyze("Long conversation text...");  // server-side fact extraction
const { health } = await memwal.health();

// Manual mode (client-side encryption — what OneMem uses)
const manual = MemWalManual.create({ key, accountId, serverUrl, namespace });
await manual.rememberManual({ blob, embedding });  // we own encryption
const { results } = await manual.recallManual({ queryEmbedding, topK });

// Vercel AI SDK middleware (we wrap this)
import { openai } from "@ai-sdk/openai";
const model = withMemWal(openai("gpt-4o"), {
  key, accountId, serverUrl, namespace,
  maxMemories: 5, minRelevance: 0.3,
});
```

### Python SDK
PR #179 (May 21) fixed GET signing parity with TS. Same API surface.

### MCP server tools
`memwal_login`, `memwal_logout`, `memwal_remember`, `memwal_recall`, `memwal_analyze`, `memwal_restore`. Browser-based wallet login with creds at `~/.memwal/credentials.json`.

### OpenClaw plugin (`@mysten-incubation/oc-memwal`)
Hook contract:
| Hook | Action |
|---|---|
| `before_prompt_build` | `client.recall(prompt, max, ns)` → filter by `(1-distance) >= minRelevance` → drop injection-flagged → prepend context + namespace system instruction |
| `agent_end` | `extractMessageTexts(messages, captureMaxMessages)` → filter `shouldCapture` → numbered concat → `client.analyze(text, ns)` |

Plus `api.registerTool` for `memory_search` + `memory_store`, `api.registerCli` for `openclaw memwal search/stats/login`, `api.registerService` for health-check on startup.

### MemWal contract (`services/contract/sources/account.move`)
- `AccountRegistry` (shared, dedup index)
- `MemWalAccount { owner, vector<DelegateKey>, active, version }`
- `DelegateKey { pubkey (Ed25519), sui_address, label, created_at }`
- `seal_approve` policy: owner OR delegate-key holder can decrypt
- Events: `AccountCreated`, `DelegateKeyAdded/Removed`, `AccountDeactivated/Reactivated`, `AccountMigrated`
- VERSION = 2; sophisticated upgrade path via dynamic field

### Dashboard (`apps/app`)
3,326 lines of React + Vite + dapp-kit + Enoki + Seal + Walrus + react-three-fiber:
- `LandingPage.tsx` (257)
- `Dashboard.tsx` (849) — delegate-key CRUD, copy-key UI, code snippets for `MemWal.create({...})`, MAX_DELEGATE_KEYS=20
- `SetupWizard.tsx` (584) — onboarding flow
- `Playground.tsx` (1,091) — interactive remember/recall sandbox
- `ConnectMcp.tsx` (545) — MCP setup helper

**Focus: credentials + setup + playground.** NOT a memory-content viewer. Gap = what OneMem fills.

### Reference apps (the clone targets)
- `apps/chatbot` — Next.js + Vercel AI SDK + `withMemWal()` middleware
- `apps/noter` — zkLogin auth + AI note-taking with persistent memory
- `apps/researcher` — long-running research agent reference

### Compatibility contract
`compatibility.ts` exposes `minSupportedSdk` per language — server rejects outdated SDK clients with a clear error. Strong production signal.

---

## What MemWal does NOT have (the gaps OneMem fills)

### On the contract side
- ❌ No per-blob ACL (only namespace-level via Seal policy)
- ❌ No audit-log object / `ObservationCommitted` event
- ❌ No Merkle root tracking
- ❌ No agent-id binding on writes
- ❌ No `TraceSession` / `ActionCall` types
- ❌ No NFT-gated namespace sharing (capability transfer)

→ OneMem's contract adds: `MemoryNamespace`, `TraceSession`, `ActionCall` / `AgentActionAttestation`, capability-based namespace sharing.

### On the dashboard side
- ❌ No memory-content viewer (only key management)
- ❌ No timeline / chronological view
- ❌ No cross-runtime view (which runtime wrote which memory)
- ❌ No trace tree view (`/trace/[id]`)
- ❌ No replay tool
- ❌ No share/revoke UI

→ OneMem's dashboard adds: `/memories` (content view), `/apps` (per-runtime view), `/trace/[id]` (trace tree), `/share` (capability mint), `/audit` drawer.

### On the integration side
- ✅ MemWal has: TS SDK, Python SDK, MCP server, OpenClaw plugin, Vercel AI middleware
- ❌ MemWal lacks: Claude Code native plugin, Hermes Agent provider, LangChain/LangGraph/CrewAI/AutoGen providers, voice agent (LiveKit/ElevenLabs/Pipecat) providers

→ OneMem ships these as a thin layer over MemWal SDKs.

### On the runtime side
- ✅ Nautilus-TEE relayer in flight (open PR + new template) — we plan to be FIRST product to use it (Day 23+ stretch)
- Branch `feature/rename-delegate-to-agent-id` signals "agent-first" framing pivot — we use `agent_id` naming in our Move struct to match

---

## What we LITERALLY ship that MemWal doesn't

Concrete delta:

```
OneMem
├── @onemem/claude-code-plugin       # MemWal lacks this
├── @onemem/hermes-provider (PyPI)   # MemWal lacks this
├── @onemem/openclaw-plugin          # USES @mysten-incubation/oc-memwal underneath; adds trace
├── @onemem/vercel-ai-provider       # Wraps withMemWal + adds trace emit
├── @onemem/langchain                # Provider for LangChain
├── @onemem/langgraph                # Provider for LangGraph
├── @onemem/crewai                   # Provider for CrewAI
├── @onemem/autogen                  # Provider for AutoGen
├── @onemem/openai-agents            # Function tools for OpenAI Agents SDK
├── @onemem/livekit                  # Voice agent provider
├── @onemem/elevenlabs               # Voice agent provider
├── @onemem/pipecat                  # Voice agent provider
├── @onemem/mastra                   # Mastra provider
├── @onemem/sdk-ts                   # Core TS SDK (wraps memwal + trace)
├── @onemem/sdk-python               # Core Python SDK (wraps memwal-python + trace)
├── @onemem/dashboard                # Next.js cross-runtime viewer
└── onemem-contracts                 # Move package: MemoryNamespace + TraceSession + ActionCall
```

Reuse: every package above DEPENDS on `@mysten-incubation/memwal` (or python equivalent) for the storage primitive. We're a layer, not a replacement.

---

## Repo layout (recap)

```
MystenLabs/MemWal/
├── apps/{app, chatbot, noter, researcher}
├── docs/                                 # docs.memwal.ai source (VitePress)
├── packages/{mcp, openclaw-memory-memwal, python-sdk-memwal, sdk}
└── services/{contract, indexer, server}
```

100+ branches. ~11 open PRs. Recent merges: TEE-isolated relayer (Nautilus), MEM-19/21 security hardening, replay-protection nonces, native Rust SDK to replace Node sidecar, configurable embedding provider/model/dimensions, Anthropic compat for middleware, k6 stress tests, dashboard delegate-key import refinement.

---

## Sources

- GitHub: https://github.com/MystenLabs/MemWal (23 ⭐ at time of research — beta)
- Docs: https://docs.memwal.ai
- LLM-friendly spec: https://docs.memwal.ai/llms.txt
- npm: https://www.npmjs.com/package/@mysten-incubation/memwal
- npm OC plugin: https://www.npmjs.com/package/@mysten-incubation/oc-memwal
- Mainnet relayer: `https://relayer.memwal.ai`
- Staging: `https://relayer.staging.memwal.ai`
