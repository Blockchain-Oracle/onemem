# OneMem Full Brand And Asset Brief

## Canonical Identity

- Product: OneMem
- Domain: `onemem.xyz`
- X profile: `x.com/OneMemAI`
- Product thesis: decentralized persistent memory for AI agents.
- Short line: One memory layer for every agent.
- Comparison anchor: Mem0 proved the persistent AI memory developer surface. OneMem decentralizes the memory layer around Sui, Walrus, Seal, and MemWal.

## Product Truth

OneMem is a decentralized memory layer for AI agents.

Agents can add memories, search memories, and reuse context across sessions, tools, devices, and runtimes. OneMem stores memory through MemWal/Walrus, encrypts it with Seal, scopes it through Sui `MemoryNamespace` objects, and shares or revokes access with Sui `NamespaceCapability` objects.

Trace and verification are not the whole product. They are supporting proof/provenance layers for memory writes and agent sessions. The headline is memory ownership, portability, persistence, sharing, and cross-runtime context.

## What Exists In The Codebase

### Core Protocol

- Sui Move package: `contracts/onemem`
- `MemoryNamespace`: the shared object that groups memory by user, agent, org, session, or shared context.
- `NamespaceCapability<ReadOnly>`: can read/decrypt namespace content.
- `NamespaceCapability<ReadWrite>`: can write memory/trace data into the namespace.
- `NamespaceCapability<Admin>`: can mint, share, self-revoke, or admin-revoke capabilities.
- `TraceSession`: a Sui object for a run/session.
- `ActionCall`: per-call record with hashes, Walrus blob references, parent links, status, and timestamps.
- `seal_approve`: Seal access gate that lets only capability holders decrypt namespace blobs.

### SDKs And Bridges

- `@onemem/sdk-ts`: TypeScript SDK.
  - `memory.add(text)` stores a Seal-encrypted MemWal/Walrus memory.
  - `memory.search(query)` recalls decrypted ranked memories.
  - `namespaces.create/shareReadOnly/shareReadWrite/revoke/adminRevoke`.
  - `traces.startSession/appendCall/closeCall/endSession/verifySession`.
  - Runtime helpers: `createMemoryRecorder`, `createTraceRecorder`, `ensureNamespace`, `resolveSigner`.
  - Node bridge binaries: `onemem-memory`, `onemem-trace`.
- `onemem-sdk-python`: Python SDK.
  - Read/verify surface.
  - Memory bridge shells out to `onemem-memory` so Python providers get the same MemWal/Walrus/Seal path.

### CLIs

- `@onemem/cli` exposes `onemem`.
  - `init`: provision or reuse namespace + ReadWrite cap.
  - `add`: store memory.
  - `search`: recall memory.
  - `namespace share/revoke/admin-revoke/capabilities`.
  - `verify`, `trace list/get/events`, `health`, `dashboard`, `login`.
- `onemem-cli` exposes `onemem-py`.
  - Read-only verify/trace/health mirror for Python environments.

### MCP Surface

- `@onemem/mcp`: stdio MCP server for any MCP-compatible runtime.
- Tools:
  - `onemem_add_memory`
  - `onemem_search_memory`
  - `onemem_verify_trace`
  - `onemem_trace_session`
  - `onemem_replay_session`
  - `onemem_share_namespace`
  - `onemem_revoke_namespace_capability`
- MCP distribution targets:
  - Claude Code
  - Codex
  - Cursor
  - Windsurf
  - OpenCode
  - Cline
  - VS Code Copilot
  - Antigravity / Gemini-family MCP clients when stable
  - Any stdio MCP-capable agent client

### Runtime Plugins

- Claude Code plugin: `@onemem/claude-code-plugin`
  - Native Claude plugin marketplace path.
  - Hooks: `SessionStart`, `PostToolUse`, `SessionEnd`.
  - Captures Claude Code tool-use sessions into OneMem traces.
  - Coexists with local Claude/Codex memory systems; OneMem is the portable encrypted memory/provenance layer.
- Codex plugin: `@onemem/codex-plugin`
  - Bundles the OneMem MCP server.
  - Provides memory/search/verify/share/replay tools through MCP.
  - Includes optional lifecycle trace hooks: `SessionStart`, `PostToolUse`, `Stop`.
  - Hook trace capture depends on user-trusted hooks; MCP memory tools are the stable baseline.
- OpenClaw plugin: `@onemem/oc-onemem`
  - Strict superset of Mysten `oc-memwal`.
  - Delegates memory storage to `oc-memwal`, then adds OneMem trace/provenance.
  - Hooks OpenClaw gateway lifecycle: session start, tool calls, agent end.
  - Auto-provisions namespace + ReadWrite cap.
- Hermes plugin: `hermes-onemem`
  - Python `MemoryProvider` for Hermes Agent.
  - Buffers turns, memory writes, and delegations.
  - Flushes through `onemem-trace` into one OneMem TraceSession.
  - Cross-runtime story: Hermes can carry memory created elsewhere and can link delegated sessions.

