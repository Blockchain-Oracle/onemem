# OneMem Product Inventory — 12 Pillars (Frozen)

This is the canonical inventory. **Frozen 2026-05-26.** Every architecture doc references back to this file. If a feature isn't listed here, it's not in v0.1 scope — add it explicitly with a sub-task or push to v0.2.

---

## The 12 pillars at a glance

| # | Pillar | v0.1 scope | v0.2+ scope | Design doc(s) |
|---|---|---|---|---|
| 1 | Move protocol | `MemoryNamespace`, `TraceSession`, `ActionCall` Move structs + capability transfer + `event::emit_authenticated` events | More taxonomy enum variants, marketplace primitives, reputation registry | `01-protocol/` |
| 2 | Core SDKs (TS + Python) | Both languages, full memory + trace API, wraps `@mysten-incubation/memwal` | More LLM providers for compression, more vector stores | `02-sdks/` |
| 3 | Per-runtime native plugins | Claude Code (native+MCP), OpenClaw (uses `oc-memwal`), Hermes (PyPI standalone), Codex (MCP), Cursor/Windsurf/OpenCode/Cline/VS Code Copilot/Antigravity (via MCP server) | Codex native plugin, Antigravity native plugin (once SDK stable), Hermes feature parity expansion | `03-runtimes/` |
| 4 | Framework provider SDKs | Vercel AI SDK, OpenAI Agents SDK, CrewAI, LiveKit, **ElevenLabs** (both voice at v0.1) | LangChain, LangGraph, AutoGen, LlamaIndex, Google ADK, Pipecat, Mastra, Agno | `04-frameworks/` |
| 5 | CLI (`onemem`) | Both Node (`@onemem/cli`) + Python (`onemem-cli`); login/init/dashboard/namespace/search/trace/replay/verify/stats | Self-host helpers, multi-account, scripting subcommands | `05-cli/` |
| 6 | MCP server (`@onemem/mcp`) | stdio MCP serving 8 tools (add/search/get/update/delete/replay/verify/share) | Tool expansion as new features ship | `03-runtimes/mcp-server.md` |
| 7 | Local Dashboard | Next.js 14 + Tailwind + shadcn + Radix Themes + dapp-kit on `localhost:4040`; 7 routes + SSE live updates | More analytics, agent leaderboards, memory marketplace UI | `06-dashboard/` |
| 8 | Hosted Dashboard | `app.onemem.ai` (same codebase + Enoki/zkLogin + sponsored-tx) + Walrus Sites mirror | Team workspaces, billing, RBAC UI | `06-dashboard/hosted-deploy.md` |
| 9 | Marketing Landing | `onemem.ai` — hero + 5-min demo + integration installs + comparison + v0.2 vision teaser | Blog, case studies, customer logos | `07-marketing-and-docs/landing-architecture.md` |
| 10 | Docs Site | `docs.onemem.ai` Mintlify — 5 must-have pages at v0.1 (Get Started, Concepts, Verify-a-trace, API Reference, Integrations index) | Full reference docs, cookbook, video tutorials | `07-marketing-and-docs/docs-architecture.md` |
| 11 | Demo apps / e2e tests | 4 demos: switch-laptops, agent-sends-money, verifiable-research-agent, multi-agent-coordination | More demos per framework | `08-demos-and-tests/` |
| 12 | Nautilus TEE relayer | (Stretch, Day 23+) be FIRST product to use Mysten's Nautilus-TEE relayer template | Production TEE deployment | `09-stretch/nautilus-tee-relayer.md` |

---

## Per-pillar detail (frozen scopes)

### Pillar 1 — Move protocol
**What:** the on-chain layer. Sui Move package deployed to mainnet by Day 2.

**v0.1 includes:**
- `MemoryNamespace { id, owner, name, viewer_caps, namespace_kind, version }` — memory grouping + access control
- `TraceSession { id, namespace_id, agent_id, started_at, root_call_id, merkle_root, environment, version }` — per-agent session
- `ActionCall { id, session_id, tool_name, walrus_input_blob, walrus_output_blob, parent_call_id, captured_at, content_hash, prev_hash, level, status, events }` — per-tool-call attestation, Merkle-chained
- `NamespaceCapability` — transferable cap for sharing memory access
- Uses `event::emit_authenticated` for light-client-verifiable Merkle chain (first-mover signal)
- Version-as-dynamic-field upgrade strategy (lifted from MemWal `account.move`)
- Seal `seal_approve` policy for blob decryption gating

