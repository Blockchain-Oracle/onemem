# Designer Brief: OneMem Campaign Brand Assets

## Purpose

Create a high-polish campaign asset system for OneMem that can be used in a GitHub README, X profile, social cards, integration posters, architecture explanations, and future demo/video intros.

The assets must make the product immediately legible: OneMem is decentralized persistent memory for AI agents. It is closest to Mem0-style add/search memory, but ownership, portability, encrypted storage, sharing, and provenance are moved onto Sui, Walrus, Seal, and MemWal.

## Prototype Scope

This brief covers static and motion-ready brand assets, not production application UI.

Required asset families:

- README hero banner for GitHub.
- X/social profile header for `@OneMemAI`.
- Link card with public routes and package entry points.
- Tools and integrations visual showing native runtimes, MCP clients, framework providers, and core protocol pieces.
- Designed architecture SVG, not Mermaid.
- Motion storyboard for a later HyperFrames or Remotion intro.

The first pass should produce source SVGs and platform-ready PNG exports. Any live URL claim must stay honest: `onemem.xyz` is the current campaign domain, but DNS/deployment should be verified before copy says the site is live.

## Product Context

OneMem gives agents a durable memory layer that survives app and runtime boundaries.

The product surface is memory-first:

- Agents add memory.
- Agents search memory.
- Memory is scoped through a Sui `MemoryNamespace`.
- Access is represented by Sui `NamespaceCapability` objects.
- Memory content is encrypted with Seal.
- Memory blobs are stored through MemWal and Walrus.
- Trace/provenance receipts can record memory writes and agent action flows, but verification is the confidence layer, not the headline.

Correct headline framing:

- One memory layer for every agent.
- Decentralized persistent memory for AI agents.
- Portable memory across Claude Code, Codex, OpenClaw, Hermes, MCP, and AI frameworks.
- Add, search, share, and revoke AI memory on Sui.

Avoid leading with:

- Stop trusting agents.
- Etherscan for AI agents.
- Verify your agent.
- Audit-only trace viewer framing.

## Target Users

- Sui Overflow judges who need to understand what was built quickly.
- Developers comparing OneMem to Mem0, agent memory plugins, MCP memory servers, and local tool memory.
- AI-agent builders using Claude Code, Codex, Cursor, Windsurf, OpenClaw, Hermes Agent, or framework providers.
- Designers/video agents creating launch graphics, demo covers, and short social clips.

## Domain Knowledge The Designer Needs

Core concepts:

- `MemoryNamespace`: the shared Sui object that groups memory for a user, agent, org, session, or shared context.
- `NamespaceCapability<ReadOnly>`: can read/decrypt namespace content.
- `NamespaceCapability<ReadWrite>`: can write memory/trace data.
- `NamespaceCapability<Admin>`: can mint, share, revoke, or admin-revoke capabilities.
- `TraceSession` and `ActionCall`: provenance records for action flows.
- `seal_approve`: the on-chain gate used to authorize Seal decryption for valid capability holders.
- MemWal/Walrus/Seal/Sui: the storage, encryption, and access-control stack underneath the memory API.

Supported surface inventory:

- Core packages: `@onemem/sdk-ts`, `@onemem/mcp`, `@onemem/cli`, `onemem-sdk-python`, `onemem-cli`.
- Native plugins: Claude Code, Codex, OpenClaw, Hermes Agent.
- MCP clients: Cursor, Windsurf, OpenCode, Cline, VS Code Copilot, Antigravity/Gemini-family MCP clients, Claude Code, Codex.
- Framework providers: Vercel AI SDK, OpenAI Agents SDK, CrewAI, LiveKit Agents, ElevenLabs Conversational AI.
- Product surfaces: local dashboard, hosted dashboard, docs app, landing app, brand package.

## Core User Journey

The campaign story should read as one flow:

1. A runtime or agent has useful context.
2. OneMem captures memory through SDK, MCP, plugin, or framework provider.
3. Memory enters a shared namespace.
4. Access is controlled with capability objects.
5. The content is encrypted and stored through Seal, MemWal, and Walrus.
6. Sui anchors namespaces, capabilities, and optional trace receipts.
7. Another runtime can recall the same memory later.
8. The dashboard and public share/verify surfaces explain provenance when needed.

## Screen-by-screen Direction

### README Hero

Shallow, readable at GitHub README width. It should show OneMem as a central memory layer, with a few runtime chips feeding into a namespace/vault and a short line:

`One memory layer for every agent.`

Secondary copy:

`Decentralized persistent memory for AI agents.`

### X Header

Use `1500 x 500`. Keep the mark and main line away from the lower-left profile avatar collision zone. The composition should feel cinematic and technical, but not like a generic AI gradient.

Include:

- OneMem mark and wordmark.
- `@OneMemAI`
- `onemem.xyz`
- Cross-runtime memory rail into a persistent namespace.

### Link Card

Use `1200 x 630`. The card should be practical: a "start here" asset with the domain, GitHub, docs, npm, PyPI, and X handle.