### Framework Providers

- Vercel AI SDK: `@onemem/vercel-ai-provider`
  - `withOneMem(model)` records model generate/stream runs.
  - `createOneMemMemory()` gives explicit recall/capture memory helper.
- OpenAI Agents SDK: `@onemem/openai-agents`
  - `attachOneMem(runner)` and `createTracedRunner()`.
  - `createOneMemMemory()` gives explicit recall/capture memory helper.
- CrewAI: `onemem-crewai`
  - `OneMemTracer` captures `step_callback` and `task_callback`.
  - `create_onemem_memory()` gives explicit recall/capture memory helper.
- LiveKit Agents: `onemem-livekit`
  - `OneMemTracer` captures voice turns/function tools.
  - `create_onemem_memory()` for voice-agent memory recall/capture.
- ElevenLabs Conversational AI: `onemem-elevenlabs`
  - `OneMemTracer` wraps transcript callbacks and client tools.
  - `create_onemem_memory()` for voice-agent memory recall/capture.

### Product Surfaces

- Local dashboard: `@onemem/dashboard`, launched on `localhost:4040`.
  - Overview, sessions, memories, apps/runtimes, settings, trace viewer.
  - Memory page lists encrypted memory write metadata and provenance.
  - Trace page can show calls, hashes, Walrus blob refs, replay, verify, and decrypt where capability access exists.
- Hosted dashboard: `apps/hosted-dashboard`.
  - Enoki-authenticated wrapper around dashboard.
  - Public verify/share pages and sponsored namespace provisioning.
- Docs app: `apps/docs`.
- Landing app: `apps/landing`.
- Brand package: `packages/brand`.

### Demo Narratives

- Switch laptops: memory follows from Claude Code on one machine to Hermes on another.
- Agent sends money: agent action flow recorded as a trace/provenance receipt.
- Verifiable research agent: long-running research memory accumulates across days, then gets recalled.
- Multi-agent coordination: Claude Code, Hermes, and CrewAI style sessions compose through shared memory/trace links.

## Asset Creator Should Understand This

Do not draw OneMem as a generic AI assistant, chatbot, or abstract brain.

Draw it as a shared memory layer:

- Many agents/runtimes around one shared namespace.
- Memory cards/fragments moving into a durable namespace/vault.
- Capability keys controlling who can read, write, share, or revoke.
- Encrypted Walrus/MemWal blocks below the namespace.
- Sui receipts/provenance as a subtle support layer, not the main headline.
- A user or agent moving from one runtime to another while the same memory follows.
- Dashboard proof/provenance as the final confidence layer.

## Positioning Lines

- One memory layer for every agent.
- Decentralized memory for AI agents.
- Mem0-style memory, owned by users and agents.
- Portable memory across Claude Code, Codex, OpenClaw, Hermes, MCP, and AI frameworks.
- Add, search, share, and revoke AI memory on Sui.
- Persistent agent memory backed by Walrus, Seal, MemWal, and Sui.
- Same memory, every runtime.
- Your agent memory should not be trapped in one app.

Avoid:

- Stop trusting agents.
- Etherscan for AI agents.
- Verify your agent.
- Audit-only framing.
- Any copy that makes OneMem sound like only a trace viewer.

## Visual DNA

- Current app icon: dark rounded square with cube-like memory/chain mark.
- Existing icon colors:
  - charcoal `#171717`
  - violet `#8f7cff`
  - lime `#d4ff5e`
- Token roles:
  - violet/indigo = memory, context, runtime identity.
  - lime/green = successful persistence/provenance/verified moment only.
  - sea-blue = Sui/on-chain links only.
  - warm paper = product/dashboard readability.
  - dark charcoal/navy = cinematic social/launch assets.
- Type direction:
  - expressive but technical display type.
  - readable body type.
  - mono details for hashes, namespaces, blob IDs, capabilities.
  - Current product uses Bricolage Grotesque, Hanken Grotesk, JetBrains Mono.

## Exact Label Spellings

Use these labels consistently in graphics, captions, and motion frames:

- OneMem
- onemem.xyz
- x.com/OneMemAI
- Mem0-style memory
- Sui
- Walrus
- Seal
- MemWal
- Claude Code
- Codex
- OpenClaw
- Hermes Agent
- MCP
- Cursor
- Windsurf
- OpenCode
- Cline
- VS Code Copilot
- Antigravity
- Vercel AI SDK
- OpenAI Agents SDK
- CrewAI
- LiveKit Agents
- ElevenLabs Conversational AI

## Export Checklist

Logo and lockups:

- `packages/brand/logo/onemem-mark.svg`
- `packages/brand/logo/onemem-mark-mono.svg`
- `packages/brand/logo/onemem-wordmark.svg`
- `packages/brand/logo/onemem-lockup-horizontal.svg`
- `packages/brand/logo/onemem-lockup-dark.svg`
- `packages/brand/logo/onemem-lockup-light.svg`

