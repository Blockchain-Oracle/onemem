# OneMem — Goal Document

**Status:** crystallized from Abu's stated vision across the 2026-05-23 research session. This is the WHAT we're building. Architecture design (HOW) lives in `05-our-architecture/`.

**Working name:** OneMem (not locked — Receiptly / Driftwood / Memcite are alternates; naming is a later concern).

**Posture:** we build on top of every layer that already exists. We complement; we do not route around. Every incumbent in this folder is a layer we use, extend, or take ergonomic inspiration from — never a competitor we plan to defeat.

---

## What we're building (in one paragraph)

OneMem is the **verifiable, cross-runtime memory + execution-trace layer for AI agents**. Every memory write is an encrypted Walrus blob; every memory read is a Seal-gated decryption; every share is a Sui capability transfer; every agent action — every tool call, every MCP invocation, every skill execution — is captured as a Merkle-chained Sui object that any party can independently verify. We ship as 1-line `provider: "onemem"` configs for every framework Mem0 supports (Vercel AI SDK, LangChain, LangGraph, CrewAI, AutoGen, OpenAI Agents SDK, Pipecat, ElevenLabs, LiveKit, Mastra, Agno), as drop-in native plugins for every coding agent runtime (Claude Code, OpenClaw, Hermes Agent, Codex CLI, Cursor, Windsurf, Gemini CLI / Antigravity), and as a cross-runtime web dashboard that lets users inspect, replay, verify, and share what their agents remembered and did. Python + JS SDKs both mandatory.

---

## The four pillars

### Pillar 1 — Verifiable memory storage
- Encrypted Walrus blobs as the storage layer (multi-operator, content-addressed, erasure-coded)
- Seal threshold encryption — the relayer literally cannot decrypt without quorum
- Sui `MemoryNamespace` objects as the access-control + sharing primitive
- Cross-device sync without trusting a vendor

### Pillar 2 — Agent action trace + replay
*This is the end-user-value headline feature.*

