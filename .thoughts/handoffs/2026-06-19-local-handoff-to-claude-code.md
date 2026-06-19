# Handoff: OneMem ClaudeMem Architecture Reset

## Objective

Continue the OneMem reset using ClaudeMem as the local UX/architecture reference: worker-first readable memories and sessions, then decentralized proof via Sui/Walrus/Seal/MemWal. Do not treat OneMem as a generic on-chain receipt table. Make the local dashboard feel useful like ClaudeMem while keeping OneMem's decentralized proof layer honest.

## Current State

- Repo: `/Users/abu/dev/hackathon/sui-overflow/onemem`
- ClaudeMem viewer reference is running at `http://127.0.0.1:37701/`.
- OneMem dashboard is running at `http://127.0.0.1:4040/`.
- OneMem worker was verified at `http://127.0.0.1:4041/` in local-only mode, then the Codex-owned process was stopped before handoff. Restart it before checking `/memories`.
- Chrome extension control works again from Codex.
- Real UI comparison was finally performed:
  - ClaudeMem viewer shows project selector, readable memory cards, category chips, runtime/source labels, and useful memory summaries.
  - OneMem `/memories` still needs more polish, but now has a worker-backed readable local feed ahead of on-chain metadata receipts.
- Important boundary: local worker feed proof is local-only unless the worker is started with namespace/capability/signer env and emits on-chain TraceSession evidence.

## Key Decisions

- Adapt ClaudeMem's architecture and UX patterns, do not reinvent:
  - Hooks post to a local worker.
  - Worker stores readable observations immediately.
  - Dashboard reads worker/SSE first.
  - Chain receipts/proofs are secondary and must not block the readable UX.
- Cursor and Windsurf are not MCP-only. ClaudeMem has hook installers; OneMem should call them `hook-port-pending` until ports land.
- OpenClaude remains unverified; use OpenClaw unless an exact source file proves OpenClaude support.
- Framework adapters like Vercel AI, OpenAI Agents, CrewAI, LiveKit, and ElevenLabs are not local controllable apps. They belong to hosted/framework trace surfaces, not the local app control list.
- Vendor logos must come from `packages/brand/vendor-logos`, not generic icons.

## Artifacts

- Main reset handoff: `/Users/abu/dev/hackathon/sui-overflow/onemem/.thoughts/handoffs/2026-06-19-onemem-codex-handoff.md`
- Target architecture docs: `/Users/abu/dev/hackathon/sui-overflow/onemem/.thoughts/design/2026-06-19-target-architecture/`
- Runtime docs updated around Cursor/Windsurf and local-vs-hosted taxonomy:
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/docs/03-target-runtimes/README.md`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/docs/05-our-architecture/03-runtimes/README.md`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/docs/05-our-architecture/03-runtimes/deferred-runtimes.md`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/docs/05-our-architecture/03-runtimes/mcp-server.md`

## Files Changed In This Slice

- Worker/local hot path:
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/worker/`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/plugin-claude-code/scripts/inject.js`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/plugin-claude-code/scripts/observe.js`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/plugin-claude-code/scripts/summarize.js`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/plugin-codex/scripts/inject.js`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/plugin-codex/scripts/observe.js`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/plugin-codex/scripts/summarize.js`
- Dashboard UX and logos:
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/app/memories/LocalMemoryFeed.tsx`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/app/api/worker/observations/route.ts`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/app/api/worker/sessions/route.ts`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/app/api/worker/stream/route.ts`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/app/vendor-logo/[file]/route.ts`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/components/RuntimeLogo.tsx`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/lib/local-worker.ts`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/lib/vendor-logos.ts`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/lib/runtimes.ts`
  - `/Users/abu/dev/hackathon/sui-overflow/onemem/packages/dashboard/styles/onemem.css`

## Commands And Results

- `pnpm --filter @onemem/dashboard lint` passed after formatting.
- `pnpm --filter @onemem/dashboard typecheck` passed.
- `pnpm --filter @onemem/dashboard test -- lib/runtimes.test.ts` passed earlier: 6 files, 21 tests.
- `curl http://127.0.0.1:4040/vendor-logo/codex-color.svg` now returns `200 OK` and actual SVG content.
- Before the Codex-owned worker was stopped, `curl http://127.0.0.1:4040/api/worker/observations` returned one local smoke observation:
  - session `codex-smoke-2026-06-19`
  - tool `exec_command`
  - output preview `typecheck passed; local worker feed smoke observation`
- Before the worker was stopped, `curl http://127.0.0.1:4040/api/worker/sessions` returned local worker sessions, including Claude Code and Codex sessions.

## Open Questions

- Should OneMem import more ClaudeMem viewer behaviors directly, such as welcome/onboarding modal, memory type filters, and deeper project/session selectors?
- Should worker observations be seeded from current Claude Code/Codex hooks automatically on every active session start, or only when tool calls happen?
- How should local-only observations transition to on-chain TraceSession proof in the default demo path without exposing private keys in docs or UI?

## Risks Or Blockers

- The repo has many dirty changes from multiple work streams. Do not revert unrelated changes.
- The upgraded `LocalMemoryFeed` was linted and typechecked, and endpoints were checked, but the final post-edit Chrome screenshot was interrupted. Reload `/memories` and visually verify before claiming UI polish is complete.
- OneMem MCP memory write failed from Codex because the MCP memory tool is not configured in this session. Do not assume durable OneMem memory writes are working until config is fixed.
- The local worker was started by Codex and intentionally stopped before handoff. Restart it with the command below.

## Next Steps

1. Restart local worker if needed:
   ```sh
   cd /Users/abu/dev/hackathon/sui-overflow/onemem
   node packages/worker/bin/onemem-worker
   ```
2. Open `http://127.0.0.1:37701/` and dismiss the ClaudeMem welcome modal. Inspect the actual ClaudeMem card list.
3. Open `http://127.0.0.1:4040/memories`, reload, and visually verify:
   - vendor logos load,
   - readable local memory section appears first,
   - project/session/runtime context is visible,
   - on-chain metadata table is clearly secondary,
   - there is no Next.js error overlay.
4. Compare OneMem against ClaudeMem and fix the next concrete UI gaps, especially:
   - better memory-card hierarchy,
   - project/session filter ergonomics,
   - stronger empty states,
   - avoiding raw tool-log feel where a memory summary is available.
5. Add/extend tests for `/api/worker/sessions` and local feed render behavior.
6. Once local UX is solid, resume live hook proof work:
   - Claude Code/Codex hook -> worker -> dashboard -> on-chain TraceSession verify.

## Resume Prompt

Continue from `/Users/abu/dev/hackathon/sui-overflow/onemem/.thoughts/handoffs/2026-06-19-local-handoff-to-claude-code.md`. Use ClaudeMem's actual viewer at `http://127.0.0.1:37701/` as the UX reference and OneMem at `http://127.0.0.1:4040/memories` as the implementation target. First reload and visually verify the latest OneMem local feed/logo fixes, then fix the next concrete UI gaps so OneMem reads like a local memory viewer first and an on-chain proof viewer second.
