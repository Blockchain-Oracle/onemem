---
id: research-2026-06-19-integration-taxonomy-reset
type: research
date: 2026-06-19
---

# Research: Integration Taxonomy Reset

## Scope

This artifact consolidates four read-only audit threads created after the
dashboard/integration model became confusing:

- Local agent hosts:
  `019edf8a-8e9f-7561-a10b-fd9af17f9e07`
- Cloud hosts and framework adapters:
  `019edf8a-9136-7410-ae6a-a5049dd35cd8`
- Local worker/dashboard and ClaudeMem parity:
  `019edf8a-9459-7cf0-a3cf-15c439becfa7`
- Product IA and claim honesty:
  `019edf8a-98c8-7910-9fe8-6aa682af5d6f`

The cloud/framework audit also wrote:
`/Users/abu/Documents/Codex/2026-06-19/onemem-cloud-framework-adapters-audit/outputs/onemem-cloud-framework-adapters-audit.md`.

## Summary

OneMem should not present every integration as a local app. The correct model is
a capability taxonomy: local agent hosts, cloud/server runtime hosts, MCP
clients, framework adapters, protocol surfaces, local dashboard, and hosted hub.

The current dashboard over-flattens those categories. `packages/dashboard/lib/runtimes.ts`
hard-codes native hosts and framework libraries into one `KNOWN_RUNTIMES` list
with broad `coverage: "enforced"` labels, while `/apps` UI copy presents local
runtime policy controls. That makes Vercel AI SDK, LiveKit, ElevenLabs, CrewAI,
and OpenAI Agents look like local connected apps even though they are libraries
embedded in user applications.

## Current Classification

| Surface | Category | Runtime location | Honest dashboard treatment |
|---|---|---|---|
| Claude Code | Local agent host | User machine | Native hooks plus MCP tools; can become ClaudeMem-like after local worker exists. |
| Codex | Local agent host | User machine | MCP tools baseline; optional trusted hooks. Do not claim `codex exec` hook coverage. |
| Cursor | MCP client | User machine | MCP memory/search/verify tools only unless native hooks/extensions are built and proven. |
| Windsurf / Cline / OpenCode | MCP clients | User machine | MCP tools only unless native integrations are built and proven. |
| OpenClaw | Runtime host plugin | Local or cloud/server OpenClaw process | Native plugin activity after evidence; cloud deployments should read through shared namespace/hosted surfaces, not localhost assumptions. |
| Hermes | Runtime provider/plugin | Hermes process/profile | Runtime provider; activity appears after provider emits traces. |
| Vercel AI SDK | Framework adapter | User JS/TS app, server, serverless, or cloud | Available adapter catalog row; activity only after `environment=vercel-ai` traces exist. |
| OpenAI Agents SDK | Framework adapter | User JS/TS app process | Available adapter catalog row; activity only after emitted traces. |
| CrewAI | Framework adapter | User Python app process | Explicit tracer/helper package; not a native provider yet. |
| LiveKit | Voice framework adapter | User Python LiveKit Agents process | Explicit session event tracer; not a native LiveKit memory subclass yet. |
| ElevenLabs | Voice framework adapter | User Python ElevenLabs Conversation process | Callback/client-tool tracer; not a native memory adapter yet. |
| MCP server | Protocol surface | Client-launched subprocess | Enables agent-invoked memory/search/verify/share tools; does not see all host actions by itself. |
| Local dashboard | Developer daily driver | User machine | Should read local worker/cache first, then proof state. |
| Hosted dashboard | Hosted hub | Vercel/app host | Onboarding, CLI pairing, sharing, capability flows, public verify. Not a replacement for local inspection. |

## Key Findings

### 1. ClaudeMem parity requires a local worker, not just a Next dashboard

ClaudeMem starts a localhost worker from hooks, writes observations/prompts/
summaries into a local store immediately, serves the viewer from that worker,
and streams updates through SSE. OneMem currently has hook scripts that buffer
transient JSON/JSONL and flush proof at Stop, while the local dashboard reads
Sui events and has no durable local observation feed.

Implication: OneMem needs two truths:

- local worker/cache truth: observed locally, queued, summarized, searchable;
- proof truth: anchored on Sui, stored on Walrus, encrypted/decryptable with
  Seal, independently verifiable.

The UI must label local rows as `local`, `queued`, `submitted`, `anchored`,
`verified`, or `failed`; it must not treat unanchored local rows as proof.

### 2. The local dashboard event read path has a correctness bug

The dashboard uses `addr.packageId` for `TraceSessionOpenedEvent` and
`ActionCallEmittedEvent` queries. The CLI/SDK use
`originalPackageId || packageId` for event reads. After upgrades, the dashboard
can show zero sessions while direct trace verification still works.