Use cases (from Abu's examples):
- "I told my agent to **send money to a friend** — show me which wallet skill it used, which MCP, what amounts, what oracle data informed the decision"
- "I told my agent to **make a video** — show me which model, what prompts, what intermediate steps, what assets it generated"
- "I told my agent to **do research** — show me which sources it visited, what it stored to memory, how each piece informed the conclusion"

Every tool/skill/MCP call captured as a node in a `TraceSession` tree. Inputs + outputs + parent-child relationships. Merkle-chained `ActionCall` Sui objects (or unified with `AgentActionAttestation`). Replayable from chain. Shareable via Sui capability transfer.

### Pillar 3 — Cross-runtime + cross-framework integration
Ship into every runtime that exists. Same `provider: "onemem"` ergonomic as Mem0 wherever possible.

Coding-agent runtimes (drop-in native plugins):
- Claude Code (MCP + native plugin)
- OpenClaw (uses `@mysten-incubation/oc-memwal` underneath as the storage adapter; we add trace + dashboard layers on top)
- Hermes Agent (standalone PyPI `MemoryProvider` implementing the ABC)
- Codex CLI, Cursor, Windsurf, Gemini CLI / Antigravity (MCP transport at minimum)

AI app frameworks (provider SDKs):
- Vercel AI SDK (`withOneMem(model, opts)` middleware)
- LangChain / LangGraph
- CrewAI (`memory_config={"provider": "onemem"}`)
- AutoGen, OpenAI Agents SDK, Google ADK
- Pipecat / ElevenLabs / LiveKit (voice agents)
- Mastra / Agno / LlamaIndex

SDK languages: **Python and JavaScript/TypeScript both required at v0.1.**

### Pillar 4 — Cross-runtime dashboard
A Next.js web app that surfaces what agents remembered + did, across every runtime they use.

Routes:
- `/` — overview: stats, recent activity, connected runtimes
- `/memories` — search + filter + per-app provenance column (which runtime wrote it)
- `/apps` — connected runtimes monitor, per-runtime pause, per-runtime permissions
- `/trace/[session_id]` — **the headline view**: step-by-step tree of tool/skill/MCP calls with inputs/outputs/timing; Verify drawer (Walrus blob ID + Seal envelope hash + Sui txid); Replay button
- `/share` — NFT-gated namespace mint + capability transfer
- `/settings` — delegate keys, providers, runtimes

The dashboard is where the verifiability becomes legible — Verify drawer, Replay button, on-chain share/revoke.

---

## What we explicitly complement (not compete with)

| Layer | What they do | How we build on it |
|---|---|---|
| **MemWal SDK** (`@mysten-incubation/memwal`) | TypeScript + Python SDK for Walrus-backed memory primitives | We use it as the storage primitive. OneMem's memory writes go through MemWal. |
| **`@mysten-incubation/oc-memwal`** | Production-grade OpenClaw memory plugin shipped by Mysten | Our OpenClaw plugin uses oc-memwal underneath as the storage adapter; we add the trace capture + cross-runtime dashboard on top. |
| **MemWal dashboard at memwal.ai** | Credentials + setup + delegate-key management | We're orthogonal — we render memory content + traces; they manage accounts. Users use both. |
| **claude-mem** (77.6k ⭐) | Best-in-class Claude Code memory with AST-aware compression + local viewer at `localhost:37777` | Our Claude Code plugin coexists. We add Walrus storage + Sui attestation + cross-runtime trace; claude-mem's viewer remains useful for the Claude-Code-only single-machine flow. |
| **Mem0** (56k ⭐, 30+ integrations) | The ergonomic + provider-pattern model for "memory layer for every framework" | We match Mem0's provider patterns exactly. Users get drop-in OneMem wherever they get drop-in Mem0; the difference is the underlying trust model. |
| **Hermes Agent** (NousResearch, 164k ⭐) | Agent runtime with native `MemoryProvider` ABC + plugin discovery | We ship `hermes-onemem` as a standalone PyPI package implementing the ABC. Drop-in like the bundled providers. |
| **Walrus** | Multi-operator decentralized blob storage on Sui | Storage layer for all encrypted payloads (memory blobs + trace blobs). |
| **Seal** | Identity-based threshold encryption with on-chain policies | Encryption layer; threshold-decrypted only with proper access. |
| **Sui Move** | Object-oriented programmable layer with PTBs | Ledger layer; `MemoryNamespace`, `TraceSession`, `ActionCall` are Sui objects with on-chain capability transfer. |
| **Nautilus** (TEE) | Verifiable offchain compute | Stretch goal Day 23+: TEE-attested relayer so even the relayer can't tamper. |
| **Enoki** | Managed zkLogin + sponsored-tx | Dashboard auth via Enoki; gasless namespace shares. |
| **Sui Stack Messaging** | E2EE messaging on Walrus + Seal | Optional integration if we add multi-agent coordination later. |
| **LangSmith / Langfuse / Phoenix** | Developer observability for LLM apps (trace viewers) | Architectural inspiration for our `/trace/[id]` view. Different persona (end-user vs developer), different trust model (vendor-trusted vs cryptographic). |
| **Zep / Letta / Honcho / Supermemory / etc.** | Various memory-layer products | Architectural references for taxonomies (short vs long term), retrieval patterns, multi-tenancy. We use them as inspiration; nothing forks. |
| **Talus / elizaOS / Theoriq / Olas** | Web3-native verifiable AI projects | Adjacent layer (agent runtime, agent identity). OneMem could be the memory + trace layer that agents on these platforms use. Complement. |

---

## What we are NOT

- ❌ **Not "Mem0 but decentralized."** We match Mem0's ergonomic — but our headline is verifiability + cross-runtime trace, not feature parity. Anyone benchmarking us against Mem0's 30+ integration count loses sight of the point.
- ❌ **Not a competitor to claude-mem.** Claude-mem's AST-aware compression + Claude Code optimization are great. Our plugin coexists; users can run both.
- ❌ **Not a wedge that depends on incumbents falling.** Every layer in the "complement" table above is a fixture we use. Mem0 not shipping Walrus storage is not our moat; our moat is the cross-runtime trace + verifiable replay layer that nobody else is shipping at all.
- ❌ **Not a developer observability tool.** LangSmith/Langfuse/Phoenix serve the developer building an AI app. OneMem serves the end-user OF AI agents. Different persona, different scoring system, different UX.
- ❌ **Not vapor.** Every Pillar maps to mainnet-live primitives today. The build is real, not theoretical.

---

## The future we're building (vision)

> Every AI agent you use — Claude Code on your laptop, an OpenClaw plugin running in the background, a Hermes agent orchestrating your tasks, a Pipecat voice agent on your phone, a CrewAI multi-agent workflow your team runs — writes to the same encrypted memory namespace on Walrus, and emits the same Merkle-chained trace to Sui. You can open one dashboard and see everything any of your agents remembered and did, across every runtime, with cryptographic proof. You can share a memory namespace with a teammate by transferring a Sui capability — and revoke it on-chain when the project ends. You can hand the trace of "what my agent did when it sent that payment" to a compliance officer, a regulator, or an arbitrator, and they can verify every step independently of you, of us, and of any vendor.
>
> Memory becomes portable, traces become verifiable, and the agents you use become accountable — to you, to your team, to whoever you choose to share them with — without ever trusting a single SaaS vendor with the plaintext or the truth.

---

## Sui Overflow 2026 framing

Target track: **Walrus** ($35K 1st place). Headline pitch maps verbatim to the Walrus problem statement: *"AI agents today are powerful, but still fundamentally stateless and fragmented. They complete tasks in isolation, lose context across sessions, and struggle to share knowledge across tools, teams, or workflows. Memory is often tied to a single app, model, or device — making agent systems brittle, hard to scale, and difficult to trust."* OneMem addresses every clause of that sentence — brittle (cross-runtime portability), scale (Walrus storage), trust (cryptographic verifiability).

Mainnet by August 27, 2026 = 100% prize upfront. All pillar dependencies are mainnet-live today (Sui, Walrus, Seal, MemWal beta relayer). 29-day build window starting from research approval.

---

## What changes here over time

This goal doc is FROZEN once approved. If the goal changes, write a new revision (`GOAL_v2.md`) — don't edit in place. The downstream architecture, build plan, and spec docs all reference this file by name; mutating it silently breaks the chain.

Cross-reference: `../README.md` for folder navigation. `../../WEDGE_V2.md` for current wedge framing. `../../../../CONTEXT.md` for Sui Overflow hackathon brief.
