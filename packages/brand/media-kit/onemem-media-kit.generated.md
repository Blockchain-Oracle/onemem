# OneMem Media Kit

Generated from the current brand assets, designer briefs, video outputs, and vendor logo manifest. Do not hand-edit this file; rerun `npm run media-kit:generate` after changing brand, campaign, video, brief, or vendor-logo assets.

## Identity

- Product: OneMem
- Motto: One memory layer for every agent.
- Social line: Decentralized persistent memory for AI agents.
- Website: onemem.xyz
- Docs: docs.onemem.xyz
- X: x.com/OneMemAI
- GitHub: github.com/Blockchain-Oracle/onemem

## Guardrails

- Use OpenClaw spelling.
- Keep the story memory-first; proof is the confidence layer.
- Use third-party logos only for truthful identification, not endorsement.
- Do not use OneMem .ai domains.
- Do not claim WASI, Nautilus, or TEE as shipped behavior without implementation evidence.
- Do not call brand launch media final live proof.

## Designer Briefs

Prompt and product-truth briefing for designers, ChatGPT, and video agents.

| Asset | File | Size | Use |
| --- | --- | ---: | --- |
| Full brand and asset brief | `briefs/one-mem-full-brand-and-asset-brief.md` | 6.5 KiB | Copy/paste prompt and asset direction |
| Asset cleanup manifest | `ASSET_CLEANUP.md` | 5.9 KiB | Canonical, deleted-output, reference-link, and disposable asset boundaries |

## Brand Logo

OneMem marks and lockups for product identity.

| Asset | File | Size | Use |
| --- | --- | ---: | --- |
| OneMem mark | `logo/onemem-mark.svg` | 0.6 KiB | Primary mark |
| OneMem wordmark | `logo/onemem-wordmark.svg` | 0.4 KiB | Wordmark |
| Horizontal lockup | `logo/onemem-lockup-horizontal.svg` | 0.9 KiB | Default lockup |
| Dark lockup | `logo/onemem-lockup-dark.svg` | 1.0 KiB | Dark-surface lockup |
| Light lockup | `logo/onemem-lockup-light.svg` | 1.0 KiB | Light-surface lockup |

## Designer Campaign Package

Downloaded campaign source package, board previews, launch animatic, and sound spec.

| Asset | File | Size | Use |
| --- | --- | ---: | --- |
| Designer campaign README | `designer-campaign/README.md` | 5.5 KiB | How to use the imported package |
| Designer campaign manifest | `designer-campaign/manifest.json` | 6.1 KiB | Hashes, boundaries, and target sizes |
| Raw campaign source zip | `designer-campaign/raw/one-mem-campaign-source.zip` | 9.4 MiB | Exact downloaded runnable package |
| Brand Kit HTML | `designer-campaign/html/Brand Kit.html` | 2.3 KiB | Five-board static campaign canvas |
| Launch Video HTML | `designer-campaign/html/Launch Video.html` | 2.8 KiB | Silent 30-second launch animatic |
| Sound Design HTML | `designer-campaign/html/Sound Design.html` | 9.7 KiB | Visual audio beat map |
| Original handoff HTML | `designer-campaign/html/OneMem Handoff Guide.html` | 20.2 KiB | Downloaded package guide |
| Audio spec | `designer-campaign/video/OneMem Launch Video - Audio Spec.md` | 5.3 KiB | Plain-text launch score direction |
| Silent audio placeholder | `designer-campaign/audio/onemem-launch-bed.wav` | 5.5 MiB | Temporary silent WAV used by the launch MP4 pending a researched replacement |
| Audio provenance | `designer-campaign/AUDIO_PROVENANCE.generated.md` | 3.0 KiB | Hashes, loudness, rejected-sound notes, and reference-only audio boundary |
| Audio provenance JSON | `designer-campaign/audio-provenance.generated.json` | 4.1 KiB | Machine-readable launch-audio provenance |
| Sound research | `designer-campaign/SOUND_RESEARCH.md` | 5.6 KiB | Rejected sound history and next sound-research brief |
| Reference benchmark | `designer-campaign/REFERENCE_BENCHMARK.generated.md` | 2.3 KiB | Measured inspiration notes for the three reference videos |
| Reference benchmark JSON | `designer-campaign/reference-benchmark.generated.json` | 4.8 KiB | Machine-readable reference/video loudness metrics |
| Export manifest | `designer-campaign/exports/manifest.json` | 3.0 KiB | Generated board/video hashes, dimensions, and source patches |
| Export README | `designer-campaign/exports/README.md` | 0.4 KiB | How to regenerate generated campaign exports |
| README hero PNG | `designer-campaign/exports/static/readme-hero.png` | 138.5 KiB | Exact 1280x420 README banner |
| X header PNG | `designer-campaign/exports/static/x-header.png` | 166.9 KiB | Exact 1500x500 X profile banner |
| Link card PNG | `designer-campaign/exports/static/link-card.png` | 49.9 KiB | Exact 1200x630 social link card |
| Tools poster PNG | `designer-campaign/exports/static/tools-poster.png` | 217.1 KiB | Exact 1600x900 tools and integrations board |
| Architecture PNG | `designer-campaign/exports/static/architecture.png` | 210.8 KiB | Exact 1920x1080 designed architecture board |
| Launch video MP4 | `designer-campaign/exports/video/onemem-launch-30s.mp4` | 1.3 MiB | 30-second 1920x1080 launch video with silent placeholder audio |
| Campaign export script | `designer-campaign/scripts/export-designer-campaign.mjs` | 17.0 KiB | Regenerates static boards and the launch MP4 from the raw zip |
| Audio provenance script | `designer-campaign/scripts/generate-audio-provenance.mjs` | 7.7 KiB | Regenerates launch-audio provenance without retaining reference audio |
| Reference benchmark script | `designer-campaign/scripts/generate-reference-benchmark.mjs` | 7.7 KiB | Measures raw-zip reference videos without keeping copied MP4s |
| Brand kit preview | `designer-campaign/screenshots/kit-overview.png` | 155.3 KiB | Preview only; export final boards from HTML |
| X header preview | `designer-campaign/screenshots/xheader.png` | 105.1 KiB | Preview only; export final 1500x500 board from HTML |
| Link card preview | `designer-campaign/screenshots/linkcard.png` | 79.3 KiB | Preview only; export final 1200x630 board from HTML |
| Tools poster preview | `designer-campaign/screenshots/poster.png` | 97.2 KiB | Preview only; export final 1600x900 board from HTML |
| Architecture preview | `designer-campaign/screenshots/arch.png` | 94.4 KiB | Preview only; export final 1920x1080 board from HTML |

