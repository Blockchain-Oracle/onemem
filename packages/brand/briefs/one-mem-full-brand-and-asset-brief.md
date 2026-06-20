# OneMem Full Brand And Asset Brief

Use this brief when asking a designer or another AI agent to create OneMem
identity, social, banner, video, or launch assets.

> ⚠️ STALE (2026-06-20): this brief still describes the removed **trace/verify**
> product. OneMem is now **claude-mem + Mem0, decentralized** — memory only, on
> MemWal / Walrus / Seal, no trace/verify. Ignore every trace/verify/ActionCall/
> Merkle/`onemem-trace`/replay reference below. Full rewrite is tracked under
> Phase 5 (landing/brand) in `BUILD_SEQUENCE.md`.

## Canonical Identity

- Product: OneMem
- Website: `onemem.xyz`
- Docs: `docs.onemem.xyz`
- X profile: `x.com/OneMemAI`
- Motto: One memory layer for every agent.
- Product thesis: decentralized persistent memory for AI agents.
- Comparison anchor: Mem0 proved the persistent AI memory developer surface;
  OneMem decentralizes that memory layer around Sui, Walrus, Seal, and MemWal.

## Product Truth

OneMem is a decentralized memory layer for AI agents.

Agents can add memories, search memories, and reuse context across sessions,
tools, devices, and runtimes. OneMem stores memory through MemWal/Walrus,
encrypts it with Seal, scopes it through Sui `MemoryNamespace` objects, and
shares or revokes access with Sui `NamespaceCapability` objects.

Trace and verification are not the whole product. They are supporting
proof/provenance layers for memory writes and agent sessions. The headline is
memory ownership, portability, persistence, sharing, and cross-runtime context.

## Supported Surfaces

- Core stack: Sui, Walrus, Seal, MemWal.
- SDKs: TypeScript SDK, Python SDK, `onemem-memory`, `onemem-trace`.
- CLI: `onemem init`, `onemem add`, `onemem search`, namespace share/revoke,
  trace/verify, dashboard, login.
- MCP tools: add/search memory, verify trace, trace session, replay session,
  share namespace, revoke namespace capability.
- Native runtime plugins: Claude Code, Codex, OpenClaw, Hermes Agent.
- MCP-compatible clients: Cursor, Windsurf, OpenCode, Cline, VS Code Copilot,
  Antigravity/Gemini-family clients, Claude Code, Codex, and any stdio MCP
  client.
- Framework providers: Vercel AI SDK, OpenAI Agents SDK, CrewAI, LiveKit
  Agents, ElevenLabs Conversational AI.
- Product surfaces: local dashboard, hosted dashboard, public verify/share
  pages, docs, landing page.

## Asset Direction

Do not draw OneMem as a generic AI assistant, chatbot, abstract brain, coin, or
faceless mascot. Draw it as a shared memory layer:

- Many agents/runtimes around one shared namespace.
- Memory cards or fragments moving into a durable namespace/vault.
- Capability keys controlling read, write, share, and revoke permissions.
- Encrypted Walrus/MemWal blocks beneath the namespace.
- Sui receipts and provenance as the supporting infrastructure layer.
- A user or agent moving from one runtime to another while the same memory
  follows.
- Dashboard proof/provenance as the confidence layer, not the headline.

## Visual DNA

- Cream paper, white cards, subtle grey borders/grid, warm black text.
- Indigo/violet for memory, context, and runtime identity.
- Lime/green only for successful persistence, provenance, or verified moments.
- Sui blue only for chain/explorer affordances.
- Dark charcoal/navy is allowed for cinematic launch/video assets, but avoid
  brown panels, generic neon crypto posters, and one-note purple gradients.
- Use Bricolage Grotesque, Hanken Grotesk, and JetBrains Mono when matching the
  repo assets.

## Exact Labels

Use these spellings in graphics, captions, and motion frames:

- OneMem
- onemem.xyz
- docs.onemem.xyz
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

## Avoid

- misspellings of OpenClaw
- OneMem `.ai` domains
- split-domain variants of OneMem
- verify-first framing
- "Stop trusting your AI agent"
- "Etherscan for AI agents"
- claims that WASI, Nautilus, or TEE are shipped behavior unless current
  implementation evidence exists and is recorded
- calling dashboard-capture footage final live proof

## Prompt For ChatGPT Or A Designer

I am building the brand identity and social launch kit for OneMem.

OneMem is decentralized persistent memory for AI agents. Think Mem0-style
add/search memory ergonomics, but with memory ownership, portability, sharing,
encryption, and provenance moved onto Sui, Walrus, Seal, and MemWal.

Agents can add memories, search memories, and reuse context across sessions and
runtimes. Memories live in Sui-scoped `MemoryNamespace` objects, are stored as
Seal-encrypted Walrus/MemWal blobs, and are shared or revoked through Sui
`NamespaceCapability` objects. OneMem also records optional trace/provenance
receipts for memory writes and agent runs, but verification is the support
layer, not the headline.

Public identity:

- Product: OneMem
- Website: onemem.xyz
- Docs: docs.onemem.xyz
- X: x.com/OneMemAI
- Main line: One memory layer for every agent.

Create a complete brand/social kit, not just a logo.

Deliver:

1. Three brand directions.
2. Recommended direction for Sui Overflow judges and developer users.
3. Primary logo mark, wordmark, horizontal lockup, app icon, mono version,
   dark/light versions.
4. X avatar, X banner 1500 x 500, Discord/community banner 1920 x 480,
   GitHub/website OG 1200 x 630, launch card 1080 x 1080, demo-video cover
   1920 x 1080.
5. A 10-second motion bumper storyboard.
6. Social copy: X bio, pinned post, 5 launch posts, 3 technical memory posts,
   3 community/Sui Overflow posts.
7. Demo-video visual treatment.

Creative constraints:

- Lead with memory, not audit.
- Show shared memory across runtimes.
- Show capability keys for read/write/admin sharing.
- Show encrypted Walrus/MemWal storage and Sui provenance as infrastructure
  layers.
- Use real ecosystem logos only for truthful identification, not endorsement.
- Make it credible to developers, judges, Web3 users, and agent-framework
  builders.

## First Motion Concept

Title: One Memory Across Agents

Storyboard:

1. Isolated runtime nodes appear: Claude Code, Codex, OpenClaw, Hermes, MCP,
   Vercel AI, OpenAI Agents, CrewAI, LiveKit, ElevenLabs.
2. Each node has a small local memory fragment that fades or fragments.
3. The fragments move into one shared OneMem namespace, drawn as a cube/vault.
4. Capability keys appear: ReadOnly, ReadWrite, Admin.
5. Encrypted memory blocks settle into Walrus/MemWal storage.
6. A second runtime recalls a memory written by the first.
7. A subtle Sui receipt line appears underneath as provenance.
8. Lime pulse confirms persistence/provenance.
9. Final frame: OneMem logo, `x.com/OneMemAI`, `onemem.xyz`, and
   "One memory layer for every agent."

Sound direction:

- Clean infrastructure pulse.
- Soft memory-card snap/slot sounds.
- Restrained confirmation tone on the lime persistence moment.
- No overhyped trailer impact.
