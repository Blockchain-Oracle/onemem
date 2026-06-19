# OneMem Vendor Logo Inventory

This folder keeps local logo assets for the ecosystem and runtime logos OneMem
needs in launch graphics, demo videos, logo grids, and motion storyboards.

Use `manifest.json` as the source of truth. It maps each product/runtime name to
local files, source URLs, aliases, and usage notes.

## Folders

- `svg/` - preferred vector assets.
- `png/` - raster assets only where an official clean SVG was not located.

## Usage Rules

- Use these logos only to identify truthful integrations, providers, runtimes,
  protocols, or tools OneMem supports or discusses.
- Do not recolor third-party marks unless the source logo is already monochrome
  or the brand guidelines allow it.
- Do not imply endorsement, partnership, or sponsorship.
- Third-party trademarks remain property of their owners.
- The implemented OneMem native runtime package is OpenClaw
  (`@onemem/oc-onemem`).
- No standalone MemWal logo was located in this pass. Use the Walrus Memory /
  Walrus Docs mark for MemWal/Walrus Memory visuals unless an official MemWal
  asset is later provided.

## Source Notes

- Simple Icons assets were copied from `simple-icons@16.23.0`; Simple Icons is
  CC0, but its disclaimer says brand trademarks and individual brand licenses
  still matter.
- Lobe static SVG assets were copied from `@lobehub/icons-static-svg@1.91.0`
  for AI/runtime-specific marks that are not present in Simple Icons.
- Mem0, Walrus, Walrus Docs, Seal, and Vercel AI SDK assets were fetched from
  live product/brand/docs pages and are listed individually in `manifest.json`.

## Quick Picks

- Core stack: `sui.svg`, `walrus-icon.svg`, `walrus-docs.svg`, `seal.svg`,
  `mem0-light.svg`.
- Runtime strip: `claude-code.svg`, `codex.svg`, `openclaw.svg`,
  `hermes-agent.svg`, `mcp.svg`.
- MCP/editor strip: `cursor.svg`, `windsurf.svg`, `opencode.svg`, `cline.svg`,
  `github-copilot.svg`, `google-gemini.svg`, `antigravity.svg`.
- Provider strip: `vercel-ai-sdk.svg`, `openai.svg`, `crewai.svg`,
  `livekit.svg`, `elevenlabs.svg`.
