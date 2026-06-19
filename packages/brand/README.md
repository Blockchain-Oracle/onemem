# @onemem/brand

Shared OneMem brand assets: CSS variable tokens, logo SVGs, vendor logos,
designer briefs, campaign exports, audio, and media-kit indexes.

Consumed by `@onemem/dashboard`, `apps/landing`, `apps/hosted-dashboard`, and the docs site.

See `docs/02-inspirations/BRAND_AND_SURFACES.md` for the canonical brand spec.

## Public Identity

- Product: OneMem
- Public domain for the current social campaign: `onemem.xyz`
- X profile: `x.com/OneMemAI`
- Motto: "One memory layer for every agent."
- Sharper social line: "Decentralized persistent memory for AI agents."

## Assets

Designer/operator briefs live in `briefs/`:

- `briefs/one-mem-full-brand-and-asset-brief.md` - package-local prompt and
  product-truth brief for designers, ChatGPT, and video agents.
- `ASSET_CLEANUP.md` - package-local map of canonical assets, reference-only
  videos, deleted generated outputs, external downloads, and disposable caches.

Designer campaign assets live in `designer-campaign/`:

- `designer-campaign/raw/one-mem-campaign-source.zip` - exact downloaded
  source package containing the runnable HTML campaign kit, launch animatic,
  source `.jsx`, reference uploads, logos, and design-system files.
- `designer-campaign/html/Brand Kit.html` - five-board static campaign canvas.
- `designer-campaign/html/Launch Video.html` - silent 30-second launch
  animatic.
- `designer-campaign/html/Sound Design.html` - visual audio beat-map.
- `designer-campaign/html/OneMem Handoff Guide.html` - original package guide.
- `designer-campaign/video/OneMem Launch Video - Audio Spec.md` - plain-text
  sound-design spec for the launch animatic.
- `designer-campaign/audio/onemem-launch-bed.wav` - OneMem-owned 30-second
  audio bed used by the generated launch MP4.
- `designer-campaign/AUDIO_PROVENANCE.generated.md` - kept audio hash,
  loudness, and reference-only boundary.
- `designer-campaign/screenshots/*.png` - preview snapshots from the downloaded
  package. These are not final export-resolution assets; export final boards
  from `Brand Kit.html`.
- `designer-campaign/exports/static/*.png` - exact-size generated PNG exports
  for README, X, links, tools, and architecture boards.
- `designer-campaign/exports/video/onemem-launch-30s.mp4` - 1920 x 1080,
  30fps launch video rendered from the designer HTML and paired with
  OneMem-owned generated audio.
- `designer-campaign/exports/manifest.json` - hashes, dimensions, source
  patch notes, and video/audio metadata for generated public assets.
- `designer-campaign/scripts/export-designer-campaign.mjs` - reproducible
  Chrome/ffmpeg exporter for regenerating the static boards and launch MP4
  from the raw zip.
- `designer-campaign/scripts/generate-audio-provenance.mjs` - refreshes the
  source WAV and launch MP4 audio provenance.
- `designer-campaign/manifest.json` - hashes, boundaries, target board sizes,
  and launch-video metadata for the imported package.

Logo SVGs live in `logo/`:

- `onemem-mark.svg`
- `onemem-mark-mono.svg`
- `onemem-wordmark.svg`
- `onemem-lockup-horizontal.svg`
- `onemem-lockup-dark.svg`
- `onemem-lockup-light.svg`

Old campaign and OG image folders are not packaged right now. The previous
agent-generated `campaign/` and `og-images/` folders were removed so stale
README banners, X headers, link cards, architecture posters, and OG cards do
not compete with the designer-approved direction. Use
`designer-campaign/exports/` for current generated public media and
`designer-campaign/raw/one-mem-campaign-source.zip` as the source of truth.

Old video workspaces are also not packaged right now. The previous
`video/onemem-intro/` and `video/onemem-demo/` work areas were removed so stale
HyperFrames, Remotion, dashboard-capture clips, review renders, and proof
framing do not compete with the designer campaign package. Keep the current
public launch MP4 in `designer-campaign/exports/video/` and the source audio in
`designer-campaign/audio/`.

Vendor and ecosystem logo assets live in `vendor-logos/`:

- `vendor-logos/manifest.json` - source map for every third-party logo.
- `vendor-logos/README.md` - usage rules, quick picks, and known gaps.
- `vendor-logos/svg/` - preferred vector marks for Sui, Walrus, Seal, Mem0,
  Claude Code, Codex, OpenClaw, Hermes Agent, MCP, Cursor, Windsurf, OpenCode,
  Cline, GitHub Copilot, Gemini/Antigravity, Vercel AI SDK, OpenAI, CrewAI,
  LiveKit, ElevenLabs, and SDK/app tooling.
- `vendor-logos/png/` - raster fallbacks where only a clean official raster was
  located.

Generated media-kit indexes live in `media-kit/`:

- `media-kit/generate-media-kit.mjs` - validates the current brand/video asset
  paths, designer briefs, and selected vendor logos, then regenerates the media
  kit.
- `media-kit/onemem-media-kit.generated.json` - machine-readable inventory for
  design/video/social agents.
- `media-kit/onemem-media-kit.generated.md` - human-readable media kit with
  logos, source files, handoffs, links, guardrails, and proof-boundary copy.
- `media-kit/onemem-media-kit.generated.html` - static visual gallery for
  designers and agents to preview kept assets and logos without starting a dev
  server.

## Domain Status

`onemem.xyz` is the current campaign identity, and `docs.onemem.xyz` is the
docs domain to use in launch art. Do not claim either target as deployed until
DNS resolves and the intended app is actually served.

## Usage Rules

- Match the rendered cdr-kit product palette used by the landing page and
  dashboard: cream paper, white cards, subtle grey grid/borders, warm black
  text, indigo primary, verify green, and Sui chain blue.
- Cream and white should dominate campaign assets; avoid dark cyber graphics,
  brown panels, or neon protocol-poster styling.
- Indigo is the memory and runtime identity, used as an accent.
- Verify green is reserved for successful persistence, provenance, or
  proof-passed moments.
- Sui blue is reserved for chain or explorer affordances.
- Use dark surfaces only as small contained code/vault/terminal wells.
