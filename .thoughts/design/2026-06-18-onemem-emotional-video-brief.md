# Designer Brief: OneMem Emotional Intro Video

## Purpose

Create a short, emotional launch video for OneMem that can open the Sui Overflow demo, pin to X, sit on the landing page, and give future designers a clear motion language.

The video should make one idea obvious before any technical detail appears:

> Agents should not forget who they are just because the runtime changed.

OneMem is the shared memory layer underneath Claude Code, Codex, OpenClaw, Hermes Agent, MCP clients, and AI frameworks. It is closest to a decentralized Mem0-style memory system: add/search memory, but ownership, portability, encrypted storage, sharing, revocation, and provenance live on Sui, Walrus, Seal, and MemWal.

## Recommended Format

Primary cut:

- `1920 x 1080`
- 35-45 seconds
- HyperFrames HTML/GSAP composition with captions and designed sound

Secondary cuts after the primary is approved:

- `1080 x 1920` vertical cut for X/TikTok/Reels
- 8-12 second silent looping bumper for README/GitHub/social embeds
- 30-second demo-video package in Remotion once real demo footage is ready

## Product Context

OneMem exists because agent memory is fragmented:

- Claude Code can know something Codex cannot recall.
- A local runtime can lose context when the project moves.
- MCP clients and framework agents can each keep separate memory silos.
- Memory sharing often has weak ownership, weak revocation, and weak provenance.

OneMem turns this into a shared namespace:

- `MemoryNamespace` is the durable memory boundary.
- `NamespaceCapability` objects control read, write, admin, share, and revoke authority.
- Seal encrypts memory.
- MemWal and Walrus store memory blobs.
- Sui anchors namespaces, capabilities, and optional trace receipts.
- SDKs, MCP, plugins, and providers let many runtimes use the same memory layer.

Proof is important, but it is not the headline. The headline is memory persistence and portability.

## Target Audience

- Sui Overflow judges who need to understand the product in under one minute.
- AI-agent builders who already know the pain of lost context.
- Developers comparing OneMem to Mem0, local MCP memory servers, plugin memory, and framework-specific memory.
- Designers/editors creating follow-up launch clips, demo covers, and integration animations.

## Emotional Core

The tone should feel calm, technical, and human. Not a dark cyber trailer. Not generic AI particles.

The emotion is:

- first: context slipping away,
- then: memory becoming durable,
- then: another runtime recognizing the same context,
- finally: the quiet confidence that the memory is encrypted, owned, and anchored.

Visual language:

- cream-first cdr-kit canvas,
- warm black text,
- white cards and shallow depth,
- indigo memory rails,
- verify green only for persistence/proof moments,
- Sui blue only for chain/storage rails,
- small dark wells only for code/vault/terminal moments.

## Required Brand Rules

Use the existing OneMem design system:

- Display: `Bricolage Grotesque`
- Body: `Hanken Grotesk`
- Mono: `JetBrains Mono`
- Paper: `oklch(0.992 0.004 95)`
- Paper 2: `oklch(0.972 0.006 92)`
- Card: `oklch(1 0 0)`
- Ink: `oklch(0.235 0.013 65)`
- Ink 2: `oklch(0.50 0.012 68)`
- Primary indigo: `oklch(0.52 0.20 268)`
- Verify green: `oklch(0.58 0.15 152)`
- Sui/storage blue: `#4da2ff` or the existing Sui logo blue
- Line: `oklch(0.905 0.006 85)`

Do not use the old neon/purple/brown look. The current brand should feel like the dashboard and landing page.

## Required Asset Inputs

Use these local assets as the source of truth:

- `packages/brand/logo/onemem-mark.svg`
- `packages/brand/logo/onemem-wordmark.svg`
- `packages/brand/logo/onemem-lockup-horizontal.svg`
- `packages/brand/campaign/motion-storyboard.svg`
- `packages/brand/campaign/architecture.svg`
- `packages/brand/campaign/tools-grid.svg`
- `packages/brand/og-images/demo-video-cover.svg`
- `packages/brand/vendor-logos/manifest.json`
- `packages/brand/vendor-logos/svg/sui.svg`
- `packages/brand/vendor-logos/svg/walrus-icon.svg`
- `packages/brand/vendor-logos/svg/seal.svg`
- `packages/brand/vendor-logos/svg/mcp.svg`
- `packages/brand/vendor-logos/svg/claude-code.svg`
- `packages/brand/vendor-logos/svg/codex.svg`
- `packages/brand/vendor-logos/svg/openclaw.svg`
- `packages/brand/vendor-logos/svg/hermes-agent.svg`
- `packages/brand/vendor-logos/svg/cursor.svg`
- `packages/brand/vendor-logos/svg/windsurf.svg`
- `packages/brand/vendor-logos/svg/opencode.svg`
- `packages/brand/vendor-logos/svg/cline.svg`
- `packages/brand/vendor-logos/svg/github-copilot.svg`
- `packages/brand/vendor-logos/svg/antigravity.svg`
- `packages/brand/vendor-logos/svg/vercel-ai-sdk.svg`
- `packages/brand/vendor-logos/svg/openai.svg`
- `packages/brand/vendor-logos/svg/crewai.svg`
- `packages/brand/vendor-logos/svg/livekit.svg`
- `packages/brand/vendor-logos/svg/elevenlabs.svg`

Use logos for truthful identification only. Do not imply third-party endorsement.

## Public Links To Show

Use exactly:

- Website: `onemem.xyz`
- Docs: `docs.onemem.xyz`
- X: `x.com/OneMemAI`
- GitHub: `github.com/Blockchain-Oracle/onemem`
- npm: `@onemem/sdk-ts`, `@onemem/mcp`
- PyPI: `hermes-onemem`, `onemem-crewai`, `onemem-livekit`, `onemem-elevenlabs`

Do not use `.ai` for OneMem domains.

## Primary Storyboard

### 0.0-4.5s: Context Fades

Visual:

- Cream canvas.
- Four quiet runtime windows appear: Claude Code, Codex, OpenClaw, Hermes.
- Each contains one useful memory card, then the cards drift apart and begin to fade.
- A thin caption appears: `Every agent learns. Most agents forget alone.`

Sound:

- Low warm pulse.
- Soft room-tone texture.
- Small fading ticks as memory cards disappear.

Voiceover:

`Every agent builds context. But that context usually stays trapped in one runtime.`

### 4.5-10.5s: One Shared Memory Layer

Visual:

- The fading cards stop, turn indigo, and move toward the OneMem mark.
- The mark opens into a `MemoryNamespace` vault/grid.
- The line `One memory layer for every agent.` lands as the first true hero copy.

Sound:

- Memory-write click.
- Soft upward swell, not a trailer hit.

Voiceover:

`OneMem gives them a shared memory layer.`

### 10.5-17.0s: Add, Search, Share, Revoke

Visual:

- Code-like calls animate as real product concepts, not fake metrics:
  - `memory.add(...)`
  - `memory.search("shipping context")`
  - `cap: ReadWrite`
  - `revoke(capability)`
- Capability keys select read/write/admin modes around the namespace.
- Keep all labels large and uncrowded.

Sound:

- Delicate key click.
- Brief typed mono sound.

Voiceover:

`Agents can add, search, share, and revoke memory through SDKs, MCP, plugins, and providers.`

### 17.0-25.0s: Encrypted, Stored, Anchored

Visual:

- A memory card passes through Seal as a lock/encryption layer.
- It becomes a blob and drops into MemWal/Walrus storage.
- A thin Sui-blue receipt line anchors the event on Sui.
- Use protocol logos, but the memory card stays the hero.

On-screen labels:

- `Seal encryption`
- `MemWal + Walrus storage`
- `Sui namespace + receipts`

Sound:

- Soft encrypted sweep.
- Subtle water-like storage drop.
- One clean chain-confirmation tone.

Voiceover:

`The memory is encrypted, stored through Walrus, and anchored on Sui.`

### 25.0-33.5s: Runtime Switch

Visual:

- The first runtime fades into the background.
- A different runtime opens.
- It searches the same namespace and recalls the exact memory.
- The remembered card becomes solid again, now with a small verify-green persistence mark.

Caption:

`Claude Code -> Codex -> OpenClaw -> Hermes -> MCP`

Voiceover:

`Later, a different agent can recall the same context with the right capability.`

### 33.5-40.5s: Supported Surface