**v0.2+ defer:**
- Reputation registry (per-agent action history scoring)
- Memory marketplace primitives (namespaces as tradeable Sui objects)
- ERC-8004 bridge structs

### Pillar 2 — Core SDKs (TypeScript + Python)
**What:** the libraries every plugin + provider + CLI + dashboard uses.

**v0.1 includes:**
- `@onemem/sdk-ts` — TypeScript SDK wrapping `@mysten-incubation/memwal`, exposes namespace ops + trace emit + Mem0-style memory API
- `onemem-sdk-python` — Python SDK wrapping `mysten-incubation-memwal-python`, same shape as TS
- Both use the `/manual` Seal flow (we own client-side encryption; relayer never sees plaintext)
- Compatibility contract (versioning, min-supported-SDK pattern)
- Browser-based wallet login + `~/.onemem/credentials.json` (mirrors MemWal MCP pattern)

**v0.2+ defer:**
- More LLM providers for compression
- More vector stores for the relayer-side embedding
- Multi-modal (images, PDFs)

### Pillar 3 — Per-runtime native plugins
**What:** the integration layer per AI coding agent runtime. Coexists with `claude-mem` + `oc-memwal` + Mem0; doesn't replace.

**v0.1 includes:**
- **Claude Code native plugin + MCP** (`@onemem/claude-code-plugin`) — `.claude-plugin/plugin.json` + hooks.json mirroring claude-mem's contract; coexists with claude-mem
- **OpenClaw native plugin** (`@onemem/oc-onemem`) — `openclaw.plugins.slots.memory = 'onemem'`; uses `@mysten-incubation/oc-memwal` underneath as the storage adapter; adds trace + dashboard sync
- **Hermes Agent plugin** (`hermes-onemem` PyPI standalone) — implements `MemoryProvider` ABC; uses `on_delegation` for cross-runtime trace composition
- **Codex CLI via MCP** (`@onemem/mcp` consumed via `~/.codex/config.toml`)
- **Cursor / Windsurf / OpenCode / Cline / VS Code Copilot / Antigravity** — all consume `@onemem/mcp`

**v0.2+ defer:**
- Codex native plugin (`.codex-plugin/plugin.json` + hooks)
- Antigravity native plugin (once Google ships stable Antigravity plugin SDK)
- Per-runtime expanded feature parity

### Pillar 4 — Framework provider SDKs
**What:** Mem0-style 1-line provider config for every framework users build AI apps with.

**v0.1 includes (5 providers):**
- **Vercel AI SDK** — `withOneMem(model, opts)` middleware (wraps the MemWal middleware + emits ActionCall)
- **OpenAI Agents SDK** — `save_memory` + `search_memory` function tools
- **CrewAI** — `memory_config={"provider": "onemem", "config": {...}}`
- **LiveKit** — `OneMemMemory` voice agent subclass
- **ElevenLabs** — `OneMemMemory` voice agent provider (same subclass pattern as LiveKit; ship together)

**v0.2+ defer:**
- LangChain, LangGraph, AutoGen, LlamaIndex, Google ADK, Pipecat, Mastra, Agno

### Pillar 5 — CLI (`onemem`)
**What:** the developer command-line for OneMem. Both Node + Python implementations, identical command surface.

