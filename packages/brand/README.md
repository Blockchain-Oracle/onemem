# @onemem/brand

Shared OneMem brand assets: CSS variable tokens, logo SVGs, font slots,
and social/OG image source templates.

Consumed by `@onemem/dashboard`, `apps/landing`, `apps/hosted-dashboard`, and the docs site.

See `docs/02-inspirations/BRAND_AND_SURFACES.md` for the canonical brand spec.

## Public Identity

- Product: OneMem
- Public domain for the current social campaign: `onememe.xyz`
- X handle: `@OneMemAI`
- Motto: "One memory layer for every agent."
- Sharper social line: "Decentralized persistent memory for AI agents."

## Assets

Logo SVGs live in `logo/`:

- `onemem-mark.svg`
- `onemem-mark-mono.svg`
- `onemem-wordmark.svg`
- `onemem-lockup-horizontal.svg`
- `onemem-lockup-dark.svg`
- `onemem-lockup-light.svg`

Social and OG SVG source assets live in `og-images/`:

- `x-banner.svg` - 1500 x 500
- `discord-banner.svg` - 1920 x 480
- `github-og.svg` - 1200 x 630
- `product-card.svg` - 1080 x 1080
- `demo-video-cover.svg` - 1920 x 1080

Platform-ready PNG exports live beside their SVG sources:

- `x-banner.png` - 1500 x 500
- `discord-banner.png` - 1920 x 480
- `github-og.png` - 1200 x 630
- `product-card.png` - 1080 x 1080
- `demo-video-cover.png` - 1920 x 1080

The SVG files are the source-controlled design source. The PNG files are
committed upload artifacts generated from those SVGs; do not hand-edit raster
copies as the source of truth.

Vendor and ecosystem logo assets live in `vendor-logos/`:

- `vendor-logos/manifest.json` - source map for every third-party logo.
- `vendor-logos/README.md` - usage rules, quick picks, and known gaps.
- `vendor-logos/svg/` - preferred vector marks for Sui, Walrus, Seal, Mem0,
  Claude Code, Codex, OpenClaw, Hermes Agent, MCP, Cursor, Windsurf, OpenCode,
  Cline, GitHub Copilot, Gemini/Antigravity, Vercel AI SDK, OpenAI, CrewAI,
  LiveKit, ElevenLabs, and SDK/app tooling.
- `vendor-logos/png/` - raster fallbacks where only a clean official raster was
  located.

## Domain Status

`onememe.xyz` is the current campaign identity, but DNS is not live in this
checkout's latest verification pass. Do not claim it as a deployed website until
DNS resolves and the landing page is actually served.

## Usage Rules

- Violet/indigo is the memory and runtime identity.
- Lime is reserved for successful persistence, provenance, or proof-passed moments.
- Sui blue is reserved for chain or explorer affordances.
- Keep social assets dark, technical, and memory-oriented; avoid generic AI
  gradients, brains, and abstract blob decoration.