Immediate fix: use an event package id helper in dashboard trace/memory reads.

### 3. Memory rows are not equivalent to trace rows

The dashboard memory inventory intentionally derives from on-chain
`memwal_write` ActionCalls. Trusted hook proof sessions can create trace calls
without creating memory writes, so an empty Memories page after a trace proof is
not automatically a query bug. It means no `memwal_write` metadata exists, or
the memory write path did not pass trace/session args.

Immediate fix: make the empty state and docs say this plainly. Later fix: local
worker should capture observations immediately and separately queue memory/proof
jobs.

### 4. The visible IA should use "Integrations", not "Apps"

`Apps` mixes native runtime hosts, MCP-only clients, framework adapters, and
cloud/server integrations. The route can remain `/apps` for compatibility, but
the label should become `Integrations`.

Recommended sections:

- Native runtimes
- MCP clients
- Framework adapters
- Protocol surfaces
- Hosted/cloud

### 5. Framework adapter docs are ahead of some implementations

Several architecture docs describe native memory-provider ergonomics as if they
exist, while package READMEs/source show current packages are explicit tracer
wrappers plus explicit memory helpers. Current source/package README must be
treated as truth; older architecture docs should be rewritten or marked planned.

Affected examples:

- CrewAI: current package is callbacks + explicit memory helper, not native
  `memory_config={"provider":"onemem"}`.
- LiveKit: current package observes `AgentSession` events, not a native memory
  subclass.
- ElevenLabs: current package wraps callbacks/tools, not a native memory
  adapter.

### 6. Hosted dashboard should be called Hosted Hub

The hosted surface is for onboarding, wallet/provisioning, CLI pairing, sharing,
and public verification. It should not be framed as the full local dashboard.

Recommended copy boundary:

"Use Hosted Hub for onboarding, sharing, CLI pairing, and public verification.
Use the local dashboard for local memory/trace inspection."

## Capability Labels To Use

Replace broad `enforced/stored` language with a capability matrix:

- `native-hooks`: host lifecycle hooks can capture runtime activity.
- `trusted-hooks-required`: hooks exist but require host trust/review.
- `mcp-tools-only`: OneMem tools work, but host actions are not auto-captured.
- `framework-adapter`: records only when app code wraps/attaches OneMem.
- `runtime-provider`: installed into a runtime/provider system.
- `local-worker-backed`: writes through OneMem worker/cache.
- `chain-observed`: dashboard has seen on-chain sessions for this environment.
- `planned`: documented target, not shipped.

## Implementation Order

1. Fix dashboard event package reads.
2. Rename visible dashboard `Apps` label/copy to `Integrations`; keep route if
   safer.
3. Replace flat runtime metadata with integration metadata and capability tiers.
4. Move framework libraries into an "Available adapters" section, not active
   local runtime controls.
5. Use vendor logos from `packages/brand/vendor-logos` only for truthful
   integration identity, with no endorsement implication.
6. Rewrite empty states for Memories, Sessions, Integrations, and Hosted Hub.
7. Expand docs navigation for Local Dashboard, Hosted Hub, Coverage Tiers,
   Sharing/Capabilities, Public Verify, and per-integration pages.
8. Build OneMem local worker MVP:
   - `onemem worker start/status/stop`
   - localhost-only API
   - SQLite local cache
   - hook ingestion endpoints
   - SSE stream
   - proof queue statuses
9. Update Claude Code/Codex hooks to start/post to worker first, then queue proof
   flush.
10. Revisit framework native-provider ergonomics after shipped package APIs match
    docs.

## Claims To Stop Making

- Do not say "every runtime/framework" without immediately scoping to supported
  native plugins, MCP clients, and framework providers.
- Do not claim Cursor/Windsurf/Cline/OpenCode automatic trace capture.
- Do not claim MCP-only clients behave like ClaudeMem.
- Do not claim framework adapters are connected local apps before they emit
  traces or heartbeats.
- Do not claim Memories will populate from trace-only hook proof.
- Do not claim hosted dashboard replaces local dashboard.
- Do not claim native CrewAI/LiveKit/ElevenLabs memory-provider behavior until
  those packages actually ship it.

## Immediate Product Direction

OneMem should be explained as:

"A decentralized persistent memory and trace layer for agents. Native plugins
and framework adapters can record encrypted memories and verifiable traces.
MCP clients can search, write, verify, replay, and share through OneMem tools.
The local dashboard is the developer inspection surface; Hosted Hub is for
onboarding, sharing, CLI pairing, and public verification."