**v0.1 includes:**
- `onemem login` — browser-based wallet login → `~/.onemem/credentials.json`
- `onemem init` — mint MemWalAccount on Sui + create initial namespace
- `onemem dashboard` — launch local dashboard at `localhost:4040`
- `onemem namespace create|share|revoke|list`
- `onemem search <query>` — semantic recall
- `onemem trace <session-id>` — render trace tree in terminal
- `onemem replay <session-id>` — reconstruct session from chain
- `onemem verify <tx-or-blob>` — verify Merkle chain or Walrus blob
- `onemem stats` — namespace counts, usage stats
- `onemem install --runtime <id>` — install OneMem plugin for a specific runtime (mirrors claude-mem's pattern)

**v0.2+ defer:**
- Self-host helpers (`onemem relayer up`)
- Multi-account / multi-org switching
- Scripting subcommands (batch operations)

### Pillar 6 — MCP server (`@onemem/mcp`)
**What:** stdio MCP server consumed by any MCP-capable runtime.

**v0.1 tools:**
- `add_memory(text, namespace, metadata)`
- `search_memory(query, namespace, limit)`
- `get_memory(memory_id)`
- `update_memory(memory_id, text)`
- `delete_memory(memory_id)`
- `replay_session(session_id)` — returns reconstructed trace tree
- `verify_trace(session_id)` — walks Merkle chain, returns verification status
- `share_namespace(namespace_id, recipient_address)` — mints capability + transfers
- `trace_session(session_id, fields?)` — returns trace tree (optionally filtered)

**v0.2+ defer:**
- More tools as features ship

### Pillar 7 — Local Dashboard
**What:** Next.js 14 + Tailwind + shadcn + Radix Themes + `@mysten/dapp-kit-react`, serving on `localhost:4040`. Bundled with `@onemem/dashboard`; launched by `onemem dashboard`.

**v0.1 routes:**
- `/` — overview: stats, recent activity, connected runtimes
- `/memories` — list + search + filter + per-app provenance column (lifted from OpenMemory pattern)
- `/apps` — per-runtime monitor + per-runtime pause + permissions
- `/trace/[session_id]` — **headline view**: tree + Gantt + collapsible nodes + Verify drawer + Replay modal
- `/sessions/[session_id]` — multi-trace session replay
- `/share/[capability-id]` — NFT-gated namespace mint UX
- `/settings` — delegate keys, providers, runtimes

**v0.1 data flow:** SSE stream (event types `connected | initial_load | new_action_call | new_trace_session | new_attestation | processing_status`); REST API at `/api/*` mirrored from claude-mem's 62-endpoint pattern (subset; we don't need all 62 at v0.1).

**v0.1 brand:**
- Surface: cream `#FAF8F5`
- Primary accent: lavender `#B08FFF`
- Verify-only accent: chartreuse `#D4FF5E` (reserved exclusively for Verify affordances — "verification turns the page green")
- Sui ecosystem links: Sui blue `#0090FF` (reserved exclusively for Suiscan + ecosystem links)
- Type: General Sans / Ratch (display), Inter (body), JetBrains Mono (code)

**v0.2+ defer:**
- Analytics deep-dive views
- Agent leaderboards
- Marketplace UI

### Pillar 8 — Hosted Dashboard
**What:** same Next.js codebase as local, deployed at `app.onemem.ai` with Enoki/zkLogin + sponsored-tx + a Walrus Sites mirror for decentralized fallback.

**v0.1 includes:**
- Same routes as local
- Enoki-managed zkLogin auth (Google OAuth)
- Sponsored-tx for namespace mints + capability transfers (gasless UX)
- Walrus Sites mirror deploy (decentralized fallback)

**v0.2+ defer:**
- Team workspaces
- Billing
- RBAC UI
- SAML / SSO

### Pillar 9 — Marketing Landing (`onemem.ai`)
**What:** the marketing site. Next.js or Framer.

**v0.1 includes:**
- Hero ("Verifiable agent memory + trace, for every runtime")
- 5-minute demo video
- Integration installs (1-line for each v0.1 runtime/framework)
- Comparison vs Mem0 / claude-mem / Zep (honest, no FUD)
- v0.2+ vision teaser (reputation, marketplaces, ERC-8004)
- Brand applied per `BRAND_AND_SURFACES.md`

### Pillar 10 — Docs Site (`docs.onemem.ai`)
**What:** Mintlify (same stack as Mem0 + claude-mem).

**v0.1 must-have pages:**
1. **Get Started** (5-min) — install + first memory write + first trace verify
2. **Concepts** — Memory + Trace + Verifiability + Cross-runtime model
3. **Verify-a-trace tutorial** — walk through the "agent sent money" demo
4. **API Reference index** — SDK + MCP tools + CLI commands
5. **Integrations index** — per-runtime + per-framework setup guides

**v0.2+ defer:**
- Full reference depth (Mem0 has 218 pages; we ship ~30-40 at v0.1)
- Cookbook
- Video tutorials

