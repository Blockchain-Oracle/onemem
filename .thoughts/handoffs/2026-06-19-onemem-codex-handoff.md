# Handoff: OneMem = claude-mem architecture + decentralized proof

**Date:** 2026-06-19
**Status:** reset handoff. This is the direction Codex should continue from.

## Read this first

OneMem should not reinvent the runtime worker/viewer system. The correct product
shape is:

1. Adapt claude-mem's proven worker/hooks/viewer architecture.
2. Keep OneMem's differentiation: Sui TraceSession/ActionCall proof, Walrus
   blobs, Seal encryption, MemWal, namespace capabilities, and public verify.

claude-mem is open source: https://github.com/thedotmack/claude-mem.

Verified source evidence from a fresh clone on 2026-06-19:

- Cursor hooks exist: `cursor-hooks/hooks.json` and `src/services/integrations/CursorHooksInstaller.ts`.
- Windsurf hooks exist: `src/services/integrations/WindsurfHooksInstaller.ts`.
- Codex hooks exist: `plugin/hooks/codex-hooks.json`.
- OpenClaw integration exists: `openclaw/` and `src/services/integrations/OpenClawInstaller.ts`.
- Local worker/viewer exists: `plugin/scripts/worker-service.cjs`, `plugin/ui/viewer.html`, and `plugin/ui/viewer-bundle.js`.
- I did not find a verified `OpenClaude` integration in the source clone. Use
  **OpenClaw** unless a concrete OpenClaude source file is later found.

## What OneMem got wrong

The previous architecture treated Cursor and Windsurf as MCP-only. That was too
broad. The honest distinction is now:

- Cursor/Windsurf: hook-capable in claude-mem; OneMem hook ports are pending.
- Cline/OpenCode and similar MCP clients: MCP tools only until native hooks are
  proven.
- Claude Code/Codex: OneMem has local hook scripts and now starts/posts to the
  local worker hot path.
- Frameworks like Vercel AI, CrewAI, LiveKit, ElevenLabs: deployed adapters, not
  local connected apps.

The UI also led with proof metadata instead of readable content. That misses the
claude-mem lesson: a local memory dashboard must feel alive immediately. Users
should open it and read observations, memories, prompts, projects, and sessions.
Proof should be visible, but not block legibility.

## Current implementation state after this reset slice

- `@onemem/worker` exists as a local HTTP/SSE worker with SQLite-backed sessions,
  observations, proof jobs, and tests.
- A worker binary exists at `packages/worker/bin/onemem-worker`.
- Claude Code hook scripts now post readable session/observation/end events to
  the local worker before any on-chain work.
- Codex hook scripts now do the same local-worker hot path.
- The dashboard `/memories` page now reads local worker observations through a
  same-origin proxy and shows readable previews before the chain receipt table.
- The dashboard runtime catalog now marks Cursor and Windsurf as
  `hook-port-pending`, not MCP-only, and keeps their controls disabled until the
  OneMem ports are built.
- The dashboard now uses vendor logo assets from `packages/brand/vendor-logos`
  through a local allowlisted route instead of generic icons where possible.

## Architecture target

### Hot path

Runtime hook -> local worker -> local SQLite -> SSE -> local dashboard.

That path must be fast and readable. It records plaintext previews locally first.
The dashboard should show the observation immediately with proof status:
`local -> queued -> anchored -> verified`.

### Proof path

The worker drains proof jobs asynchronously:

Local observation -> Seal/Walrus/Sui SDK anchor -> TraceSession/ActionCall ->
public verify.

The chain path must not block local legibility. If Sui/Walrus/Seal are slow or
misconfigured, the row remains readable with an honest proof status.

### Surfaces

- Local dashboard: no-login inspector of this machine. Shows local worker
  content first, chain receipts second.
- Hosted dashboard: namespace/account view for deployed adapters and wallet
  flows.
- Public verify: accountless Merkle-chain proof for a TraceSession.

## Runtime taxonomy

| Runtime class | Examples | Local dashboard behavior |
|---|---|---|
| Native/trusted hooks shipped | Claude Code, Codex | controllable local runtime; hook -> worker -> dashboard |
| Hook port pending | Cursor, Windsurf | local read-only catalog row; no toggle until OneMem ports claude-mem's installers |
| Runtime provider | OpenClaw, Hermes | local/native integration, depending on package behavior |
| MCP tools only | Cline, OpenCode, Copilot-style clients until proven otherwise | explicit OneMem tools only; no auto-capture claim |
| Deployed adapter | Vercel AI, OpenAI Agents, CrewAI, LiveKit, ElevenLabs | not a local app; appears by namespace/environment from chain |

## Next implementation slices

1. Finish validation of this reset slice: worker tests, plugin tests, dashboard
   typecheck/test, and a browser smoke once browser control is available.
2. Port Cursor hooks from claude-mem's `cursor-hooks/` and
   `CursorHooksInstaller.ts` into OneMem's worker API.
3. Port Windsurf hooks from claude-mem's `WindsurfHooksInstaller.ts`.
4. Continue dashboard rebuild toward claude-mem parity: projects, sessions,
   prompts, readable memory text, compact navigation, no broken long-scroll
   sections.
5. Keep proof asynchronous and honest: never claim on-chain hook coverage unless
   there is a real TraceSession object id, digest(s), and verify output.

## Resume prompt

You are taking over OneMem. Build it as claude-mem's worker/hooks/viewer
architecture plus OneMem's decentralized proof layer. First read this handoff,
then study https://github.com/thedotmack/claude-mem, especially
`cursor-hooks/`, `src/services/integrations/CursorHooksInstaller.ts`,
`src/services/integrations/WindsurfHooksInstaller.ts`,
`plugin/hooks/codex-hooks.json`, `openclaw/`, and the worker/viewer files.

Do not call Cursor/Windsurf MCP-only anymore. Call them hook-port-pending until
OneMem ports and proves those integrations. Do not claim OpenClaude unless an
exact source file is found; the verified integration is OpenClaw. Lead with
readable local content and make proof a status layer. Test UI changes in a real
browser when browser control works; otherwise document that visual verification
is still unclaimed.