Do not imply every package is already public if verification says otherwise. Prefer grouping:

- GitHub: `github.com/Blockchain-Oracle/onemem`
- Domain: `onemem.xyz`
- Docs: `docs.onemem.xyz` or docs source, pending deployment verification
- npm: `@onemem/sdk-ts`, `@onemem/mcp`
- PyPI: provider packages where published
- X: `@OneMemAI`

### Tools And Integrations Poster

Use `1600 x 900`. This is the "look how much it supports" asset.

Visual structure:

- Center: OneMem namespace/memory layer.
- Rings or rails:
  - Native runtime plugins.
  - MCP-compatible clients.
  - Framework providers.
  - Core protocol stack.

Use actual logo assets from `packages/brand/vendor-logos/` where possible, and labels where a logo is unavailable or would reduce readability.

### Architecture SVG

Use `1920 x 1080`. This must be a designed diagram, not Mermaid.

Recommended flow:

Agents and frameworks -> SDK/MCP/plugins -> MemoryNamespace -> capability keys -> Seal encryption -> MemWal/Walrus blobs -> Sui receipts/traces -> dashboard/share/verify surfaces.

The architecture should make three planes legible:

- Runtime plane: agents and tools.
- Memory plane: namespace, capabilities, encrypted storage, recall.
- Proof plane: Sui receipts and trace verification.

### Motion Storyboard

Use `1920 x 1080` as a single storyboard SVG for later HyperFrames/Remotion work.

Suggested six beats:

1. Runtime starts with local context.
2. OneMem captures a memory.
3. Capability selects read/write authority.
4. Seal encrypts and Walrus/MemWal stores.
5. Sui anchors the receipt.
6. A different runtime recalls the same memory.

Sonic direction for later video: low mechanical pulse, short memory-write click, soft encrypted sweep, one clean success tone at recall. Avoid loud trailer impacts.

## Data, States, And Mocking Rules

Use real product labels from the repo. Do not invent integrations.

Use realistic examples:

- `namespace: agent/research`
- `cap: ReadWrite`
- `blob: walrus://...`
- `trace: 0x...`
- `memory.search("shipping context")`

Avoid fake metrics such as "10x faster" unless backed by measurement.

## Prototype Quality Bar

- The product should be understandable before reading docs.
- The memory namespace must look central.
- Verification must look like a confidence layer, not the main product.
- Text must stay readable at final export sizes.
- Logo grids must avoid becoming a crowded logo wall.
- SVGs must be self-contained enough for README/social workflows.
- PNG exports must match the SVG dimensions.

## Anti-slop Risks To Avoid

- Generic AI brain/neural imagery.
- Purple-blue blob backgrounds.
- Vague "agent trust" copy.
- Making OneMem sound like only an audit log.
- Nested cards, same-weight sections, or decorative marks that do not explain the product.
- Claiming live website/docs deployment without current DNS verification.
- Saying OpenClaude. The implemented runtime is OpenClaw.

## Interaction Opportunities

Future motion/interactive uses:

- Animated memory cards moving from runtime chips into a namespace.
- Capability key selecting read/write/admin modes.
- Seal layer locking a memory card before the blob drops into Walrus.
- Sui receipt line landing as a subtle final proof moment.
- Runtime switch from Claude Code/Codex/OpenClaw/Hermes into a second recall scene.

## Inspiration And Source Material

- `.thoughts/research/2026-06-18-onemem-product-code-audit.md`
- `.thoughts/design/2026-06-18-social-brand-kit-prompt.md`
- `.thoughts/research/2026-06-18-vendor-logo-inventory.md`
- `packages/brand/tokens.css`
- `packages/dashboard/tailwind.config.ts`
- `packages/brand/vendor-logos/manifest.json`
- `packages/brand/logo/onemem-mark.svg`
- `docs/05-our-architecture/README.md`
- `docs/03-target-runtimes/README.md`
- `docs/04-framework-providers/README.md`

External sizing references:

- X Help: header images are recommended at `1500 x 500`.
- Meta Sharing docs: high-resolution share images should be at least `1200 x 630`.
- GitHub README image sizing has no official fixed banner size; keep README art shallow and readable at constrained desktop widths.

## Creative Freedom

The visual language can be cinematic, technical, and editorial. The required constraints are the existing OneMem palette, actual product architecture, and clear hierarchy. The designer may change layout, illustration style, and motion treatment as long as the assets remain specific to decentralized agent memory.

## Explicit Non-goals

- Do not redesign the core OneMem logo.
- Do not implement dashboard UI changes.
- Do not create production backend, docs deployment, DNS, or package publishing.
- Do not use unsupported logos or imply third-party endorsement.
- Do not create a generic landing page.

## Open Questions

- Final public docs URL should be re-verified before the link card is posted.
- `onemem.xyz` DNS should be re-verified before using "live" language.
- Confirm whether the campaign should later include a separate Discord banner or use the existing `og-images/discord-banner.svg`.
