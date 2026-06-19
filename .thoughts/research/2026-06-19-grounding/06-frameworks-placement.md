# Grounding Thread 06 — Frameworks Placement

**Thread:** frameworks-placement
**Date:** 2026-06-19
**Posture:** READ-ONLY on product code. Truth from source, owner's POV centered.
**Lens:** EXECUTION LOCATION determines PRODUCT SURFACE. Framework adapters = **location B** (code embedded in a deployed app, runs on server/serverless/cloud — NOT the developer's laptop).

---

## 0. What I read (evidence base)

- `docs/00-goal/GOAL.md` — north star (Pillar 2 = trace+replay headline).
- `.thoughts/research/2026-06-19-integration-taxonomy-reset.md` — the consolidated Codex taxonomy reset (summarizes the cloud/framework audit).
- `docs/04-framework-providers/README.md` — current shipped-surface truth table.
- `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md` — authoritative local-vs-hosted purpose split.
- All 5 provider packages: README + source.
  - `packages/provider-vercel-ai/{README.md,src/index.ts}`
  - `packages/provider-openai-agents/{README.md,src/index.ts}`
  - `packages/provider-crewai/{README.md,onemem_crewai/tracer.py}`
  - `packages/provider-livekit/{README.md,onemem_livekit/tracer.py}`
  - `packages/provider-elevenlabs/{README.md,onemem_elevenlabs/tracer.py}`
- Dashboard read model: `packages/dashboard/lib/runtimes.ts`, `lib/sessions.ts`, `lib/trace.ts`.

**Could NOT read:** `/Users/abu/Documents/Codex/2026-06-19/onemem-cloud-framework-adapters-audit/outputs/onemem-cloud-framework-adapters-audit.md` — macOS TCC blocks all access to `~/Documents` (EPERM even with sandbox disabled). I rely on the taxonomy-reset doc, which explicitly consolidates that audit's findings (`integration-taxonomy-reset.md:23-24`), for the Codex verdicts below.

---

## 1. Truth of this surface through the execution-location lens (one paragraph)

All five framework adapters are **location-B code**: they are libraries a developer imports into an application they ship to *their* users — a Vercel-deployed Next.js route, an OpenAI Agents server, a CrewAI Python worker, a LiveKit Agents voice worker, an ElevenLabs conversation backend. None of this runs on the OneMem developer's laptop as a daily-driver agent; it runs wherever the developer deploys their app. What they actually emit is identical in shape to the native-runtime providers: a buffered list of `RuntimeCall`s flushed as **one Merkle-chained `TraceSession` Sui object**, stamped with an `environment` string (`"vercel-ai"`, `"openai-agents"`, `"crewai"`, `"livekit"`, `"elevenlabs"`). There is **no heartbeat, no "connected app" registration, no localhost socket** — the adapter's only footprint is on-chain events plus Walrus blobs. Therefore the read model is **purely chain-derived and global**: the dashboard queries every `TraceSessionOpenedEvent` of the package type and groups by `environment` (`lib/trace.ts:197-217`, `lib/runtimes.ts:167`). Putting these adapters in a **local** dashboard "Apps/connected runtimes" list with `coverage: "enforced"` (`lib/runtimes.ts:55-89`) is exactly the dishonesty the owner smelled: it implies a local app is connected and being policy-enforced on the user's machine, when in reality these are *namespaces that emit traces from somebody's deployed server*.

---

## 2. Per-provider truth + placement table

| Provider | (a) What's actually shipped | (b) Where the code RUNS | (c) Where traces should surface | (d) How traces are queried | (e) Cut from hackathon scope? |
|---|---|---|---|---|---|
| **Vercel AI SDK** (`@onemem/vercel-ai-provider`) | `withOneMem(model)` = AI SDK `wrapLanguageModel` middleware over `generate`/`stream`, fire-and-forget 1-call trace (`src/index.ts:44-94`). `createOneMemMemory()` = **explicit** recall/capture helper (`:108-122`). NOT a Mem0-native `provider:"onemem"`. | The developer's **deployed JS/TS app** — Vercel serverless/edge or any Node server. Never the dev's laptop. | **Hosted** "API-key/namespace → your app's traces" OR just a queryable namespace. NOT local "connected app." | Chain-derived: global `queryEvents` on `TraceSessionOpenedEvent`, grouped by `environment="vercel-ai"` (`lib/trace.ts:199-209`, `lib/runtimes.ts:167`). | **Keep** (it's the flagship JS adapter; cheapest to demo). Remove from local chrome. |
| **OpenAI Agents SDK** (`@onemem/openai-agents`) | `attachOneMem(runner)` listens to `agent_tool_start/end`, `agent_end`; buffers per-RunContext; flushes ONE multi-call trace at `agent_end` (`src/index.ts:43-129`). `createOneMemMemory()` explicit helper (`:148-162`). Real multi-call trace — the best Pillar-2 demo of the five. | The developer's **JS/TS app process / server**. Not the laptop. | **Hosted / queryable namespace.** Strong candidate as the *one* framework adapter to feature in a hosted "watch your deployed agent's traces" demo. | Same chain-derived model, `environment="openai-agents"`. | **Keep** — best trace richness. Remove from local chrome. |
| **CrewAI** (`onemem-crewai`) | `OneMemTracer` buffers `step_callback`/`task_callback`, `flush()` shells the `onemem-trace` Node CLI to write the trace (`onemem_crewai/tracer.py:49-166`). `create_onemem_memory()` explicit. Doc is explicit: NOT native `memory_config={"provider":"onemem"}` (`README.md:65-70`). | The developer's **Python app/worker process** (server/container). Not the laptop. Requires Node+npx on the host (`README.md:48-50`). | **Hosted / queryable namespace** at most. | Chain-derived, `environment="crewai"`. | **Cut to "planned/available adapter" for the demo.** Python→Node-CLI bridge adds host friction; not a demo-critical surface. |
| **LiveKit Agents** (`onemem-livekit`) | `OneMemTracer.attach(session)` subscribes to `conversation_item_added`/`function_tools_executed`, auto-flushes off-thread on `close` via Node CLI (`onemem_livekit/tracer.py:80-143`). Explicit memory helper. NOT a native LiveKit memory subclass (`README.md:58-63`). | The developer's **Python LiveKit Agents worker** (a deployed voice backend). Definitely not the laptop. | **Hosted / queryable namespace.** | Chain-derived, `environment="livekit"`. | **Cut to "planned/available adapter".** Voice infra is hard to demo live; low ROI for hackathon. |
| **ElevenLabs Conversational AI** (`onemem-elevenlabs`) | `OneMemTracer` wraps `callbacks()` (transcript turns) + `wrap_tools(ClientTools)` (client-tool calls), flushes off-thread on session end via Node CLI (`onemem_elevenlabs/tracer.py:74-156`). Explicit memory helper. NOT a native memory adapter (`README.md:67-72`). | The developer's **Python ElevenLabs Conversation backend**. Not the laptop. | **Hosted / queryable namespace.** | Chain-derived, `environment="elevenlabs"`. | **Cut to "planned/available adapter".** Same as LiveKit. |

**Cross-cutting truth on (a):** the Codex/`docs/04-framework-providers/README.md:8-12` framing is accurate — *all five are explicit trace wrappers + explicit memory helpers, none are Mem0-native `provider:"onemem"`.* The GOAL.md aspiration (`GOAL.md:36,44-49` "Same `provider:"onemem"` ergonomic as Mem0", `memory_config={"provider":"onemem"}`) is **not shipped** for any framework. That's a real gap between GOAL and reality, but it is honestly flagged in the current package README.

---

## 3. The read model, confirmed from source (owner question 3)

**The dashboard does NOT read "by connected local app." It reads by namespace/environment from chain.**

- `fetchRecentSessions()` (`lib/trace.ts:197-217`) issues a single `rpc.queryEvents({ query: { MoveEventType: \`${packageId}::events::TraceSessionOpenedEvent\` } })`. **No signer filter, no owner filter, no namespace filter.** It returns every trace session of this package type, globally, newest-first.
- Each event carries `environment`, `namespace_id`, `agent_id`, `captured_by_address` (`lib/trace.ts:204-215`).
- The "runtime"/app grouping is derived purely from that `environment` string: `groupByRuntime` keys on `session.environment || session.agentId || "unknown"` (`lib/runtimes.ts:167`; also `lib/sessions.ts:155`, `lib/stats.ts:30`).
- The adapters stamp that string at construction: Vercel `environment: "vercel-ai"` (`provider-vercel-ai/src/index.ts:49`), OpenAI `"openai-agents"` (`provider-openai-agents/src/index.ts:48`), CrewAI/LiveKit/ElevenLabs default `environment="crewai|livekit|elevenlabs"` in each tracer `__init__`.

**Conclusion:** an adapter's traces are queryable as *"sessions whose `environment` = X and/or `namespace_id` = Y,"* reconstructed from Sui events + Walrus blobs by anyone with the package id (and, for content decrypt, a Seal-authorized capability). There is **literally no notion of a framework adapter being a "locally connected app."** The current local dashboard fabricates that notion by hard-coding the adapters into `KNOWN_RUNTIMES` and rendering them as installable, policy-enforced runtime rows. **The data model already proves the owner right.**

One correctness note inherited from the Codex audit (`integration-taxonomy-reset.md:77-84`): `lib/trace.ts` reads use `packageId` rather than `originalPackageId || packageId`, so after a contract upgrade the dashboard can show zero sessions while direct verification still works. Real bug, but orthogonal to placement.

---

## 4. Answers to the owner's open questions

### Q1 — What is the LOCAL dashboard FOR? What is the HOSTED dashboard FOR? Why both?

Grounded in `purpose-local-vs-hosted.md:11-19,23-57,61-110`:

- **LOCAL (`localhost:4040`):** *"Inspect MY OWN agents' memory + traces, on my own machine, with no login — the daily driver."* Its natural content is **location-A** runtimes (Claude Code, Codex, OpenClaw/Hermes running on this machine). Reads `~/.onemem/credentials.json`, no auth.
- **HOSTED (`app.onemem.xyz`):** *"The login/onboarding/sharing/public-verify entry point for people NOT on the CLI — and the cross-device + deployed-app view."* This is where a developer who shipped a Vercel/CrewAI/LiveKit app and **set up a namespace** watches *their deployed app's* traces from anywhere, and where the public `/verify/[id]` page lives.
- **Why both:** local can't do the things that require a server (CLI-login callback, onboarding non-developers, sharing to non-installers, public verification, cross-device, **and watching deployed-app traces**) — `purpose-local-vs-hosted.md:86-93,226-231`.

The confusing part: the *purpose doc is already correct*, but the *implementation contradicts it* — framework adapters are wired into the LOCAL `KNOWN_RUNTIMES` list (`lib/runtimes.ts:55-89`). The doc says location-B belongs hosted; the code shows it local. **The product, not the doc, is the lie.**

### Q2 — Do framework adapters belong in the LOCAL dashboard?

**No. Unambiguously no.** They are location-B. They never run on the user's machine, never heartbeat to localhost, and the read model has no concept of them being "connected" there. Concretely:
- **REMOVE** all five (`crewai`, `livekit`, `elevenlabs`, `vercel-ai`, `openai-agents`) from `KNOWN_RUNTIMES` in `packages/dashboard/lib/runtimes.ts:55-89`, and from any local `/apps` "connected runtimes / install + enforce policy" chrome.
- **MOVE** them to a **hosted** surface: a "Framework adapters" / "Available adapters" catalog under an **environment/namespace** view — *"set up a namespace, drop `withOneMem`/`OneMemTracer` into your deployed app, then watch `environment=vercel-ai` traces here."* This is the hosted "API-key → your app's traces" flow the owner described. (Today's hosted hub has onboarding/share/verify but **no per-environment deployed-app trace view** — that's the new flow to build.)
- Alternatively (minimum viable): they are simply **queryable namespaces with no dedicated chrome** — they show up in the unified trace timeline as an `environment` lane, nothing more. This is honest and nearly free, because `lib/trace.ts` + `lib/sessions.ts` already group by `environment` with zero per-app metadata.

### Q2b — Should any be CUT for hackathon scope?

Yes. Recommended cut for the demo:
- **KEEP (feature 1, maybe 2):** **OpenAI Agents** (richest multi-call trace — best Pillar-2 demo) and **Vercel AI** (flagship JS, cheapest to wire). One hosted "deployed app → traces" demo with one of these proves the whole location-B story.
- **DEMOTE to "planned / available adapter" (ship the package, do NOT show as live local app, do NOT claim in the headline):** **CrewAI, LiveKit, ElevenLabs.** All three carry a Python→Node-CLI bridge (`npx` on the host) that is demo-hostile, and voice infra (LiveKit/ElevenLabs) can't be shown live in a hackathon judging slot. Per the no-silent-scope-cuts rule: the WHY is *integration friction + undemonstrable-in-a-slot*, not "unimportant" — they stay in the repo as available adapters with `planned`/`framework-adapter` tiers.

---

## 5. Codex verdicts (CONFIRMED / REFUTED / OVERREACHED)

Codex's framework findings reach me via `integration-taxonomy-reset.md` (the cloud/framework audit's own output file is TCC-blocked; noted in §0).

- **CONFIRMED** — *"Vercel AI SDK, LiveKit, ElevenLabs, CrewAI, OpenAI Agents look like local connected apps even though they are libraries embedded in user applications"* (`integration-taxonomy-reset.md:35-38`). Verified directly: `lib/runtimes.ts:55-89` hard-codes all five with `coverage:"enforced"`. **True and central.**
- **CONFIRMED** — *"current packages are explicit tracer wrappers plus explicit memory helpers"*, NOT native providers; CrewAI/LiveKit/ElevenLabs specifically (`integration-taxonomy-reset.md:112-127`). Verified against every source file. Exact match.
- **CONFIRMED** — read-correctness bug: dashboard uses `packageId` not `originalPackageId||packageId` (`integration-taxonomy-reset.md:77-84`). Verified at `lib/trace.ts:198-200`.
- **CONFIRMED** — capability-tier taxonomy (`framework-adapter`, `chain-observed`, `planned`) and "Available adapters, not active local runtime controls" (`integration-taxonomy-reset.md:138-149,158-161`) is the right model.
- **OVERREACHED / under-specified (the gap the owner flagged):** Codex's remediation is **too soft**. It says *move adapters into an "Available adapters" section* and *relabel `Apps`→`Integrations`* — i.e. keep them in the **local** dashboard, just in a different box (`integration-taxonomy-reset.md:106-110,158-161`). My source review says that's insufficient: location-B adapters should **leave the local dashboard's connected-runtime model entirely** and live on a **hosted per-environment/namespace trace view**, OR be reduced to plain queryable `environment` lanes. The prior Codex audit "missed that framework adapters don't belong in local at all" — **CONFIRMED as the owner stated**: the taxonomy-reset relocates them within local rather than out of it.
- No Codex framework claim was **REFUTED** outright; the failure is scope/strength of the fix, not factual error.

---

## 6. The single most important correction (concrete product/UI change)

**Delete the five framework adapters from the LOCAL dashboard's runtime model and relocate them to a hosted per-environment trace view (or to plain queryable `environment` lanes).**

Specifically:
1. **`packages/dashboard/lib/runtimes.ts:55-89`** — remove the `crewai`, `livekit`, `elevenlabs`, `vercel-ai`, `openai-agents` entries from `KNOWN_RUNTIMES`. The local `/apps` page should list ONLY location-A native runtimes (Claude Code, Codex, OpenClaw, Hermes) — the things that actually run on this machine and can be "connected" + policy-enforced.
2. **Replace `coverage:"enforced"`** for these (and the whole flat `enforced/stored` scheme) with a capability tier — but the framework adapters don't even appear here anymore; they become a **hosted** "Framework adapters → pick environment/namespace → see your deployed app's verifiable traces" surface (new hosted onboarding flow: create namespace, copy `withOneMem(...)`/`OneMemTracer.attach(...)` snippet, watch `environment=X` traces).
3. **Headline honesty:** stop implying "every framework, auto-captured, connected locally." The honest headline is: *"Native plugins capture your local coding agents; framework adapters emit verifiable traces from your deployed apps that you watch from the hosted hub or query by namespace."* Demo ONE framework (OpenAI Agents or Vercel) end-to-end on hosted; mark CrewAI/LiveKit/ElevenLabs as available-but-not-featured.

This is a product/UI deletion + relocation, not a docs edit. The `purpose-local-vs-hosted.md` doc is already right; the code must be made to obey it.
