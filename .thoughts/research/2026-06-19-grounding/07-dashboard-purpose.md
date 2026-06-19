# Grounding Report 07 — Dashboard Purpose: Local vs Hosted

**Thread:** dashboard-purpose-local-vs-hosted
**Date:** 2026-06-19
**Lens:** EXECUTION LOCATION determines PRODUCT SURFACE. Three locations — (A) coding agents on the user's own machine, (B) framework SDKs embedded in a deployed app on a server, (C) MCP-only clients running locally but only doing explicit OneMem-routed calls.
**Verdict in one line:** The docs describe a clean, defensible local-vs-hosted split — but the SHIPPED local dashboard code violates it by hardcoding five type-B framework adapters into the local "Apps" runtime-control monitor. The disease the owner smelled is real and it lives at `packages/dashboard/lib/runtimes.ts:24-90`.

---

## 1. What I read (ground truth)

### Docs
- `docs/00-goal/GOAL.md` — Pillar 4 dashboard routes; Pillar 2 (trace+replay) is the end-user headline.
- `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md` — the authoritative split doc.
- `route-apps.md`, `route-root.md`, `hosted-deploy.md`, `local-deploy.md`.

### Shipped source
- `packages/dashboard/lib/runtimes.ts` — the `KNOWN_RUNTIMES` table that powers local `/apps`.
- `packages/dashboard/app/apps/AppsView.tsx` + `app/apps/page.tsx` — the local "Apps" UI.
- `packages/dashboard/components/AppShell.tsx:16-20` — local sidebar nav (Overview / Memories / **Apps** / Sessions / Share).
- `packages/dashboard/app/page.tsx` — local Overview "Connected runtimes" panel.
- `packages/dashboard/lib/trace.ts`, `lib/stats.ts`, `app/api/overview/route.ts`, `app/api/runtimes/route.ts`, `app/api/runtimes/heartbeat/route.ts` — the read model.
- `apps/hosted-dashboard/app/` — full hosted route tree (`page.tsx`, `dashboard/page.tsx`, `verify/[session_id]`, `share`, `onboarding`, `cli-login`, `login`).

### Codex artifacts
- `.thoughts/research/2026-06-19-integration-taxonomy-reset.md` — read in full.
- `.../onemem-cloud-framework-adapters-audit.md` — EPERM / empty; its findings are consolidated into the taxonomy-reset artifact above (it is cited as one of the four source threads), so I graded against that consolidation.

---

## 2. The PURPOSE of each dashboard — stated so a confused founder can repeat it

**LOCAL dashboard (`localhost:4040`, `onemem dashboard`):**
> "The thing I open every coding session to inspect MY OWN agents' memory and traces, on MY machine, with no login — like claude-mem's localhost viewer."

**HOSTED dashboard (`app.onemem.xyz`):**
> "The login-gated entry point + shared surfaces I only visit occasionally: onboard a new account, pair my CLI, share a namespace, and let ANYONE in the world publicly verify a trace's Merkle chain with no account."

**Why both exist (the honest one-liner):** Local is the *daily-driver inspector for my own data*; hosted exists because three properties of the wedge — **verifiable** (a non-owner must be able to verify → public `/verify/[id]`), **shareable** (a recipient must read a shared namespace without installing the CLI), and **onboardable/cross-device** (a non-developer must be able to sign up and pair) — *cannot physically live on a single-machine localhost dashboard.* `purpose-local-vs-hosted.md:86-93` makes this case well; the hosted source backs it (`apps/hosted-dashboard/app/page.tsx` headline is literally "Verify any agent trace. No login required."). **This split is correct and worth keeping.** The problem is not the local-vs-hosted boundary; it's WHAT got placed inside local.

---

## 3. The core defect — framework adapters are inside the LOCAL daily driver

### The evidence

`packages/dashboard/lib/runtimes.ts:24-90` defines `KNOWN_RUNTIMES` with **nine** entries, all carrying `coverage: "enforced"`:

| id | line | execution location | belongs in local? |
|---|---|---|---|
| `claude-code` | 26 | A — user machine | YES |
| `codex` | 34 | A — user machine | YES |
| `openclaw` | 42 | A (local) or B (server) | mostly yes; caveat below |
| `hermes` | 49 | A/B — runtime process | conditional |
| **`crewai`** | **57** | **B — user's Python app on a server** | **NO** |
| **`livekit`** | **63** | **B — deployed voice agent** | **NO** |
| **`elevenlabs`** | **69** | **B — deployed voice agent** | **NO** |
| **`vercel-ai`** | **77** | **B — serverless / deployed Next app** | **NO** |
| **`openai-agents`** | **84** | **B — deployed app process** | **NO** |