### Pillar 11 — Demo apps / e2e tests
**What:** the 4 demos that exercise the full stack end-to-end. Drive the demo video.

1. **Switch laptops mid-project** — Claude Code on Laptop A writes memory; Hermes on Laptop B reads it (memory follows)
2. **Agent sends money** — agent uses wallet skill via MCP; trace + verify flow shows every step on chain
3. **Verifiable research agent** — long-running agent with persistent memory + replayable audit
4. **Multi-agent coordination** — Hermes spawns sub-agents via `on_delegation`; traces compose into one tree in the dashboard

### Pillar 12 — Nautilus TEE relayer (stretch)
**What:** Day 23+ stretch goal. Be the FIRST product to use Mysten's Nautilus-TEE relayer template.

**v0.1 (stretch) includes:**
- Deploy OneMem's MemWal-compatible relayer inside Nautilus TEE
- On-chain PCR registration so the dashboard can verify "this relayer is TEE-attested"
- Documentation: "our memory + trace is Seal-encrypted AND hash-chained AND the relayer is TEE-attested"

**Out of scope at v0.1:** production TEE deployment with full SLA.

---

## What's explicitly NOT in v0.1

To prevent scope creep mid-build, list of features we are **NOT** shipping at v0.1 (each is justified):

| Feature | Why deferred |
|---|---|
| Multi-modal (image, PDF) memory | Mem0 has it; not blocking Walrus track; v0.2 |
| Graph memory | Mem0 deprecated it April 2026; not needed |
| RBAC UI / team workspaces | Sui capability transfer handles sharing; dashboard UI for cap mgmt is v0.2 |
| Custom categories | SaaS dashboard table stakes; not load-bearing |
| Mobile native SDKs (iOS / Android / RN) | Out of scope for v0.1 |
| Browser extension | Future surface |
| Webhooks | We emit Sui events natively; dashboard subscribes via SSE |
| SOC 2 / HIPAA paperwork | Not relevant for hackathon judging |
| LangChain / LangGraph / AutoGen / LlamaIndex / Google ADK providers | v0.2; same provider pattern as Vercel AI / CrewAI; cheap to add later |
| Codex native plugin / Antigravity native plugin | v0.2; MCP transport sufficient for v0.1 |
| Reputation graphs / memory marketplaces / ERC-8004 bridge | v0.2+ vision; teased in landing page but not built |

---

## Lens check per pillar

Per `feedback_problem_statements_are_snapshots.md`: every pillar serves EITHER "survive the must-have filter" OR "make the sponsor go *oh that's the right next thing*."

| Pillar | Satisfies (must-have) | Surprises (recognize-as-right-next) |
|---|---|---|
| 1 Move protocol | Verifiable memory on Walrus | Merkle-chained `ActionCall` action ledger + `event::emit_authenticated` first-mover |
| 2 SDKs | "Integrations + tooling for devs to adopt Walrus/MemWal" | Mem0-ergonomic exactly — frictionless migration |
| 3 Runtimes | Cross-tool memory sharing | Native plugins per runtime (not just MCP) + cross-runtime trace composition |
| 4 Frameworks | Multi-agent coordination | `provider: "onemem"` 1-line ergonomic across 5 frameworks at v0.1 |
| 5 CLI | Dev tooling | `onemem replay <session-id>` + `onemem verify` — verifiability as CLI primitive |
| 6 MCP server | Cross-tool / cross-agent memory sharing | Same MCP server reaches every MCP-capable runtime; unified tool surface |
| 7 Local Dashboard | Interfaces to inspect/debug/manage agent memory | `/trace/[id]` headline route with Verify drawer + Replay modal — "verification turns the page green" |
| 8 Hosted Dashboard | "Persistent data and file access using Walrus" | Walrus Sites mirror = the dashboard is itself decentralized |
| 9 Marketing | (Marketing — pre-judging signal) | Lavender+chartreuse+cream brand sits in the Walrus/Sui visual family |
| 10 Docs | (Reduces barrier to adoption) | Verify-a-trace tutorial as a load-bearing page (nobody else has this) |
| 11 Demos | Working systems, not just demos | Cross-runtime + verifiable + replayable in one 5-min video |
| 12 Nautilus TEE | (Stretch — extra credit) | First product to use the new Mysten Nautilus relayer template |
