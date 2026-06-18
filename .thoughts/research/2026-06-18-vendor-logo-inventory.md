# Reality Research: OneMem Vendor Logo Inventory

## Scope

Collect local logo assets for OneMem's implemented ecosystem: protocol stack,
runtime plugins, MCP targets, framework providers, SDK/package tooling, and
public/social surfaces.

## Sources Checked

- Repo implementation docs:
  - `docs/03-target-runtimes/README.md`
  - `docs/04-framework-providers/README.md`
  - `packages/plugin-*`
  - `packages/provider-*`
  - `packages/mcp-server`
- Simple Icons:
  - `simple-icons@16.23.0`
  - https://simpleicons.org/
  - https://github.com/simple-icons/simple-icons
- Lobe AI icon set:
  - `@lobehub/icons-static-svg@1.91.0`
  - https://github.com/lobehub/lobe-icons
- Product/official pages:
  - https://mem0.ai/
  - https://walrus.xyz/
  - https://docs.wal.app/
  - https://seal-docs.wal.app/
  - https://vercel.com/geist/brands
  - https://www.sui.io/brand

## Verified Facts

- The implemented native runtime packages are Claude Code, Codex, OpenClaw, and
  Hermes Agent.
- The MCP/runtime target set in project docs includes Cursor, Windsurf, OpenCode,
  Cline, VS Code/GitHub Copilot, Antigravity/Gemini-family clients, Claude Code,
  Codex, and generic stdio MCP clients.
- Framework provider packages exist for Vercel AI SDK, OpenAI Agents SDK,
  CrewAI, LiveKit Agents, and ElevenLabs Conversational AI.
- Simple Icons directly provides SVGs for Sui, Claude, Claude Code, Anthropic,
  Cursor, Windsurf, CrewAI, LiveKit, ElevenLabs, Model Context Protocol,
  OpenCode, Cline, GitHub Copilot, Google Gemini, Vercel, TypeScript, Python,
  Node.js, npm, PyPI, pnpm, Next.js, React, Docusaurus, GitHub, Google, and X.
- Lobe static SVG provides useful AI/runtime-specific marks for OpenAI, Codex,
  Hermes Agent, Nous Research, Antigravity, OpenClaw, Claude Code, and MCP.
- Mem0 exposes a logo URL in its site metadata.
- Walrus exposes a logo URL in site metadata and Walrus/Walrus Docs SVG marks in
  docs assets.
- Seal docs expose an SVG logo at `/img/logo.svg`.
- Vercel's Geist brand page exposes an AI SDK wordmark shape in the public page
  payload; that was stored as a local `currentColor` SVG.

## Inferences

- For MemWal/Walrus Memory visuals, use the Walrus Memory/Walrus Docs mark until
  a standalone MemWal mark is provided.
- For VS Code Copilot visuals, the GitHub Copilot mark is the clearest local
  representation because the product support is MCP through Copilot-style client
  surfaces, not a standalone OneMem VS Code extension.

## Unknowns And Questions

- `OpenClaude` was mentioned in conversation, but no OneMem package, docs target,
  or repo integration named OpenClaude was found. The implemented package is
  OpenClaw (`@onemem/oc-onemem`).
- `CYRs` is unclear as a spoken alias. Cursor and Cline are covered; any separate
  product should be clarified before adding a logo.
- No standalone MemWal logo was found.

## Not Included

- No trademark/legal clearance beyond recording source URLs and usage cautions.
- No generated replacement logos for missing vendor marks.
- No PNG exports for every SVG; video tools can rasterize these as needed.
