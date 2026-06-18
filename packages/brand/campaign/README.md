# OneMem Campaign Assets

This folder contains the launch/campaign layer for OneMem brand work. The main
message is memory-first:

> One memory layer for every agent.

OneMem is decentralized persistent memory for AI agents. Proof and trace visuals
belong in the confidence layer, not the headline.

## Asset Inventory

| File | Size | Use |
| --- | ---: | --- |
| `readme-hero.svg` / `.png` | 1400 x 360 | Shallow GitHub README banner |
| `x-header.svg` / `.png` | 1500 x 500 | X profile header for `x.com/OneMemAI` |
| `link-card.svg` / `.png` | 1200 x 630 | Link-preview/start-here social card |
| `tools-grid.svg` / `.png` | 1600 x 900 | Supported tools, runtimes, providers, and core stack |
| `architecture.svg` / `.png` | 1920 x 1080 | Designed architecture/flow diagram |
| `motion-storyboard.svg` / `.png` | 1920 x 1080 | Six-beat storyboard for HyperFrames or Remotion |

SVG is the source of truth. PNG exports are upload artifacts generated from the
SVG source dimensions.

## Public Identity

- Product: OneMem
- Campaign domain: `onemem.xyz`
- X handle: `@OneMemAI`
- X URL for artwork: `x.com/OneMemAI`
- GitHub: `github.com/Blockchain-Oracle/onemem`
- Target docs: `docs.onemem.xyz`
- Confirmed npm entry points during this pass: `@onemem/sdk-ts`, `@onemem/mcp`
- Confirmed PyPI provider packages during this pass: `hermes-onemem`,
  `onemem-crewai`, `onemem-livekit`, `onemem-elevenlabs`
- Python SDK source: `github.com/Blockchain-Oracle/onemem/tree/main/packages/sdk-python`

Check DNS/docs/package status again before using copy that says a link is live.

## Regenerate

From the repository root:

```sh
node packages/brand/campaign/generate-campaign-assets.mjs
rsvg-convert -w 1400 -h 360 packages/brand/campaign/readme-hero.svg > packages/brand/campaign/readme-hero.png
rsvg-convert -w 1500 -h 500 packages/brand/campaign/x-header.svg > packages/brand/campaign/x-header.png
rsvg-convert -w 1200 -h 630 packages/brand/campaign/link-card.svg > packages/brand/campaign/link-card.png
rsvg-convert -w 1600 -h 900 packages/brand/campaign/tools-grid.svg > packages/brand/campaign/tools-grid.png
rsvg-convert -w 1920 -h 1080 packages/brand/campaign/architecture.svg > packages/brand/campaign/architecture.png
rsvg-convert -w 1920 -h 1080 packages/brand/campaign/motion-storyboard.svg > packages/brand/campaign/motion-storyboard.png
```

## Designer Notes

- Match the rendered product UI from `apps/landing` and `packages/dashboard`:
  light-first cdr-kit surfaces, subtle grey grid lines, white cards, warm black
  text, indigo primary, verify green, and Sui chain blue.
- Avoid beige/brown-heavy background panels. Use cdr dark only for contained
  code/vault/video surfaces.
- Use indigo for memory and runtime identity.
- Use verify green only for persistence, provenance, or proof-passed moments.
- Use Sui blue only for chain/storage rails.
- Show `MemoryNamespace` as the center of the system.
- Show `NamespaceCapability` as access and sharing authority.
- Draw Seal, Walrus, MemWal, and Sui as the substrate, not as separate products
  competing for attention.
- Use third-party logos only for truthful integration/provider/runtime
  identification. Do not imply endorsement.
- In artwork, show the X mark with `x.com/OneMemAI` instead of leaving the
  handle as bare text.

## Copy Guardrails

Use:

- "One memory layer for every agent."
- "Decentralized persistent memory for AI agents."
- "Add, search, share, and revoke AI memory on Sui."
- "Portable memory across Claude Code, Codex, OpenClaw, Hermes, MCP, and AI frameworks."

Avoid:

- "Stop trusting agents."
- "Etherscan for AI agents."
- "Verify your agent."
- Any wrong spelling that confuses OpenClaw with another runtime.
- Any copy that makes OneMem sound like only a trace viewer.
