# Reality Research: OneMem Product From Code

## Scope

Re-check OneMem's actual product from implementation, with Mem0 as the comparison point. Avoid README/landing-copy assumptions.

## Sources Checked

- Mem0 current site: https://mem0.ai/
- Context7 docs:
  - `/websites/mem0_ai`
  - `/mem0ai/mem0`
- `packages/sdk-ts/src/memory.ts`
- `packages/sdk-ts/src/runtime-memory.ts`
- `packages/sdk-ts/src/client.ts`
- `packages/sdk-ts/src/namespaces.ts`
- `packages/sdk-ts/src/traces.ts`
- `packages/sdk-ts/src/seal.ts`
- `packages/sdk-ts/src/walrus.ts`
- `contracts/onemem/sources/namespace.move`
- `contracts/onemem/sources/trace.move`
- `contracts/onemem/sources/seal_policy.move`
- `packages/mcp-server/src/index.ts`
- `packages/provider-vercel-ai/src/index.ts`
- `packages/provider-openai-agents/src/index.ts`
- `packages/provider-crewai/onemem_crewai/memory.py`
- `packages/sdk-python/onemem/memory.py`
- `packages/dashboard/lib/memory.ts`
- `packages/dashboard/app/memories/MemoriesView.tsx`
- `docs/03-target-runtimes/README.md`
- `docs/04-framework-providers/README.md`
- `packages/plugin-claude-code/package.json`
- `packages/plugin-codex/package.json`
- `packages/plugin-openclaw/package.json`
- `packages/plugin-hermes/pyproject.toml`
- `packages/provider-livekit/pyproject.toml`
- `packages/provider-elevenlabs/pyproject.toml`
- `packages/provider-crewai/pyproject.toml`

## Verified Facts

- Mem0 positions itself as persistent memory infrastructure for AI agents and apps: add memories, learn from interactions, retrieve relevant memories across sessions, and integrate with frameworks.
- Mem0's SDK/API model centers on memory operations such as `add` and `search`, scoped by users/agents/runs/sessions.
- OneMem's TS SDK exposes a "Mem0-mirror" memory surface through `MemoryAPI.add(text)` and `MemoryAPI.search(query)`.
- OneMem's `MemoryAPI` uses MemWal `/manual` for memory storage and recall.
- Memory writes are Seal-encrypted and stored as Walrus blobs through MemWal. Code comments explicitly state the relayer never sees plaintext.
- OneMem adds an optional on-chain ActionCall attestation for a memory write when the caller supplies a TraceSession, OneMem namespace, and RW capability.
- OneMem namespaces are Sui shared objects. The contract defines namespace kinds matching memory scoping: User, Agent, Org, Session, Shared.
- Access is represented as transferable Sui objects: `NamespaceCapability<ReadOnly>`, `NamespaceCapability<ReadWrite>`, and `NamespaceCapability<Admin>`.
- `ReadOnly` caps authorize decryption through `seal_approve`; `ReadWrite` caps authorize writes; `Admin` caps mint/revoke capabilities.
- Admin revoke marks a capability ID revoked under the namespace even if the holder-owned cap object remains.
- Runtime integrations expose memory as explicit recall/capture helpers. They recall relevant memories before a host call and capture new memories after, while swallowing failures so OneMem does not break the host runtime.
- Provider integrations include Vercel AI SDK, OpenAI Agents, CrewAI, LiveKit, ElevenLabs, and Hermes surfaces.
- The MCP server exposes memory-first tools: add memory, search memory, share namespace, revoke namespace capability, plus trace/proof inspection.
- The dashboard memory view is memory-provenance oriented. It lists encrypted memory write metadata derived from on-chain `memwal_write` ActionCalls because MemWal currently lacks a list/update/delete/history primitive.
- Trace sessions and Merkle verification are implemented, but code comments define their proof boundary: they prove integrity of the recorded sequence, not that the agent honestly recorded all real-world activity.

## Integration Inventory For Brand And Asset Work

This is the support matrix an asset creator should see. It should be reflected in diagrams, launch graphics, X banners, demo covers, and motion storyboards.

### Core Protocol

- Sui Move package: `contracts/onemem`.
- Memory object: `MemoryNamespace`, scoped as user, agent, org, session, or shared context.
- Capability objects: `NamespaceCapability<ReadOnly>`, `NamespaceCapability<ReadWrite>`, `NamespaceCapability<Admin>`.
- Session/provenance objects: `TraceSession` and `ActionCall`.
- Decryption gate: `seal_approve`, which authorizes Seal decrypt only for valid capability holders.
- Storage path: MemWal manual memory API, Walrus blobs, Seal encryption, Sui namespace/capability control.