## Core Stack Logos

| Logo | Preferred file | Other files |
| --- | --- | --- |
| Sui | `vendor-logos/svg/sui.svg` | - |
| Walrus | `vendor-logos/svg/walrus-icon.svg` | `vendor-logos/svg/walrus-docs.svg`, `vendor-logos/png/walrus-logo.png` |
| Seal | `vendor-logos/svg/seal.svg` | - |
| MemWal / Walrus Memory | `vendor-logos/svg/walrus-docs.svg` | `vendor-logos/svg/walrus-icon.svg` |

## Native Runtime Logos

| Logo | Preferred file | Other files |
| --- | --- | --- |
| Claude Code | `vendor-logos/svg/claude-code.svg` | `vendor-logos/svg/claude-code-color.svg`, `vendor-logos/svg/claude-code-text.svg` |
| Codex | `vendor-logos/svg/codex.svg` | `vendor-logos/svg/codex-color.svg`, `vendor-logos/svg/codex-text.svg` |
| OpenClaw | `vendor-logos/svg/openclaw.svg` | `vendor-logos/svg/openclaw-color.svg`, `vendor-logos/svg/openclaw-text.svg` |
| Hermes Agent | `vendor-logos/svg/hermes-agent.svg` | `vendor-logos/svg/hermes-agent-text.svg`, `vendor-logos/svg/nous-research.svg`, `vendor-logos/svg/nous-research-text.svg` |

## MCP And Client Logos

| Logo | Preferred file | Other files |
| --- | --- | --- |
| Model Context Protocol | `vendor-logos/svg/model-context-protocol.svg` | `vendor-logos/svg/mcp.svg`, `vendor-logos/svg/mcp-text.svg` |
| Cursor | `vendor-logos/svg/cursor.svg` | - |
| Windsurf | `vendor-logos/svg/windsurf.svg` | - |
| OpenCode | `vendor-logos/svg/opencode.svg` | - |
| Cline | `vendor-logos/svg/cline.svg` | - |
| GitHub Copilot | `vendor-logos/svg/github-copilot.svg` | - |
| Antigravity | `vendor-logos/svg/antigravity.svg` | `vendor-logos/svg/antigravity-color.svg`, `vendor-logos/svg/antigravity-text.svg`, `vendor-logos/svg/google-gemini.svg`, `vendor-logos/svg/google.svg` |

## Framework And Provider Logos

| Logo | Preferred file | Other files |
| --- | --- | --- |
| Vercel AI SDK | `vendor-logos/svg/vercel-ai-sdk.svg` | `vendor-logos/svg/vercel.svg` |
| OpenAI Agents SDK | `vendor-logos/svg/openai.svg` | `vendor-logos/svg/openai-text.svg` |
| CrewAI | `vendor-logos/svg/crewai.svg` | - |
| LiveKit Agents | `vendor-logos/svg/livekit.svg` | - |
| ElevenLabs Conversational AI | `vendor-logos/svg/elevenlabs.svg` | - |

## Distribution And Tooling Logos

| Logo | Preferred file | Other files |
| --- | --- | --- |
| GitHub | `vendor-logos/svg/github.svg` | - |
| npm | `vendor-logos/svg/npm.svg` | - |
| PyPI | `vendor-logos/svg/pypi.svg` | - |
| Python | `vendor-logos/svg/python.svg` | - |
| X | `vendor-logos/svg/x.svg` | - |

## Comparison Anchor

| Logo | Preferred file | Other files |
| --- | --- | --- |
| Mem0 | `vendor-logos/svg/mem0-light.svg` | - |

## Proof Boundary

Brand media is not final live proof. Use a separate approved capture and verification pass before making real-wallet, physical-device, or live-runtime proof claims.
