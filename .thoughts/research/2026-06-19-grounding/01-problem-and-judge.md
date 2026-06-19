# Grounding Thread 01 — Problem & Judge: What is OneMem, why the headline is buried, dashboard legibility

**Thread:** problem-and-judge
**Date:** 2026-06-19
**Lens:** EXECUTION LOCATION determines PRODUCT SURFACE. (A) coding-agent runtimes on the user's own machine; (B) framework SDKs in the developer's deployed app; (C) MCP-only local clients.
**Posture:** read-only on product code; every claim grounded in source I read with file:line.

---

## 0. One-sentence truth of this surface (through the execution-location lens)

OneMem is genuinely **one thing** — *a verifiable, on-chain action-trace + memory layer where every agent action becomes a Merkle-chained Sui object anyone can re-verify* — but its surfaces (landing, local `/apps`, `/sessions`) present it as **"one memory layer for every runtime AND framework," flattening three incompatible execution locations into one list of toggle-able "connected apps,"** which is why a localhost dashboard ends up rendering ElevenLabs and Vercel AI with live Pause/Trace switches that those deployed apps can never see. The trace+replay headline (Pillar 2 — the actual end-user value) is **demoted to pillar "02"** behind the "memory layer for every runtime" framing, so the strongest, most honest claim is buried under the breadth claim that creates the dishonesty.

---

## 1. One-sentence definition (what OneMem IS, grounded)

> **OneMem is a verifiable cross-runtime memory + action-trace layer for AI agents: every memory write is an encrypted Walrus blob, every agent action (tool/MCP/skill call) is a Merkle-chained Sui `ActionCall` object, and anyone can independently re-verify the chain without trusting OneMem or any vendor.**

Source grounding:
- `docs/00-goal/GOAL.md:13` — "OneMem is the **verifiable, cross-runtime memory + execution-trace layer for AI agents**."
- `docs/00-goal/GOAL.md:25-33` — Pillar 2 is explicitly tagged "*This is the end-user-value headline feature.*"
- Read model is on-chain events: `packages/dashboard/lib/trace.ts:197-217` (`fetchRecentSessions` queries `TraceSessionOpenedEvent`), `trace.ts:101-104` (`verifyTraceChain`).

The definition is **coherent and real**. What is incoherent is the *presentation*, addressed below.

---

## 2. The ideal 60-second end-user story, centered on Pillar 2 (trace + replay)

This is the story the product should be organized around. It uses ONLY execution-location (A) — a coding agent on the user's own machine — because that is the only place "open one dashboard and watch it happen" is honest.

> "I told my agent on my laptop: *send 5 USDC to Maya.* It did. **Open OneMem's dashboard at `localhost:4040` → `/trace/<id>`** and I see the full tree: which wallet skill it called, which MCP server, the amount, the oracle price it read, parent→child order, timing. I click **Verify** — the page walks the Merkle chain of on-chain `ActionCall` objects and turns **chartreuse: Verified ✓**. The proof isn't OneMem's word; the hashes are on Sui. I paste the session ID into `app.onemem.xyz/verify/<id>` and send the link to Maya's accountant — **no login, no install** — and they watch the same chain verify itself. Nobody trusted me, OneMem, or any vendor."

Grounding the pieces exist:
- Trace tree + Verify drawer is the designated demo: `packages/dashboard/CLAUDE.md` "Headline view" — "`/trace/[session_id]` is THE demo moment. The Verify drawer turning the page chartreuse 'Verified ✓'."
- Public no-login verify: `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md:83`, `:153-207`.
- "send money / make a video / do research" use cases: `GOAL.md:30-32`; echoed in landing `apps/landing/app/landing-content.ts:10`, `:30` (`agent.run("send 5 USDC to Maya")`).

**The whole 60-second story lives in execution-location (A) + one hosted public-verify page. It needs ZERO framework adapters.** That is the tell: the headline does not require the breadth.

---

## 3. Is the breadth of integrations serving the headline or drowning it?

**Drowning it.** Evidence, top-down:

### 3a. The landing buries Pillar 2 under the breadth claim
- `apps/landing/app/page.tsx:34-37` — H1 is "One **memory layer** for every **agent runtime**." Memory + breadth lead. Trace is absent from the H1.
- `landing-content.ts:40-58` — Pillars ordered: 01 "Persistent memory", **02 "Action trace + replay"**, 03 "Cross-runtime". The end-user-value headline is the middle child.
- `page.tsx:38-43` — subhead's verb list is "search, replay proof metadata, and verify" — trace is one verb among three, framed as a memory feature, not the headline.
- `landing-content.ts:57` — "The same memory namespace and trace format across **every runtime and framework. One dashboard for all of them.**" — this single sentence is the seed of the dishonesty: it promises one dashboard for frameworks that cannot appear in the (local) dashboard.

### 3b. The integration strip flattens all three execution locations
- `landing-content.ts:61-71` — `INTEGRATIONS` is a flat list mixing **(A)** Claude Code, Hermes, OpenClaw; **(C)** Cursor; and **(B)** Vercel AI SDK, OpenAI Agents, CrewAI, LiveKit, ElevenLabs. No category boundary. A reader concludes all nine behave identically.

### 3c. The local `/apps` page renders all nine as controllable local apps — the core dishonesty
- `packages/dashboard/lib/runtimes.ts:24-90` — `KNOWN_RUNTIMES` hard-codes all nine into ONE list, every one labeled `coverage: "enforced"`, including `vercel-ai`, `elevenlabs`, `livekit`, `crewai`, `openai-agents`.
- `packages/dashboard/app/apps/AppsView.tsx:85-94` — page title "**Apps**", sub "Runtime trace policy and verifiable activity from your **local OneMem setup**." It explicitly frames everything as *local*.
- `AppsView.tsx:128` — every row shows a status dot ("active now / no sessions / trace off"); `:145-154` a **Pause** toggle; `:156-182` a **Trace capture** toggle; `:134-138` an "Enforced" coverage badge. So ElevenLabs gets a green/grey "live" dot and a Pause switch on the user's localhost.

**Verdict:** breadth is actively drowning and corrupting the headline. The single honest, demoable story (§2) is buried so the impossible breadth story can lead.

---

## 4. Is it coherent to present runtimes and deployed-app frameworks in the same product chrome?

**No — and source proves it is not merely confusing but functionally fake for category (B).**

The toggles on the local `/apps` page write to `~/.onemem/runtime-controls.json`:
- `packages/dashboard/app/api/runtimes/[id]/route.ts:34-38` → `updateRuntimeControl` → `packages/dashboard/lib/runtimes.ts:199-207` → `setRuntimeControl`.
- File location: `packages/sdk-ts/src/runtime-controls.ts:6` — `~/.onemem/runtime-controls.json` on the user's machine.

**Who ENFORCES that file?** Only the local host plugins, in their local hook scripts:
- `packages/plugin-claude-code/scripts/onemem-lib.mjs:152-159` — `traceCaptureEnabled(runtime)` reads the control and returns `paused !== true && traceCapture !== false`.
- `packages/plugin-claude-code/scripts/inject.js:22`, `observe.js:21`, `summarize.js:30` — each hook early-returns if `traceCaptureEnabled("claude-code")` is false.
- Same pattern in `packages/plugin-codex/scripts/onemem-lib.mjs`.

The framework providers run **in the developer's deployed app** (a server / serverless / cloud process), where `~/.onemem/runtime-controls.json` **does not exist and is never consulted**. Their packages are explicit tracers (`packages/provider-elevenlabs/tests/test_tracer.py`, `provider-livekit/tests/test_tracer.py`, `provider-crewai/tests/test_tracer.py`) — not hosts that read a localhost policy file.

**Therefore:** the Pause/Trace-capture toggles, the status dot, and the "Enforced" badge on the Vercel AI / ElevenLabs / LiveKit / CrewAI / OpenAI Agents rows of the **local** `/apps` page are **dead controls and fabricated status** — UI overlays on a per-environment chain read that knows nothing about any local process, attached to apps that physically cannot run on the user's machine. This is the exact dishonesty the owner flagged, and (per the prompt) the prior Codex audit's scope. It is NOT coherent.

