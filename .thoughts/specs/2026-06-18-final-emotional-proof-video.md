# Spec: Final OneMem Emotional Proof Video

## Objective

Create the implementation-ready direction for the final OneMem video: an
emotional, memory-first launch/demo piece that can use the existing
HyperFrames intro and Remotion social cuts, then upgrade into a final live-proof
edit only after real recordings pass the strict proof gate.

## Background And Current Reality

OneMem already has a brand kit, campaign assets, an emotional HyperFrames intro,
Remotion launch/social cuts, dashboard-capture demo cuts, generated handoffs,
and a strict live-proof recording workflow. Current dashboard-capture footage is
useful for review and social context, but it is not final live proof.

The product story is not "stop trusting agents." OneMem is a decentralized
Mem0-style memory layer for AI agents: a shared `MemoryNamespace` with
capabilities, encrypted storage, Sui ownership/receipts, SDKs, MCP, plugins, and
provider integrations.

Literal Nautilus/TEE/WASI shipped behavior is not currently proven. The repo has
Nautilus as stretch/skeleton material, so any video reference to that trust
layer must be future-labeled or omitted from current shipped claims.

## Users

- Sui Overflow judges watching the main demo.
- AI-agent developers comparing OneMem with local memory, Mem0-style systems,
  framework memory, and MCP memory servers.
- Designers and video agents producing the final social/demo assets.
- Abu as reviewer/operator for the live proof recording pass.

## Goals

- Make the emotional idea obvious: agents should not lose context when the
  runtime changes.
- Show OneMem as the shared decentralized memory layer across Claude Code,
  Codex, OpenClaw, Hermes, MCP clients, and framework providers.
- Keep the memory namespace visually dominant; proof is the confidence layer.
- Use real OneMem links: `onemem.xyz`, `docs.onemem.xyz`, and
  `x.com/OneMemAI`.
- Use Walrus, Seal, Sui, MemWal, MCP, GitHub, npm, PyPI, Python, and runtime
  logos only where they truthfully identify supported surfaces.
- Preserve the existing cream-first brand for emotional/README assets and the
  darker kinetic treatment for X/social launch cuts.
- Make final live-proof rendering impossible until real recordings, real
  metadata, media hashes, and Sui RPC checks pass.

## Non-goals

- Do not claim literal WASI, Nautilus, or TEE support as shipped without
  implementation evidence.
- Do not call dashboard-capture footage live proof.
- Do not imply third-party endorsement from vendor logos.
- Do not replace the existing HyperFrames intro or Remotion launch package with
  an uneditable one-off video editor export.
- Do not make a verify-first or "Etherscan for agents" story.

## Requirements

1. The final production brief must be package-local so designers and agents can
   find it without reading all `.thoughts` files.
2. The brief must identify which existing cuts are usable now and which final
   proof assets remain missing.
3. The brief must define a 30-45 second story arc: fragmented memory, shared
   namespace, encrypted/decentralized substrate, runtime recall, live proof,
   supported surface, close.
4. The brief must define separate treatment for current social/launch clips,
   final live-proof demo, and future trust-layer roadmap references.
5. The brief must mention the exact final proof gate:
   `footage:recording-pack`, `footage:shotlist`,
   `footage:live-preflight:strict`, `footage:verify-live`,
   `footage:prepare-live`, `render:live-proof`, and
   `render:live-proof:vertical`.
6. The media kit must index the producer brief so follow-up agents can discover
   it.
7. Tests must cover that the producer brief is shipped and indexed.

## Acceptance Criteria

- A Context Engineering research brief records current video reality and proof
  boundaries.
- A Context Engineering spec records final-video goals, non-goals,
  requirements, and acceptance criteria.
- A package-local producer brief exists under
  `packages/brand/video/onemem-demo/notes/`.
- The generated media kit includes the producer brief in JSON, Markdown, and
  HTML outputs.
- The brand/video structure tests pass.
- Full structure tests pass.
- Searches find no accidental wrong OneMem domains or wrong OpenClaw spelling in
  active brand/video assets outside intentional validator denylist patterns.
- Active video source does not include WASI/Nautilus/TEE as shipped behavior.

## Constraints

- Use ASCII in new files.
- Keep source files below the repo 400-line cap and structure test shards below
  300 lines.
- Use `apply_patch` for manual edits.
- Do not create fake live-proof files or placeholder manifests that look final.
- Preserve the user's existing unrelated worktree changes.

## Stories Needed

- As a designer, I can open the media kit and find the final-video producer
  brief immediately.
- As a video agent, I can tell whether to use HyperFrames, Remotion, or the live
  proof gate for a specific cut.
- As Abu, I can see exactly what still needs recording before the final proof
  video can be called complete.
- As a judge/viewer, I see a memory-first story, not a vague verification pitch.

## Open Questions

- Should the final proof cut include voiceover after the live recordings are
  captured?
- Should the final recording pass use fresh testnet traces generated on the day
  of submission?
- Did Abu mean literal WASI when saying "WASI code", or was that a reference to
  the Walrus/Seal substrate? Until confirmed, literal WASI stays out of shipped
  claims.

## Source References

- `.thoughts/research/2026-06-18-final-video-current-reality.md`
- `.thoughts/design/2026-06-18-onemem-emotional-video-brief.md`
- `.thoughts/design/2026-06-18-onemem-launch-mode-video-spec.md`
- `.thoughts/research/2026-06-18-demo-video-evidence-sources.md`
- `.thoughts/verification/2026-06-18-brand-video-context-engineering.md`
- `packages/brand/video/onemem-intro/DESIGN.md`
- `packages/brand/video/onemem-demo/README.md`
- `packages/brand/video/onemem-demo/package.json`
- `packages/brand/video/onemem-demo/notes/live-proof-recording-pack.generated.md`
- `services/nautilus-relayer/README.md`