This list is rendered by `app/apps/page.tsx` → `AppsView.tsx`, reachable from the **local** sidebar (`AppShell.tsx:18` `{ label: "Apps", href: "/apps" }`). Each row gets a **Pause toggle** (`AppsView.tsx:146-153`) and a **Trace-capture toggle** (`AppsView.tsx:156-182`) that PATCH `/api/runtimes/{id}` to write a **local policy file** (`controlsFile`, `runtimes.ts:193` = `runtimeControlsPath()`). The page subtitle reads "Runtime trace policy and verifiable activity from **your local OneMem setup**" (`AppsView.tsx:91`).

**This is the nonsense the owner named.** A localhost page on the developer's laptop is offering a "pause auto-capture" switch and a "Stored/Enforced" coverage label for **ElevenLabs** and **Vercel AI** — code that does not and cannot run on that laptop. There is no local process to pause. The toggle writes a local controls file that the deployed serverless app will never read.

### Why it even renders before any data exists

`fetchRuntimeInventory` (`runtimes.ts:160-197`) unions `KNOWN_RUNTIMES` ids with whatever environments appear in recent on-chain sessions (line 179-183). So all nine hardcoded rows render with status "no sessions" (`runtimes.ts:115`) even on a brand-new install. The local dashboard *advertises* five server-side frameworks as if they were connected local apps awaiting your pause command. That is the dishonesty in code form.

### The Overview panel has the same conflation, more subtly

`app/page.tsx:128-156` "Connected runtimes" is built purely from grouping recent sessions by `session.environment` (`page.tsx:28-33`). So if a deployed ElevenLabs agent on a server emits a TraceSession with `environment: "elevenlabs"`, it surfaces in the **local** Overview's "Connected runtimes" with a session count — implying it's a runtime connected to *this machine*. It isn't. It's a namespace that received traces from somewhere on the internet.

---

## 4. HOW reads actually work (owner question 3 — confirmed from source)

**Reads are BY NAMESPACE / ENVIRONMENT via Sui events. There is no "connected local app" data source.** Confirmed:

- `lib/trace.ts:197-217` `fetchRecentSessions` queries `MoveEventType: <pkg>::events::TraceSessionOpenedEvent` from the Sui RPC, descending. Each row exposes `environment`, `namespaceId`, `agentId`, `capturedByAddress`.
- `lib/stats.ts:28-37` and `app/page.tsx:28-33` and `runtimes.ts:166-173` all derive "runtimes" by **grouping those session events on `session.environment`**.
- `lib/trace.ts:77-109` `fetchSession` reads a single `TraceSession` object + its `ActionCall` events and runs `verifyTraceChain` — same independently-verifiable path the CLI and public `/verify` use.

So the read model is: *"give me sessions/calls for this namespace; bucket them by the `environment` string the emitter wrote."* An adapter's traces are visible **wherever the reader has access to that namespace** — laptop, hosted, or public verify — regardless of where the emitter ran. The "live/heartbeat" framing is mostly cosmetic: `api/runtimes/heartbeat/route.ts:18,49-56` keeps a **process-local, in-memory** beat map that resets on restart and is never POSTed to by the framework adapters (they run elsewhere). Status is really just "recency of on-chain sessions for this environment string" (`heartbeat/route.ts:30-44`).

**Implication for the fix:** because reads are namespace-scoped and location-blind, the *correct* surface for a framework adapter's traces is simply **a namespace you query** — NOT a "connected app" card with a pause switch. The data layer already supports the honest model; only the UI chrome lies.

---

## 5. Answering the owner's open questions

### Q1 — What is local FOR, what is hosted FOR, why both?
Answered in §2. Both are justified. **Keep both.** The boundary in `purpose-local-vs-hosted.md` is sound; the implementation leaked type-B integrations into local.

### Q2 — Do framework adapters belong in the LOCAL dashboard? Where instead? Cut any?
**No, they do not belong in the local `/apps` runtime-control surface.** A laptop cannot host, pause, or "enforce coverage" on a deployed app. Correct homes:

- **Remove from local `/apps` controls entirely.** Delete `crewai`, `livekit`, `elevenlabs`, `vercel-ai`, `openai-agents` from `KNOWN_RUNTIMES` (`runtimes.ts:57-89`). Local `/apps` should list ONLY type-A/C things actually installed on this machine (claude-code, codex, openclaw-if-local, plus MCP clients), and the page copy "your local OneMem setup" then becomes true.
- **Framework adapters become "queryable namespaces", surfaced via the HOSTED hub, not chrome with pause switches.** Per the read model (§4), the honest representation is: pick a namespace → see the `environment=vercel-ai` sessions that have arrived. The owner's hypothesis (a hosted "set up API key → watch your deployed app's traces") is the right *shape* — see §6.
- **For hackathon scope: keep the adapters as shipping packages (they emit real traces), but cut their dashboard "runtime card" UI from local.** Showing them as "Available adapters — install snippet + 'traces appear here once your app emits them'" is honest; showing them as connected, pausable local runtimes is not. The Codex taxonomy-reset already recommends exactly this ("Available adapters" section, `taxonomy-reset:49-53, 159-160`).

### Q3 — How do you query an adapter's traces?
Answered in §4: by namespace, via Sui `TraceSessionOpenedEvent` / `ActionCall` events, bucketed by `environment`. The read model is "by namespace/environment", NOT "by connected local app". Confirmed at `lib/trace.ts:197-217`.

---

## 6. The owner's hypothesis evaluated: hosted "API key → see your deployed app's traces"

**Verdict: RIGHT shape, needs ONE refinement.** The instinct is correct — a developer shipping a Vercel/LiveKit/ElevenLabs app needs to watch *their deployed app's* traces from anywhere, not from a localhost page. That is inherently a hosted, account-scoped surface.

The refinement: in OneMem the auth/identity primitive is a **Sui delegate key + namespace capability**, not an opaque API key (the docs deliberately reject API-key management — `purpose-local-vs-hosted.md:103`, `hosted-deploy.md:196`). So the honest flow is:

1. Developer onboards on hosted (`/onboarding`) → gets a namespace + a **delegate key** (this IS the "API key" equivalent; it's what the deployed app uses to write).
2. Developer drops the delegate key + namespace id into their server app's env (`onemem` provider config). The adapter emits `ActionCall`s to that namespace with `environment=<adapter>`.
3. Developer opens a **hosted, account-scoped trace view** filtered to their namespace and sees their deployed app's sessions arrive — from any device.

So: **accept the hypothesis, but call it "namespace + delegate key" rather than "API key"**, and make the hosted surface a *namespace-scoped trace list* (reusing the exact `fetchRecentSessions`/`fetchSession` read path that already exists). No new data layer is needed — only a new hosted route that is account-gated instead of creds-file-gated.

---

## 7. The INTEGRATION → SURFACE matrix (the deliverable)

| Integration | Exec location | Correct home surface | Honest one-line capability claim |
|---|---|---|---|
| **Claude Code** | A — user machine | **Local** `/apps` (native runtime) | Native PreToolUse/PostToolUse hooks capture this machine's agent actions. |
| **Codex** | A — user machine | **Local** `/apps` (native runtime) | MCP tools baseline; trusted hooks optional — don't claim auto `codex exec` capture. |
| **Cursor / Windsurf / Cline / OpenCode / Gemini** | C — local, MCP-only | **Local** `/apps`, MCP-clients section | Only explicit OneMem-routed MCP tool calls are captured; native tools are invisible. |
| **OpenClaw** | A (local) or B (server) | **Local** if running locally; **hosted/namespace** if a server deployment | Native plugin captures turns; a cloud OpenClaw is a namespace you query, not a localhost app. |
| **Hermes** | A/B — runtime process | **Local** if local; else **namespace-only** | Runtime provider; rows appear only after it emits traces. |
| **Vercel AI SDK** | B — deployed/serverless | **Hosted: namespace + delegate-key setup → namespace trace view**. Local: **REMOVE** | Records `environment=vercel-ai` traces from your deployed app once wired; not a local app. |
| **OpenAI Agents SDK** | B — deployed app | **Hosted namespace view**. Local: **REMOVE** | Records traces from your app process; appears in the namespace you write to. |
| **CrewAI** | B — Python app | **Hosted namespace view**. Local: **REMOVE** | Explicit tracer/helper today (not native `provider:onemem`); emits traces when attached. |
| **LiveKit** | B — deployed voice agent | **Hosted namespace view**. Local: **REMOVE** | Observes `AgentSession` events; not a native memory subclass yet. |
| **ElevenLabs** | B — deployed voice agent | **Hosted namespace view**. Local: **REMOVE** | Wraps callbacks/client-tools; not a native memory adapter yet. |

"Hosted namespace view" = the new account-scoped trace list described in §6, reusing the existing event read path. None of the type-B rows should carry a local Pause/Coverage control.

---

## 8. Codex verdicts (CONFIRMED / REFUTED / OVERREACHED)

| Codex claim (taxonomy-reset) | Verdict | Evidence |
|---|---|---|
| `runtimes.ts` hardcodes native hosts + framework libs into one `KNOWN_RUNTIMES` with broad `enforced`, making Vercel/LiveKit/ElevenLabs/CrewAI/OpenAI-Agents look like local connected apps (`taxonomy-reset:33-39`) | **CONFIRMED** | `runtimes.ts:24-90` — all 9 entries `coverage:"enforced"`; rendered in local `/apps` via `AppShell.tsx:18`. |
| `/apps` over-flattens categories; should become "Integrations" with sectioned native/MCP/framework/hosted (`taxonomy-reset:98-111`) | **CONFIRMED (direction right)** | `AppsView.tsx` is a single flat `rt-grid`; no sectioning. I'd go further: type-B rows should LEAVE local, not just be re-sectioned. |
| Local Overview/`/apps` status is derived from real recency, never hardcoded "online" (`heartbeat` comment `taxonomy-reset` finding) | **CONFIRMED but MISLEADING** | True (`heartbeat/route.ts:6`, `runtimes.ts:114-121`), yet the *presence* of 9 hardcoded rows pre-data still misrepresents — recency-honesty doesn't fix existence-dishonesty. |
| Dashboard event reads use `addr.packageId`, not `originalPackageId || packageId`, causing zero-sessions after upgrade (`taxonomy-reset:76-84`) | **CONFIRMED** | `lib/trace.ts:30-34` uses `addr.packageId` directly for `queryEvents`; no original-package fallback. Real correctness bug, orthogonal to my surface but real. |
| Hosted should be "Hosted Hub" for onboarding/sharing/CLI-pairing/public-verify, NOT a full local-dashboard replacement (`taxonomy-reset:128-136`) | **CONFIRMED** | Matches `apps/hosted-dashboard/app/dashboard/page.tsx` (link-hub of 5 surfaces) and `page.tsx` (verify-first landing). |
| Framework adapter docs are ahead of implementations (CrewAI/LiveKit/ElevenLabs are tracers, not native providers) (`taxonomy-reset:112-126`) | **CONFIRMED (not re-verified per-package here)** | Consistent with `runtimes.ts` install commands (`pip install onemem-crewai` etc., separate tracer pkgs) and out of my surface's deep scope; flagged for the adapter-thread. |
| **PRIOR Codex audit MISSED that framework adapters don't belong in local at all** (from my task brief) | **CONFIRMED as a real gap, but this taxonomy-reset PARTIALLY closes it** | `taxonomy-reset:159-160` says "Move framework libraries into an 'Available adapters' section, not active local runtime controls" — it stops at re-sectioning within local. It does NOT make my stronger call: type-B adapters should be removed from the LOCAL surface and rehomed to a hosted namespace-scoped view. So Codex is **right but under-shot** = OVERREACHED-in-reverse (too timid). |

---

## 9. The single most important correction (concrete product/UI change)

**Delete the five type-B framework adapters from the LOCAL `/apps` runtime-control surface and rehome them to a hosted, namespace-scoped trace view.**

Concretely:
1. Remove `crewai`, `livekit`, `elevenlabs`, `vercel-ai`, `openai-agents` from `KNOWN_RUNTIMES` in `packages/dashboard/lib/runtimes.ts:57-89`. Local `/apps` then truthfully lists only machine-local runtimes (claude-code, codex, local openclaw) + MCP clients — and the page copy "from your local OneMem setup" (`AppsView.tsx:91`) becomes honest.
2. In local Overview (`app/page.tsx:128-156`), label the panel "Environments seen in this namespace" or drop the "Connected runtimes" framing, since it is namespace-derived, not machine-connected.
3. ADD a hosted, account-gated route (e.g. `apps/hosted-dashboard/app/traces/page.tsx`) that reuses `fetchRecentSessions`/`fetchSession`, filtered to the signed-in account's namespace — the developer's "watch my deployed app's traces from anywhere" surface. Onboarding (`/onboarding`) already mints the namespace + delegate key that the deployed adapter uses to write; this closes the loop the owner imagined as "API key → see your app's traces", using OneMem's delegate-key primitive instead of an opaque API key.

This is a product/UI move, not a docs edit. Docs (`purpose-local-vs-hosted.md`, `route-apps.md`) then update to match the corrected surfaces.