The only honest shared chrome for (A) and (B) is the **read-only on-chain view**, because reads ARE uniform (§5). The *control/status/"connected app"* chrome is what breaks.

---

## 5. HOW reads actually work (owner Q3) — confirmed from source

Reads are **purely by-environment, from global Sui chain events**. There is no "connected local app" concept anywhere in the read path:

- `packages/dashboard/lib/trace.ts:197-203` — `fetchRecentSessions` queries `MoveEventType: <package>::events::TraceSessionOpenedEvent` globally, ordered descending. It does not know or care where the emitter ran.
- `trace.ts:204-216` — each session's `environment` is just a **string field** read off the chain event (`j.environment`).
- `packages/dashboard/lib/runtimes.ts:166-173` — the `/apps` "inventory" is built by reading those same chain sessions and **bucketing by `session.environment`** string, then *joining* the hard-coded `KNOWN_RUNTIMES` metadata and the local controls file on top. The "runtime" rows are an `environment`-string GROUP BY dressed up as connected apps.
- `packages/dashboard/lib/sessions.ts:147-161` — the `/sessions` view likewise sets `runtime: session.environment` from the chain event; `:163-168` even hard-codes lane CSS classes by string-match (`hermes`, `mcp`/`cursor`, else `claude`).

**Confirmed answer to Q3:** An adapter's traces are queried **by `environment` (and namespace), not by any connected local app.** A Vercel AI trace and a Claude Code trace are read by the *identical* code path — query the package's `TraceSessionOpenedEvent`, read the `environment` string, verify the Merkle chain. So the correct read model is **"namespaces/environments that emit traces you can query,"** exactly as the owner suspected. The "connected app with a heartbeat you can pause" model is a fiction layered on top of a stateless chain read.

---

## 6. Owner's open questions — answers & recommendations

### Q1 — What is the LOCAL dashboard for? What is the HOSTED dashboard for? Why both?

The doc `purpose-local-vs-hosted.md` already answers this well (`:11-19`, `:23-58`, `:61-111`); the PRODUCT just doesn't obey it. One-sentence each, founder-repeatable:

- **LOCAL (`localhost:4040`):** *"This is where I inspect, verify, and replay the traces of the agents running on THIS machine — my Claude Code / Codex / OpenClaw — with no login."* (Category A, plus MCP-only C tool activity.)
- **HOSTED (`app.onemem.xyz`):** *"This is where anyone onboards (gasless, no CLI), pairs their CLI, shares a namespace via Sui capability, and where ANYONE in the world re-verifies a trace with no login."* (Onboarding + sharing + the public `/verify/[id]` proof page.)
- **Why both:** Local can't do the cross-trust jobs — onboarding non-CLI users, the CLI-login browser callback, and public verification by non-owners — because verifiability has value only when a *non-owner* can verify (`purpose-local-vs-hosted.md:87-93`).

**Recommendation:** keep both, but the headline trace-tree+Verify demo is LOCAL; the public proof link is HOSTED. Neither should host framework "connected app" controls.

### Q2 — Do framework adapters belong in the LOCAL dashboard?

**No. Remove them from the local dashboard entirely.** They run in execution-location (B) — a deployed app, never the laptop — so a localhost "connected apps with Pause toggles" surface for them is fake (§4). Concretely:

