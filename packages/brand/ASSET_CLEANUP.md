# OneMem Brand Asset Cleanup Manifest

This file is the package-local cleanup map for designers and video agents. It
separates canonical OneMem assets from stale downloads, deleted generated
outputs, third-party reference links, and disposable caches.

## Canonical Source Assets

Use these as the editable source of truth:

- `logo/*.svg` - OneMem mark, wordmark, and lockups.
- `designer-campaign/raw/one-mem-campaign-source.zip` - exact downloaded
  designer campaign source package with runnable HTML, source `.jsx`, uploads,
  logos, and design-system files.
- `designer-campaign/html/*.html` - extracted brand kit, launch animatic, sound
  design, and handoff pages.
- `designer-campaign/screenshots/*.png` - preview snapshots from the downloaded
  package; use the HTML boards for final exports.
- `designer-campaign/exports/static/*.png` - current exact-size generated
  public board exports from the designer HTML source.
- `designer-campaign/exports/video/onemem-launch-30s.mp4` - current 30-second
  launch MP4 rendered from the designer HTML source with silent placeholder
  audio.
- `designer-campaign/audio/onemem-launch-bed.wav` - intentionally silent
  30-second placeholder used by the launch MP4 pending a researched replacement.
- `designer-campaign/AUDIO_PROVENANCE.generated.md` and
  `designer-campaign/audio-provenance.generated.json` - current launch-audio
  hashes, loudness, and reference-only boundary.
- `designer-campaign/exports/manifest.json` - export hashes, dimensions,
  source patch notes, and video/audio metadata.
- `designer-campaign/scripts/export-designer-campaign.mjs` - reproducible
  Chrome/ffmpeg exporter for regenerating the designer campaign exports.
- `designer-campaign/scripts/generate-audio-provenance.mjs` - refreshes the
  launch-audio provenance without retaining third-party reference audio.
- `designer-campaign/REFERENCE_BENCHMARK.generated.md` and
  `designer-campaign/reference-benchmark.generated.json` - measured benchmark
  notes for the three reference videos inside the raw zip and the current
  OneMem launch export.
- `designer-campaign/scripts/generate-reference-benchmark.mjs` - temporary
  extraction and measurement script for reference-video benchmarking.
- `designer-campaign/video/OneMem Launch Video - Audio Spec.md` - downloaded
  launch-video audio spec.
- `designer-campaign/SOUND_RESEARCH.md` - rejected sound history, online
  sourcing notes, platform constraints, and the next sound-research brief.
- `designer-campaign/manifest.json` - hashes, boundaries, and target board
  sizes for the imported package.
- `vendor-logos/manifest.json` and `vendor-logos/svg/*` - supported ecosystem
  logos for truthful identification.

## Canonical Handoffs

Use these handoffs before creating or editing visual/video assets:

- `briefs/one-mem-full-brand-and-asset-brief.md`
- `designer-campaign/README.md`
- `media-kit/onemem-media-kit.generated.json`
- `media-kit/onemem-media-kit.generated.md`
- `media-kit/onemem-media-kit.generated.html`

## Deleted Generated Outputs

These old agent-generated images and rendered videos were removed from the
package so designers and agents do not reuse stale colors, layout, copy, or
proof framing:

- `campaign/` - old README hero, X header, link card, tools grid,
  architecture image, motion storyboard, and generator.
- `og-images/` - old X banner, Discord banner, GitHub OG, product card, and
  demo video cover.
- `video/onemem-intro/` - old HyperFrames intro workspace, renders, previews,
  thumbnails, local audio bed, and handoff notes.
- `video/onemem-demo/` - old Remotion demo/launch/live-proof workspace,
  generated audio layers, dashboard-capture clips, review renders, source
  files, proof-workflow notes, and X-upload derivatives.
- `video/scripts/` - old shared video utility scripts.

## Generated Outputs To Keep

Keep these generated outputs because they are the current designer exports:

- `designer-campaign/audio/onemem-launch-bed.wav` - silent placeholder
- `designer-campaign/exports/static/*.png`
- `designer-campaign/exports/video/onemem-launch-30s.mp4`

## Reference Links Only

Third-party videos are for inspiration and benchmarking only. They should stay
as links or notes, not as local OneMem package assets. Do not ship them as
OneMem-owned public media and do not use their audio in the final cut.

Removed local benchmark downloads:

- `video/reference/x-videos/*.mp4`
- `video/reference/x-videos/*.jpg`
- `video/reference/x-videos/*_contact.png`
- `video/reference/x-videos/*_waveform.png`
- `video/reference/x-videos/*.info.json`

## External Downloads

The local downloads are not canonical OneMem campaign assets:

- `/Users/abu/Downloads/API Design System Scope (1)` - CDR design-system and
  screenshot export; useful for palette/type evidence only.
- `/Users/abu/Downloads/One Mem` and `/Users/abu/Downloads/One Mem 2` -
  dashboard/landing exports; useful for product-surface visuals only.

Those downloads still contain stale copy such as verify-first messaging and
older `.ai` URLs. Do not use them as messaging source. Current public links are
`onemem.xyz`, `docs.onemem.xyz`, and `x.com/OneMemAI`.

The previous generated campaign/video/reference downloads should not be
restored unless they are recreated from the current designer-approved
direction.

## Cleaned Or Disposable Local Caches

These are disposable and can be regenerated:

- `packages/brand/.turbo/`
- `packages/brand/designer-campaign/exports/.frames/`

Do not commit those caches. Run the package install/render commands again if a
local tool needs them.

## Copy Guardrails

Use:

- `One memory layer for every agent.`
- `Decentralized persistent memory for AI agents.`
- `OpenClaw`
- `onemem.xyz`
- `docs.onemem.xyz`
- `x.com/OneMemAI`

Avoid:

- Incorrect OpenClaw spelling.
- OneMem `.ai` domains in brand/video assets.
- `Stop trusting agents`
- `Etherscan for AI agents`
- Claiming dashboard-capture footage as final live proof.
- Claiming WASI, Nautilus, or TEE as shipped without implementation evidence.
