# Reality Research: OneMem Video Package And Sound Direction

## Scope

Current-state research for the next OneMem video pass: the pasted asset
handoff, the downloaded UI/design-system folders, the local reference videos,
the current Remotion/HyperFrames assets, and licensing-safe sound direction.

This is a facts-first pass. It does not claim the final live-proof video is
complete.

## Sources Checked

- Pasted handoff attachment:
  `/Users/abu/.codex/attachments/865f863d-8f8c-4f57-8fdf-d65a79ef5cf7/pasted-text-1.txt`
- Downloaded UI/design-system folders:
  `/Users/abu/Downloads/API Design System Scope (1)`
  `/Users/abu/Downloads/One Mem`
  `/Users/abu/Downloads/One Mem 2`
- Repo brand package:
  `packages/brand`
- Reference videos:
  `packages/brand/video/reference/x-videos/`
- Current video packages:
  `packages/brand/video/onemem-intro`
  `packages/brand/video/onemem-demo`
- Existing research:
  `.thoughts/research/2026-06-18-x-video-reference-benchmark.md`
  `.thoughts/research/2026-06-18-video-sound-direction.md`
- Online references checked on 2026-06-19:
  - Pixabay FAQ: commercial video use is allowed when music is embedded in a
    larger creative work, but Content ID claims can still happen.
  - Material Design sound guidance: sound cues should map to interaction or
    state changes; sound, music, and voice serve different roles.
  - ElevenLabs Music docs: text-to-music generates complete music from natural
    language prompts; Music API access is for paid subscribers.
  - ElevenLabs Music API page: generated tracks are trained on licensed stems
    and music and positioned for commercial use.

## Verified Facts

- The pasted handoff describes a separate campaign package with
  `Brand Kit.html`, `Launch Video.html`, `Sound Design.html`, and
  `OneMem Handoff Guide.html`.
- Those exact HTML files were not found under:
  - `/Users/abu/dev/hackathon/sui-overflow`
  - `/Users/abu/Downloads`
  - `/Users/abu/Desktop`
  - `/Users/abu/Documents`
- `/Users/abu/Downloads/API Design System Scope (1)` is a CDR design-system
  and screenshot export. It contains screenshots, `Casper Gateway` HTML files,
  and a `_ds/cdr-kit-design-system-...` bundle.
- `/Users/abu/Downloads/One Mem` and `/Users/abu/Downloads/One Mem 2` are
  OneMem dashboard/landing exports. They include pages such as `Landing.html`,
  `Overview.html`, `Trace.html`, `Docs.html`, shared `onemem.css`, and shared
  `onemem.js`.
- The downloaded `Landing.html` still contains old messaging such as
  "Stop trusting your AI agent. Verify it.", "Etherscan for AI agents.", and
  `app.onemem.ai`. Treat it as visual/design-system evidence only, not as
  product copy authority.
- The design-system tokens in the download are cream/light-first:
  `--paper: oklch(0.992 0.004 95)`, `--paper-2: oklch(0.972 0.006 92)`,
  `--ink: oklch(0.235 0.013 65)`, primary indigo
  `oklch(0.52 0.20 268)`, verify green `oklch(0.58 0.15 152)`, and
  Sui/chain blue `oklch(0.60 0.13 232)`.
- The current HyperFrames design file says the video identity is cream-first,
  refined technical, and not a dark cyber trailer:
  `packages/brand/video/onemem-intro/DESIGN.md`.
- The repo has the reference MP4s and inspection files under
  `packages/brand/video/reference/x-videos/`:
  - `triton_one_2067661855162777600_720.mp4`
  - `SuiNetwork_2065207200059109376_720.mp4`
  - `agentcardai_2032521033929076741_1080.mp4`
  - `circle_2053892572809179136_1080.mp4`
  - `*_contact.png`
  - `*_waveform.png`
- The current OneMem video package has original/generated audio assets:
  - `packages/brand/video/onemem-demo/public/audio/onemem-launch-bed.wav`
  - `packages/brand/video/onemem-demo/public/audio/onemem-launch-base.wav`
  - `packages/brand/video/onemem-demo/public/audio/onemem-demo-bed.wav`
  - `packages/brand/video/onemem-demo/public/audio/generated-sfx/*.mp3`
- Audio measurements from `ffmpeg volumedetect`:
  - Sui reference: mean `-8.4 dB`, max `0.0 dB`
  - AgentCard reference: mean `-12.9 dB`, max `-0.0 dB`
  - Circle reference: mean `-11.5 dB`, max `-0.6 dB`
  - Triton / Seal reference: mean `-16.2 dB`, max `-0.0 dB`
  - OneMem launch render: mean `-14.0 dB`, max `-1.1 dB`
  - OneMem dashboard-capture demo render: mean `-25.1 dB`, max `-4.4 dB`
  - OneMem launch bed WAV: mean `-10.1 dB`, max `0.0 dB`
  - OneMem demo bed WAV: mean `-23.3 dB`, max `-2.6 dB`
- The current `OneMemLaunch` cut is visually closer to the Sui/Triton kinetic
  reference family: dark grid, strong type, blue floor glow, 3D-ish protocol
  planes, and louder audio.
- The current `OneMemDemo` dashboard-capture cut remains quieter and is still
  explicitly not final live proof.
- The live-proof gate still requires real recordings and metadata:
  `public/footage/live-proof-manifest.json` plus the four live clips under
  `public/footage/live/`.
- `packages/brand/.DS_Store`, `packages/brand/video/.DS_Store`, and
  `packages/brand/video/reference/.DS_Store` are ignored OS junk files, not
  tracked brand assets.

## Inferences

- The "downloaded one memo" likely refers to the `/Users/abu/Downloads/One Mem`
  UI export, while the pasted text describes a campaign package that is not
  currently present by filename.
- The best direction is a deliberate split:
  - use cream-first OneMem design for the main emotional proof/demo film;
  - keep the darker kinetic launch-mode cut for X/social energy;
  - do not let old landing-export copy drive current brand messaging.
- Current launch audio is now competitive enough for social review because it
  sits between the Triton and AgentCard/Circle loudness references. The older
  dashboard-capture demo audio is still too quiet for the final upload.
- Sound design should be original/generated or licensed, with provenance saved
  beside the render. Reference-video audio should guide energy only.
- If ElevenLabs is used again, Music API plan availability and any project
  licensing terms should be confirmed before calling the output final.

## Unknowns And Questions

- Where the exact `Brand Kit.html`, `Launch Video.html`, and `Sound Design.html`
  campaign files from the pasted handoff are stored, if they exist locally.
- Whether Abu wants the final public hero film to stay cream-first throughout
  or to include a short dark-grid social-energy middle section.
- Whether the final proof cut should include voiceover after live footage timing
  is locked.
- Whether the final score should be entirely local deterministic audio, paid
  ElevenLabs generation, or a third-party licensed track with license record.

## Not Included

- No borrowed reference audio was added.
- No final live-proof recordings were created.
- No `public/footage/live-proof-manifest.json` was fabricated.
- No one-off editor export replaced the editable HyperFrames or Remotion
  sources.
