# Designer Spec: OneMem Launch-Mode Video

## Purpose

Create a higher-quality social/demo video for OneMem using the downloaded X
references as the bar. The piece should feel closer to Sui/Triton launch motion
than the earlier cream dashboard-card demo.

## Accepted Direction

Abu approved moving forward after reviewing the X references. The working
direction is:

- Triton/Sui energy: dark grid, kinetic type, hard rhythm, infrastructure
  objects.
- Circle polish: clean financial/product credibility and spatial UI cards.
- OneMem truth: memory-first, decentralized Mem0-style shared memory, not
  verify-first.
- 30 seconds for the first deliverable.

## Reference Inputs

Local references:

- `packages/brand/video/reference/x-videos/agentcardai_contact.png`
- `packages/brand/video/reference/x-videos/circle_contact.png`
- `packages/brand/video/reference/x-videos/triton_contact.png`
- `packages/brand/video/reference/x-videos/sui_contact.png`
- `packages/brand/video/reference/x-videos/*_waveform.png`

Research:

- `.thoughts/research/2026-06-18-x-video-reference-benchmark.md`

## Tool Decision

Use Remotion for the first rebuild.

Reasons:

- The repo already has a Remotion package, pinned Remotion versions, fonts,
  logos, footage, and render scripts.
- Remotion is current-doc supported for React-based MP4 rendering and multiple
  compositions.
- It can render the first launch-mode cut now without waiting for a designer
  export.

Do not use Rive/Lottie for this first coded cut unless a designer supplies
source animation files. Do not start with Blender unless the brief specifically
requires fully modeled 3D assets; CSS/isometric motion is enough for the first
launch-mode draft.

## Storyboard

### 0.0-4.0s: Agents Forget

- Black grid canvas.
- Kinetic type: `Agents remember.` then `Runtimes forget.`
- Small runtime labels drift apart: Claude Code, Codex, OpenClaw, Hermes.
- Memory fragments pulse, then collapse toward center.

### 4.0-9.0s: One Namespace

- OneMem mark becomes an isometric namespace core.
- Type: `One memory layer.`
- Subtitle: `A shared MemoryNamespace across every agent runtime.`
- Capabilities orbit the namespace: read, write, share, revoke.

### 9.0-14.5s: Decentralized Memory

- Isometric stack: OneMem -> Seal -> Walrus/MemWal -> Sui.
- Type blocks: `encrypted`, `portable`, `owned`.
- Use Sui blue and verify green sparingly as functional accents.

### 14.5-22.0s: Runtime Proof

- Short clips/frames from current demo footage appear as evidence cards.
- Labels stay short:
  - `Claude writes`
  - `Codex recalls`
  - `Agents coordinate`
  - `Traces persist`
- This section proves the story without becoming a slow dashboard tour.

### 22.0-27.0s: Runtime Surface

- Logo rail with OneMem-supported surfaces:
  Claude Code, Codex, OpenClaw, MCP, Hermes, Vercel AI, OpenAI Agents.
- Type: `Use the same memory anywhere agents work.`

### 27.0-30.0s: Close

- OneMem mark/wordmark.
- Links:
  - `onemem.xyz`
  - `docs.onemem.xyz`
  - `x.com/OneMemAI`
- Final line: `Decentralized persistent memory for AI agents.`

## Visual Rules

- Launch-mode dark is allowed for video even though the dashboard remains
  cream-first.
- Use black, warm off-white, OneMem indigo, Sui blue, and verify green.
- Big type, short phrases. No long paragraphs.
- Text must be the animation object, not just a caption.
- Avoid brown/neon/purple-gradient styling.
- Use real logos only as identification, not endorsement.

## Audio Rules

- Target social-ad loudness closer to the references than the old bed.
- The first new bed should land roughly around `-14 dB` to `-10 dB` mean with
  peaks below clipping.
- Use per-section rhythm and scene accents, not only ambient background.
- No famous/reference-artist styling.
- No voiceover in the first coded cut unless we have a script and a voice that
  clearly improves the piece.

## Acceptance Criteria

- 30-second landscape render exists.
- Optional vertical render exists if time permits.
- First frame is not blank.
- Text is readable in contact sheets.
- Audio is present and substantially stronger than the old `-25 dB` mean bed.
- Public links use `onemem.xyz`, `docs.onemem.xyz`, and `x.com/OneMemAI`.
- Copy uses OpenClaw, not OpenClaude.
- Video remains memory-first and does not claim unverified WASI/Nautilus/TEE
  shipped behavior.