- **REMOVE** `vercel-ai`, `openai-agents`, `crewai`, `livekit`, `elevenlabs` from `packages/dashboard/lib/runtimes.ts:24-90` (the local `/apps` controllable list).
- Their traces still **appear automatically** in `/sessions` and `/trace/[id]` whenever they emit to a namespace you can read — because reads are by-`environment` (§5). They are **queryable namespaces, not connected apps.** Nothing is lost by removing the chrome.
- For setup, the right home is **HOSTED**: an "API key / namespace + environment → see your deployed app's traces from anywhere" flow (the developer sets `OneMem({ namespace, delegateKey, environment: "vercel-ai-prod" })` in their app, then watches that environment's traces on the hosted hub). This is exactly the gap `purpose-local-vs-hosted.md` does NOT yet cover.
- **Hackathon scope:** keep Claude Code (A) as the demo spine; keep ONE framework provider (CrewAI or Vercel AI) as a real "deployed-app traces, queried by environment" proof, surfaced via hosted, not local `/apps`. The other four can be "available adapters (emit-and-query)" catalog entries with no chrome. Do **not** delete the provider packages (that would be a silent scope cut of a track-critical breadth signal) — just stop showing them as local connected apps.

### Q3 — How do you query an adapter's traces?

**By namespace + `environment`, from on-chain `TraceSessionOpenedEvent`s — not by connected local app.** Confirmed at `lib/trace.ts:197-216`, `lib/runtimes.ts:166-173`, `lib/sessions.ts:147-161` (§5). The read model is already correct; the *control/status chrome* layered on top is the lie.

---

## 7. North-star statement (proposed)

> **OneMem is the verifiable action-trace layer for AI agents.** When your agent does something — sends money, makes a video, runs research — every tool, MCP, and skill call becomes a Merkle-chained object on Sui that you (and anyone you share with) can re-verify from chain, without trusting OneMem or any vendor. Inspect and replay your own machine's agents locally; share a one-click public proof link with anyone. Memory portability and cross-runtime breadth are how the traces get there — not the pitch.

This leads with Pillar 2, demotes "every runtime/framework" from headline to mechanism, and is honest about execution location.

---

## 8. Ranked DRIFT list (most damaging first)

1. **Frameworks shown where they can't run (the fake controls).** Local `/apps` renders Vercel AI / ElevenLabs / LiveKit / CrewAI / OpenAI Agents as connected apps with live status dots, Pause toggles, and "Enforced" badges, even though those apps run in the developer's deployed environment and never read the localhost control file. `lib/runtimes.ts:24-90`; `AppsView.tsx:85-182`; enforcement only in `plugin-claude-code/scripts/onemem-lib.mjs:152-159`. *Most dishonest; this is what the owner flagged and Codex's earlier audit missed.*

2. **Pillar 2 (trace+replay) is buried.** The single demoable, honest, differentiated story leads with neither the H1 nor the pillar order. `apps/landing/app/page.tsx:34-37`; `landing-content.ts:40-58`. The breadth claim outranks the value claim.

3. **"Every runtime AND framework, one dashboard for all" — an impossible promise.** `landing-content.ts:57`. No single dashboard can host both (A) local processes and (B) deployed apps as controllable apps; reads can be unified, controls cannot.

4. **Local `/apps` purpose collapses under the flattening.** The page's own subtitle says "your local OneMem setup" (`AppsView.tsx:91`) while listing non-local frameworks — so the route has no coherent purpose: it's neither a clean local-host monitor nor a true cross-environment view. *This is the "local dashboard has no clear purpose" drift, localized to `/apps`. (The local dashboard's OTHER routes — `/trace`, `/sessions`, `/memories` — do have a clear purpose.)*

5. **Flat integration strip erases execution-location categories.** `landing-content.ts:61-71` lists hosts (A), MCP client Cursor (C), and frameworks (B) with no boundary, training every viewer to expect identical behavior.

6. **`coverage: "enforced"` overclaims uniformly.** Every runtime, including frameworks and MCP-only clients, is labeled "enforced" (`lib/runtimes.ts`), surfaced as an "Enforced" badge (`AppsView.tsx:12-14`), implying OneMem enforces trace capture on apps it cannot touch.

7. **Status fabrication for non-local rows.** `lib/runtimes.ts:114-121` computes "active now / active today / Nd ago" from chain-event recency and presents it as a *runtime heartbeat*; for a framework there is no heartbeat — only the last time someone's deployed app happened to emit to a readable namespace.

---

## 9. Codex verdicts

I could read `.thoughts/research/2026-06-19-integration-taxonomy-reset.md` (the consolidated audit). **The cloud/framework-adapters audit file at the prompt's path does not exist** — verified: `find /Users/abu/Documents/Codex/2026-06-19 ...` returns only the date dir, no `onemem-cloud-framework-adapters-audit` tree. So my verdicts are against the taxonomy-reset doc, which *references* that missing file (`:24`).

- **CONFIRMED — "current dashboard over-flattens; `KNOWN_RUNTIMES` hard-codes hosts + framework libs into one list with broad `enforced`, and `/apps` presents local runtime policy controls"** (taxonomy-reset `:35-38`). Exactly matches `lib/runtimes.ts:24-90` and `AppsView.tsx:85-182`. This is the central finding and it is correct.
- **CONFIRMED — "framework adapters should be 'available adapters', activity only after `environment=<x>` traces exist; reads are by environment"** (taxonomy-reset `:49-53`, `:147-148` `chain-observed`). Matches the by-`environment` read path at `lib/trace.ts:204-216`, `lib/runtimes.ts:166-173`.
- **CONFIRMED — "framework adapter docs are ahead of implementations; current packages are explicit tracers, not native providers"** (`:112-127`). Matches `provider-*/tests/test_tracer.py` being tracer wrappers, and contradicts `GOAL.md:46-49` which still promises native `memory_config={"provider":"onemem"}` ergonomics.
- **OVERREACHED / under-scoped — taxonomy-reset's REMEDY keeps framework adapters inside the local `/apps` chrome** (renamed `Apps`→`Integrations` with an "Available adapters" section: `:98-111`, `:158-160`). Through the execution-location lens this is **insufficient**: a *section* inside a localhost dashboard still implies these are things you manage locally. The owner's sharper insight — and mine — is that (B) frameworks belong on the **hosted** "set up environment → query your deployed app's traces" flow, or as pure queryable namespaces, **not in local chrome at all**. Codex treated this as an IA/labeling fix; it is an execution-location/product-surface fix.
- **CONFIRMED but OUT OF SCOPE here — the event-package-id read bug** (`:78-84`: dashboard uses `addr.packageId` while CLI uses `originalPackageId || packageId`). I see `lib/trace.ts:29-35` using `addr.packageId`; this is real but it's a correctness bug for another thread, not a problem-framing/legibility issue.

Net: Codex correctly **diagnosed the flattening** but **prescribed a relabel, not a relocation**. It did not center execution location, so it left frameworks in local chrome.

---

## 10. The single most important correction (concrete product/UI change, not a doc edit)

**Strip the five framework adapters out of the LOCAL dashboard, and make `/apps` a pure local-host monitor.**

Concretely:
1. In `packages/dashboard/lib/runtimes.ts:24-90`, reduce `KNOWN_RUNTIMES` to the apps that actually run on the user's machine and read the local control file: **Claude Code, Codex, OpenClaw, Hermes** (A), plus a clearly-labeled **MCP-tools-only** group for Cursor/Windsurf/Cline (C). **Delete the `vercel-ai`, `openai-agents`, `crewai`, `livekit`, `elevenlabs` rows from this list.**
2. Their traces keep showing automatically in `/sessions` and `/trace/[id]` because reads are by-`environment` (§5) — nothing is lost.
3. Move framework setup to a **hosted** "Environments / API-key" flow: developer configures `environment` + delegate key in their deployed app, then watches that environment's traces on `app.onemem.xyz`. This is the new hosted onboarding surface that does not exist yet.
4. Re-point the headline (landing H1 + pillar order) to **Pillar 2 trace+replay** per §7, and split the landing INTEGRATIONS strip (`landing-content.ts:61-71`) into labeled groups: *Local runtimes* / *MCP clients* / *Deployed-app adapters*.

This single change removes the fabricated Pause/Trace toggles and fake status dots on apps that can't run locally — killing the precise dishonesty the owner named — while costing zero real capability, because the on-chain read model already serves framework traces by environment.
