# Plan: OneMem Emotional Intro Video

## Inputs

- Creative brief: `.thoughts/design/2026-06-18-onemem-emotional-video-brief.md`
- Campaign designer brief: `.thoughts/design/2026-06-18-one-mem-campaign-designer-brief.md`
- Campaign storyboard: `packages/brand/campaign/motion-storyboard.svg`
- Architecture diagram: `packages/brand/campaign/architecture.svg`
- Tools poster: `packages/brand/campaign/tools-grid.svg`
- Demo cover: `packages/brand/og-images/demo-video-cover.svg`
- Brand tokens: `packages/brand/tokens.css`
- UI tokens: `apps/landing/styles/cdr-tokens.css`, `packages/dashboard/styles/cdr-tokens.css`
- Vendor logo manifest: `packages/brand/vendor-logos/manifest.json`

## Tool Decision

Use HyperFrames first.

Reasons:

- The first deliverable is a motion-led brand bumper, not a footage-heavy demo edit.
- HyperFrames is better for HTML/SVG/GSAP animation, captions, logo rails, and sound cues.
- It has built-in `lint`, `inspect`, `preview`, and `render` checks that specifically catch text overflow and layout issues.

Use Remotion second.

Reasons:

- Remotion is a better fit for the 30-second demo reel once there are real recordings, terminal clips, dashboard footage, and multiple export profiles.
- It can share a props schema for chapters, footage modes, and render targets.

Do not start with a hand-edited timeline in a generic video editor. The brand needs repeatable source files that another agent can change safely.

## Phase 0: Lock Creative Boundaries

### Work

- Treat the new video brief as the source of truth.
- Keep the launch story memory-first.
- Keep proof/trace/verification as the confidence layer.
- Use `onemem.xyz`, `docs.onemem.xyz`, and `x.com/OneMemAI`.
- Use OpenClaw, not OpenClaude.
- Treat "WASI code" as unresolved until Abu confirms the exact implementation.

### Stop Condition

The brief is approved or revised.

## Phase 1: HyperFrames Visual Identity

### Work

- Use `packages/brand/video/onemem-intro/DESIGN.md` as the HyperFrames identity file.
- Keep the composition cream-first and cdr-kit aligned.
- Use the exact colors, type, motion constraints, and non-goals from the design file.
- Read the HyperFrames `house-style.md` before writing composition HTML.

### Stop Condition

The project has a local `DESIGN.md` that satisfies HyperFrames' visual identity gate.

## Phase 2: Scaffold The HyperFrames Project

### Work

- Create the video project with HyperFrames CLI:

```sh
npx hyperframes init packages/brand/video/onemem-intro --non-interactive
```

- If the CLI refuses to scaffold into a non-empty directory, initialize into a temp folder and move the generated files with `apply_patch` or normal file operations that preserve the existing `DESIGN.md`.
- Keep source media under `packages/brand/video/onemem-intro/media/`.
- Copy or reference brand SVGs from `packages/brand/logo/`, `packages/brand/campaign/`, and `packages/brand/vendor-logos/`.

### Stop Condition

`index.html`, composition files, and local media references exist without replacing the brand source assets.

## Phase 3: Build The Primary Cut

### Work

- Build `1920 x 1080`, 35-45 seconds.
- Use six scenes from the brief:
  - Context fades.
  - One shared memory layer.
  - Add, search, share, revoke.
  - Encrypted, stored, anchored.
  - Runtime switch and recall.
  - Supported surface and close.
- Build static hero frames first before GSAP motion.
- Animate into CSS-defined final positions.
- Use transitions between every scene.
- Do not use exit animations before transitions.
- Keep text natural-wrapping; do not force breaks with `<br>` unless the title is intentionally stacked.

### Stop Condition

The composition plays through with all scenes present and no obvious visual overlap.

## Phase 4: Sound And Captions

### Work

- Start with a caption-first version so it works silent on X.
- Add designed audio cues:
  - low mechanical pulse,
  - memory-write click,
  - capability key click,
  - encrypted sweep,
  - storage drop,
  - Sui receipt tone,
  - final success tone.
- Add voiceover only after the caption timing feels right.
- If generating voice, keep it warm and calm; no robotic narrator.

### Stop Condition

Audio enhances the cut without carrying the product explanation by itself.

## Phase 5: HyperFrames Verification

### Work

Run:

```sh
npx hyperframes lint packages/brand/video/onemem-intro
npx hyperframes inspect packages/brand/video/onemem-intro --samples 18
npx hyperframes preview packages/brand/video/onemem-intro --port 3017
```

Fix every lint error and every real text-overflow/clip issue before render.

### Stop Condition

Lint passes and visual inspection reports no real text escaping, clipping, or off-canvas content.

## Phase 6: Render Review Build

### Work

Render a draft first:

```sh
npx hyperframes render packages/brand/video/onemem-intro --quality draft --output packages/brand/video/onemem-intro/renders/onemem-intro-draft.mp4
```

After approval, render high quality:

```sh
npx hyperframes render packages/brand/video/onemem-intro --quality high --fps 30 --output packages/brand/video/onemem-intro/renders/onemem-intro.mp4
```

### Stop Condition

The MP4 exists, plays locally, and the user has a preview URL or rendered file path.

## Phase 7: Secondary Cuts

### Work

- Create an 8-12 second bumper from scenes 2, 4, and 6.
- Create a `1080 x 1920` vertical cut with simplified logo rails.
- Use the same voice/caption source so copy stays consistent.

### Stop Condition

Landscape, vertical, and bumper variants are ready for social use.

## Phase 8: Remotion Demo Video Package

### Work

Only start this after real demo footage exists.

- Create a Remotion project or composition for the final Sui Overflow demo.
- Define chapter props:
  - intro,
  - switch-laptops/runtime-continuity,
  - agent-sends-money,
  - verifiable-research-agent,
  - multi-agent-coordination,
  - close.
- Support footage modes:
  - `none`,
  - `placeholder`,
  - `real`.
- Use the HyperFrames intro as a rendered asset or recreate it as a Remotion opening sequence if parameterization is needed.

### Stop Condition

The 30-second demo reel has chapter structure, footage slots, captions, and export scripts.

## Verification Checklist

- No OneMem `.ai` domains.
- `x.com/OneMemAI` appears instead of a bare handle when links are shown.
- OpenClaw spelling is correct.
- Walrus and Seal appear with logo treatment, not just text labels.
- GitHub, docs, npm, PyPI, Python, MCP, and X use recognizable link/logo treatment where shown.
- The video is memory-first, not verify-first.
- The central namespace is visually dominant.
- Text does not overflow cards or collide with the OneMem mark.
- The cream-first cdr-kit palette is preserved.
- Nautilus/TEE/WASI is either absent or clearly labeled as future/stretch until implementation is confirmed.

## Current Status

Implemented.

The HyperFrames intro, social bumper, vertical teaser, and 30-second Remotion
evidence demo have been rendered. The Remotion package stays honest: it has
footage slots for the final recorded demo, but the current MP4s are the
evidence-backed 30-second placeholder/evidence reels.