Visual:

- A clean logo rail expands around OneMem:
  - Native plugins: Claude Code, Codex, OpenClaw, Hermes Agent.
  - MCP clients: Cursor, Windsurf, OpenCode, Cline, Copilot, Antigravity.
  - Frameworks: Vercel AI SDK, OpenAI Agents, CrewAI, LiveKit, ElevenLabs.
  - Core stack: Sui, Walrus, Seal, MemWal.
- Do not make this a crowded logo wall. Use 3-4 grouped rails.

Voiceover:

`It meets agents where they already work.`

### 40.5-45.0s: Close

Visual:

- OneMem lockup.
- Hero copy:
  - `One memory layer for every agent.`
  - `Decentralized persistent memory for AI agents.`
- Footer links:
  - `onemem.xyz`
  - `docs.onemem.xyz`
  - `x.com/OneMemAI`

Sound:

- Pulse resolves.
- One clean success tone.

Voiceover:

`OneMem. Decentralized persistent memory for AI agents.`

## Optional TEE/WASI/Nautilus Insert

Abu mentioned using the "WASI code." The repo does not currently show a shipped OneMem feature with that exact name. It does contain Nautilus/TEE stretch docs and a lockfile reference to `quickjs-wasi`.

Do not include this as shipped product copy unless the exact implementation is confirmed.

If confirmed, add a 6-8 second insert after the storage/anchor scene:

- Visual: `code hash -> TEE / WASI runtime -> Sui attestation receipt`
- Caption: `Future relayer path: code provenance for memory writes`
- Voiceover: `The next layer is code-attested relay, so the chain can know what processed the write.`

If not confirmed, keep it out of the primary launch cut and reserve it for a v0.2 vision segment.

## Demo Video Placement

For the official demo video, use this intro as the first 8-12 seconds, then transition into the real product demo:

1. Intro bumper: memory fragmentation -> OneMem namespace.
2. Demo 1: switch laptops / runtime continuity.
3. Demo 2: agent sends money with memory and trace context.
4. Demo 3: verifiable research agent.
5. Demo 4: multi-agent coordination.
6. Close: supported runtimes, docs, GitHub, domain.

The long demo can be assembled in Remotion after footage exists. Do not use Remotion first unless the cut depends on real screen recordings, terminal clips, or multiple render profiles.

## Copy Guardrails

Use:

- `One memory layer for every agent.`
- `Decentralized persistent memory for AI agents.`
- `Add, search, share, and revoke AI memory on Sui.`
- `Portable memory across Claude Code, Codex, OpenClaw, Hermes, MCP, and AI frameworks.`

Avoid:

- `Stop trusting agents.`
- `Etherscan for AI agents.`
- `Verify your agent.`
- Any OneMem `.ai` domain.
- Any `OpenClaude` spelling.
- Any line that makes verification the main product.
- Any line that claims Nautilus/TEE/WASI is shipped unless that is confirmed by implementation.

## Sound Direction

Sound should feel designed but restrained:

- low mechanical pulse under the whole video,
- short memory-write click,
- small key/capability click,
- soft encrypted sweep,
- water-like Walrus storage drop,
- clean Sui receipt tone,
- final success tone at recall.

Avoid:

- loud trailer impacts,
- aggressive risers,
- EDM drops,
- horror/glitch textures,
- robotic voiceover.

Voice should sound warm, precise, and calm. Captions should be readable even with audio muted.

## Prototype Quality Bar

- The first 5 seconds must be emotionally legible even without sound.
- The product must read as memory infrastructure before any proof/trace language appears.
- Text must never overlap cards, rails, logos, or the OneMem mark.
- Use actual vendor logos from the local inventory where possible.
- The central namespace must remain visually dominant.
- All captions must pass visual inspection at `1920 x 1080`.
- The video should still make sense as silent social playback with captions.
- No fake metrics, fake customer claims, or unsupported integrations.

## Open Questions

- Confirm whether "WASI code" means the Nautilus/TEE relayer path, a specific WASI demo artifact, or something else.
- Confirm whether the first cut should be exactly 30 seconds, 45 seconds, or 60 seconds for the intended submission channel.
- Confirm whether voiceover should be generated now or left as caption-only until the final demo footage exists.