### SDKs, Bridges, And CLIs

- `@onemem/sdk-ts`: main TypeScript SDK.
- `onemem-sdk-python`: Python SDK surface.
- `onemem-memory`: Node bridge for memory add/search.
- `onemem-trace`: Node bridge for trace/session recording.
- `@onemem/cli`: TypeScript CLI exposed as `onemem`.
- `onemem-cli`: Python CLI exposed as `onemem-py`.
- Key CLI actions: `init`, `add`, `search`, namespace share/revoke/admin-revoke/capabilities, `verify`, trace list/get/events, `health`, `dashboard`, `login`.

### MCP Server

- Package: `@onemem/mcp`.
- Transport: stdio MCP.
- Tools:
  - `onemem_add_memory`
  - `onemem_search_memory`
  - `onemem_verify_trace`
  - `onemem_trace_session`
  - `onemem_replay_session`
  - `onemem_share_namespace`
  - `onemem_revoke_namespace_capability`
- Brand meaning: any MCP-compatible agent can use the same memory layer instead of being trapped in one app's local memory.

### Native Runtime Plugins

- Claude Code: `@onemem/claude-code-plugin`.
- Codex: `@onemem/codex-plugin`.
- OpenClaw: `@onemem/oc-onemem`.
- Hermes Agent: `hermes-onemem`.
- Naming note: the codebase contains OpenClaw, not OpenClaude. Public copy should say OpenClaw unless a separate OpenClaude integration is added.

### MCP-Compatible Runtime Targets

- Cursor.
- Windsurf.
- OpenCode.
- Cline.
- VS Code Copilot.
- Antigravity / Gemini-family MCP clients when stable.
- Claude Code and Codex when used through MCP.
- Any stdio MCP-capable agent client.

### Framework Providers

- Vercel AI SDK: `@onemem/vercel-ai-provider`.
- OpenAI Agents SDK: `@onemem/openai-agents`.
- CrewAI: `onemem-crewai`.
- LiveKit Agents: `onemem-livekit`.
- ElevenLabs Conversational AI: `onemem-elevenlabs`.

### Product Surfaces

- Local dashboard: `@onemem/dashboard`.
- Hosted dashboard: `apps/hosted-dashboard`.
- Docs app: `apps/docs`.
- Landing app: `apps/landing`.
- Brand package: `packages/brand`.
- Dashboard views to represent: overview, sessions, memories, apps/runtimes, settings, trace detail, decrypt/reveal where capability access exists.

### Demo Narratives

- Switch laptops: memory follows across machines/runtimes.
- Agent sends money: action flow gets a provenance receipt.
- Verifiable research agent: long-running research memory accumulates and is recalled later.
- Multi-agent coordination: Claude Code, Hermes, and CrewAI-style sessions compose through shared memory and trace links.

## Product Understanding

OneMem is a decentralized memory layer for AI agents.

It is closest to "Mem0-style persistent memory, but decentralized": agents can add and recall memories with familiar developer ergonomics, while storage, access control, sharing, and provenance move onto Sui/Walrus/Seal/MemWal.

The core object is not "a verifier"; it is a memory namespace. The namespace can belong to a user, agent, org, session, or shared context. Capabilities make memory portable and shareable across runtimes without tying it to one SaaS account or one app.

Verification is a support layer. It creates receipts for memory writes and agent traces, but it should not be the headline. The better headline is one persistent, encrypted, user/agent-owned memory layer that follows agents across apps and runtimes.

## Correct Framing

- "One decentralized memory layer for every agent."
- "Persistent AI memory, owned and shared through Sui capabilities."
- "Mem0-style add/search memory, backed by Walrus, Seal, MemWal, and Sui."
- "Give agents a memory that survives app boundaries."
- "Portable agent memory with encrypted storage and on-chain access control."

## Avoid

- Leading with "Stop trusting your agent."
- Calling OneMem primarily "Etherscan for AI agents."
- Making proof/verification the whole product.
- Describing OneMem as only an audit trail or trace viewer.
- Hiding the Mem0 comparison. The point is that OneMem decentralizes the memory layer pattern, not that it invents memory from scratch.

## Not Included

- No code changes to landing copy in this pass.
- No new logo/banner asset generation in this pass.