Social and launch assets:

- `packages/brand/og-images/x-banner.svg` and `.png` - 1500 x 500
- `packages/brand/og-images/discord-banner.svg` and `.png` - 1920 x 480
- `packages/brand/og-images/github-og.svg` and `.png` - 1200 x 630
- `packages/brand/og-images/product-card.svg` and `.png` - 1080 x 1080
- `packages/brand/og-images/demo-video-cover.svg` and `.png` - 1920 x 1080

Motion assets:

- 10-second bumper storyboard.
- 16:9 demo intro frame.
- 1:1 animated card concept.
- 1500 x 500 X banner safe-area frame.
- Optional HyperFrames/Remotion shot list using the "One Memory Across Agents" sequence below.

## Prompt For ChatGPT Or A Designer

I am building the brand identity and social launch kit for OneMem.

OneMem is decentralized persistent memory for AI agents. Think Mem0-style add/search memory ergonomics, but with memory ownership, portability, sharing, encryption, and provenance moved onto Sui, Walrus, Seal, and MemWal.

Agents can add memories, search memories, and reuse context across sessions and runtimes. Memories live in Sui-scoped `MemoryNamespace` objects, are stored as Seal-encrypted Walrus/MemWal blobs, and are shared or revoked through Sui `NamespaceCapability` objects. OneMem also records optional trace/provenance receipts for memory writes and agent runs, but verification is the support layer, not the headline.

Public identity:
- Product: OneMem
- Website: onemem.xyz
- X: x.com/OneMemAI
- Main line: One memory layer for every agent.

Supported surfaces to reflect in brand/asset concepts:
- SDKs: TypeScript SDK, Python SDK, Node bridge CLIs `onemem-memory` and `onemem-trace`.
- CLI: `onemem init`, `onemem add`, `onemem search`, namespace share/revoke, trace/verify, dashboard.
- MCP tools: add memory, search memory, verify trace, trace session, replay session, share namespace, revoke namespace capability.
- Native runtime plugins: Claude Code, Codex, OpenClaw, Hermes.
- MCP-compatible runtimes: Cursor, Windsurf, OpenCode, Cline, VS Code Copilot, Antigravity/Gemini-family clients, Claude Code, Codex, and any stdio MCP client.
- Framework providers: Vercel AI SDK, OpenAI Agents SDK, CrewAI, LiveKit Agents, ElevenLabs Conversational AI.
- Product surfaces: local dashboard, hosted dashboard, public verify/share pages, docs, landing page.
- Demo narratives: switch laptops and memory follows; multi-agent coordination through one namespace; long-running research agent recalls prior days; agent action flow gets a provenance receipt.

Design task:
Create a complete brand/social kit, not just a logo.

Deliver:
1. Three brand directions.
2. Recommended direction for Sui Overflow judges and developer users.
3. Primary logo mark, wordmark, horizontal lockup, app icon, mono version, dark/light versions.
4. X avatar, X banner 1500x500, Discord/community banner 1920x480, GitHub/website OG 1200x630, launch card 1080x1080, demo-video cover 1920x1080.
5. A 10-second motion bumper storyboard.
6. Social copy: X bio, pinned post, 5 launch posts, 3 technical memory posts, 3 community/Sui Overflow posts.
7. Demo-video visual treatment.

Creative constraints:
- Lead with memory, not audit.
- Show shared memory across runtimes.
- Show capability keys for read/write/admin sharing.
- Show encrypted Walrus/MemWal storage and Sui provenance as infrastructure layers.
- Do not use generic AI brains, neural blobs, faceless chatbot mascots, random glowing gradients, or vague Web3 coin imagery.
- Use lime/green only for successful persistence/provenance moments.
- Make it feel credible to developers, judges, Web3 users, and agent-framework builders.

## First Motion Concept

Title: One Memory Across Agents

Storyboard:
1. Isolated runtime nodes appear: Claude Code, Codex, OpenClaw, Hermes, MCP, Vercel AI, OpenAI Agents, CrewAI, LiveKit, ElevenLabs.
2. Each node has a small local memory fragment that fades or fragments.
3. The fragments move into one shared OneMem namespace, drawn as a cube/vault.
4. Capability keys appear: ReadOnly, ReadWrite, Admin.
5. Encrypted memory blocks settle into Walrus/MemWal storage.
6. A second runtime recalls a memory written by the first.
7. A subtle Sui receipt line appears underneath as provenance.
8. Lime pulse confirms persistence/provenance.
9. Final frame: OneMem logo, `x.com/OneMemAI`, `onemem.xyz`, "One memory layer for every agent."

Sound direction:
- Clean infrastructure pulse.
- Soft memory-card snap/slot sounds.
- Restrained confirmation tone on the lime persistence moment.
- No overhyped trailer impact.
