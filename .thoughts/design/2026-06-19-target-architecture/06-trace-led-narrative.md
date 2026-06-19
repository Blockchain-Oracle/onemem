# Target Architecture — Thread 06: Trace-Led Narrative + Landing IA

**Date:** 2026-06-19
**Thread:** trace-led-narrative
**Surface:** `apps/landing/*` (the public marketing site) + the canonical judge demo script.
**Posture:** DESIGN, not audit. Diagnosis is settled (synthesis §2/§6). This is the target end-state.
**Output type:** narrative + information-architecture spec + copy DIRECTION. NOT visual design (no colors/spacing/components — that is the landing-visual thread's job). Where I cite `var(--verify)` / "chartreuse" it is to name the EXISTING signature moment, not to specify visuals.

**Tagging legend:**
- **SHIPPED** — exists today, cited file:line.
- **BUILDABLE** — does not exist but provably constructible from confirmed primitives (I name them).
- **RISKY/UNCONFIRMED** — feasibility not confirmed; I say exactly what must be verified.

---

## 0. The one sentence this whole thread enforces

> The landing must lead with **"see + verify exactly what your agent did"** (Pillar 2 / trace+replay), make **memory the substrate** beneath it, and demote **cross-runtime breadth to a mechanism** — and every integration claim must be **provably honest per the three execution-location tiers** (Local runtimes / MCP clients / Deployed-app adapters).

Today the landing does the exact opposite: H1 is "One **memory layer** for every **agent runtime**" (`apps/landing/app/page.tsx:34-37` SHIPPED), trace is pillar "02" (`landing-content.ts:49-52` SHIPPED), and the integration strip is a flat 9-item list mixing all three execution locations with no boundary (`landing-content.ts:61-71` SHIPPED). That flat list is the seed of the dishonesty (synthesis §5d, §2.4).

---

## 1. Target landing information architecture (section order)

The page is a single scroll. The **target section order**, top to bottom, with the job each section does:

| # | Section | Job | Lead concept |
|---|---|---|---|
| 0 | Nav | Brand + jump links + "Get started" → hosted app | — |
| 1 | **Hero** | Land the trace-led headline + the live Verify proof card side-by-side | **TRACE** (verb: see + verify what your agent did) |
| 2 | Trust strip | "Built on Sui · Walrus · Seal · MemWal" — credibility for the track | stack |
| 3 | **The problem** | "You can't see or prove what your agent did" (re-anchored on trace, not memory) | TRACE-shaped pain |
| 4 | **How it works** | 3 honest steps: install → run your agent → verify & share | the pipeline |
| 5 | **The signature moment** | The Verify-turns-green demo, full-width, *named as the headline* | TRACE proof |
| 6 | **The three pillars** | Trace (01) → Memory substrate (02) → Cross-runtime mechanism (03) | reordered |
| 7 | **Where OneMem runs** (was "Integrations") | The honest tiered strip: Local runtimes / MCP clients / Deployed-app adapters | breadth-as-mechanism |
| 8 | Final CTA | "See a live trace" → demo; "Get started" → hosted | TRACE |
| 9 | Footer | license / event | — |

**Key IA moves vs today (all SHIPPED today, target is the change):**
1. Hero H1 changes from memory-led to trace-led (§2).
2. Pillars reorder: trace becomes **01**, memory becomes **02 (substrate)**, cross-runtime becomes **03 (mechanism)** (§4). Today trace is 02 (`landing-content.ts:49`).
3. The "Integrations" section (`page.tsx:196-227`, heading "Works where your agents already run.") becomes **"Where OneMem runs"** with three **explicitly-labeled tier groups** instead of one flat `.int-grid` (§5).
4. The problem section re-anchors its three cards on the trace gap (§3).
5. `<head>` metadata + `hero-kicker` change from "Decentralized persistent memory" to the trace line (§2, §6).

All of these are **BUILDABLE** — they are copy + array-shape edits to `landing-content.ts` and `page.tsx`, plus one new tier-aware sub-component for the integration strip. No new external primitive is required.

---

## 2. Hero copy DIRECTION (trace-led)

> **Direction, not final wordsmithing.** The visual thread owns typography/emphasis. This fixes the *concept hierarchy* and the *honesty*.

**Kicker** (replaces `page.tsx:30-33` "Decentralized persistent memory for AI agents."):
- Direction: *"The verifiable record of what your agent did."*
- Icon: `trace` or `shield` (both SHIPPED in `Icon.tsx`).

**H1** (replaces `page.tsx:34-37`):
- Lead verb = SEE + VERIFY. Memory is NOT in the H1.
- Direction candidates (pick one in visual pass):
  - **A.** "See + verify exactly what your agent **did**." (closest to the locked headline; `.em` on "did" or "verify")
  - **B.** "Your agent **did** something. **Prove** it." (punchier two-beat)
- Recommended: **A** as primary — it is the locked headline verbatim and reads as a product promise, not a riddle.

**Subhead** (replaces `page.tsx:38-43`). Must (a) lead with the trace, (b) name memory as the substrate, (c) keep every claim honest:
- Direction: *"Every tool call, MCP invocation, and skill run your agent makes becomes a Merkle-chained object on Sui — replay the whole tree, then click Verify and watch anyone re-check it against the chain, trusting no vendor. Memory is the substrate: each write is an encrypted blob on Walrus your agent can recall anywhere."*
- **Honesty guardrails baked in:**
  - Do NOT say "every runtime." Say "your agent" (singular, the one running). Breadth lives in §7, tiered.
  - Do NOT say "auto-captured everywhere." Capture is tier-dependent (native hooks vs MCP-tools-only vs deployed adapter).
  - "replay the whole tree" is honest for `/trace/[id]` (SHIPPED demo per `packages/dashboard/CLAUDE.md` "Headline view").

**Hero CTAs** (`page.tsx:44-53` SHIPPED): keep two buttons but re-point copy:
- Primary: "See a live trace" → `#demo` (was "Get started" → hosted). The headline IS the trace; the first click should show it.
- Ghost: "Get started" → hosted app (`appUrl`).
- (Rationale: trace-led means the *proof* is the hook, not signup.)

**Hero meta stats** (`page.tsx:54-67` SHIPPED — currently "Walrus / Sui / 8+ runtimes"):
- Replace the dishonest **"8+ runtimes"** stat. It implies 8 uniform integrations; they are not uniform (synthesis §2.4, §5d).
- Direction: keep "Walrus — encrypted at rest", "Sui — merkle-chained", and replace third with **"No vendor — re-verify from chain"** (the trust differentiator) OR **"Public — no-login /verify"**. Either is honest; both reinforce trace-led.

**Tag:** all BUILDABLE (copy edits to `page.tsx` + `landing-content.ts`).

---

## 3. Problem section re-anchor (trace-shaped pain)

`PROBLEMS` (`landing-content.ts:1-17` SHIPPED) today leads card 1 with "Memory is trapped." Target: **lead with the trace gap**, demote memory to the third card (the substrate problem). Reorder + re-copy:

1. **(trace icon) "You can't see what it did."** — *Your agent sends money, ships code, runs research — then the trace is gone the moment the run ends. Which skill? Which MCP server? What inputs? No record.* (re-uses today's card-2 idea, `landing-content.ts:8-11`, promoted to first.)
2. **(shield icon) "You can't prove it."** — *No way to show a teammate, an auditor, or a skeptic that the agent did exactly what it claims — untampered, without trusting you or any vendor.* (today's card-3, `landing-content.ts:12-16`, kept.)
3. **(memory icon) "And it forgets."** — *Context is siloed per tool; switch runtimes and it starts from zero. Memory needs to be portable AND owned.* (today's card-1, `landing-content.ts:2-5`, demoted to substrate framing.)

Section heading (`page.tsx:107` SHIPPED "Agents are powerful, stateless, and impossible to audit.") → keep but re-weight toward **audit**: *"Agents act on your behalf — and leave no provable record."*

**Tag:** BUILDABLE (reorder + recopy a const array).

---

## 4. Pillars reorder — trace headline, memory substrate, breadth mechanism

`PILLARS` (`landing-content.ts:40-59` SHIPPED) target reorder:

| Target # | Tag | Title | Body direction | Source today |
|---|---|---|---|---|
| **01** | `trace` | **Action trace + replay** | "Every tool, MCP, and skill call becomes a Merkle-chained Sui object. Replay the whole tree; click Verify and anyone re-walks the chain from Sui — no trust in OneMem required." | was 02 (`:48-52`) |
| **02** | `memory` | **Memory you own** (substrate) | "Each memory write is an encrypted Walrus blob, Seal-threshold-encrypted, access-controlled by an on-chain namespace YOU hold the capability to. Portable across your agents — owned, not rented." | was 01 (`:42-45`) |
| **03** | `branch`/`everywhere` | **One format, where it runs** | "The same trace format and memory namespace across the places your agents run — captured natively on your machine, emitted by adapters from your deployed apps. Mechanism, not magic." | was 03 (`:54-57`) |

**Critical copy DELETE inside pillar 03:** today's line *"The same memory namespace and trace format across **every runtime and framework. One dashboard for all of them.**"* (`landing-content.ts:57` SHIPPED) is the **single seeded lie** (synthesis §2.4, problem-thread §3a). Replace with the tier-honest line above — NO "every," NO "one dashboard for all."

Pillar section heading (`page.tsx:161` "Not one feature — a layer under every agent.") is fine; keep.

**Tag:** BUILDABLE.

---

## 5. The tiered integration strip (the honesty centerpiece)

This replaces the flat `INTEGRATIONS` array (`landing-content.ts:61-71` SHIPPED) and the single `.int-grid` render (`page.tsx:212-225` SHIPPED). Section renamed **"Integrations" → "Where OneMem runs"** (heading from "Works where your agents already run." → keep, it's honest).

### Target data shape (BUILDABLE)

Replace the flat `[icon, name]` tuples with a grouped structure carrying a per-tier capability label:

```
INTEGRATION_TIERS = [
  {
    id: "local",
    label: "Local runtimes",
    capability: "Native capture on your machine — open the local dashboard and watch it.",
    items: [ ["bolt","Claude Code"], ["cube","Codex"], ["branch","OpenClaw"], ["cube","Hermes"] ],
  },
  {
    id: "mcp",
    label: "MCP clients",
    capability: "Explicit OneMem tool calls only — no automatic capture or recall.",
    items: [ ["settings","Cursor"], ["settings","Windsurf"], ["settings","Cline"], ["settings","OpenCode"] ],
  },
  {
    id: "deployed",
    label: "Deployed-app adapters",
    capability: "Emit verifiable traces from your shipped app — query them by namespace.",
    items: [ ["bolt","Vercel AI SDK"], ["bolt","OpenAI Agents"], ["branch","CrewAI"], ["apps","LiveKit"], ["apps","ElevenLabs"] ],
  },
]
```

### Per-tier capability labels — the exact honest claims

These map 1:1 to the synthesis §4 capability tiers and are provably honest:

- **Local runtimes** — *"Native hooks capture this machine's tool calls; batched on-chain when the session ends. Watch them in the local dashboard."*
  - Honest because: SHIPPED hooks (`plugin-claude-code/scripts/observe.js`, `summarize.js` per synthesis §2.1) write real on-chain traces from location-A runtimes.
  - **Per-item nuance (BUILDABLE):** Codex carries a smaller badge *"requires one-time `/hooks` trust; `codex exec` does not capture"* (synthesis §4 row Codex). Do NOT label Codex identically to Claude Code.
- **MCP clients** — *"Explicit OneMem tool calls only — no automatic capture or recall."*
  - Honest because: location-C clients can only invoke explicit tools (synthesis §1, §4). **HONESTY FLAG carried from synthesis §8a (BUG-3):** MCP `onemem_add_memory` currently emits NO on-chain attestation (`packages/mcp-server/src/index.ts:82` SHIPPED; `sdk-ts/src/memory.ts:182-194` SHIPPED). Until that is wired, the landing must NOT imply MCP writes are verifiable traces. The tier label above says "tool calls," not "verifiable traces" — deliberately. **This label is honest TODAY even with BUG-3 unfixed.**
- **Deployed-app adapters** — *"Emit verifiable traces from your deployed app once wired; watch them by namespace from the hosted hub."*
  - Honest because: adapters stamp `environment=<x>` and traces are read by environment from chain (`dashboard/lib/trace.ts:197-217` SHIPPED, `sdk-ts/src/runtime.ts:333` SHIPPED per synthesis §4). NO claim of local control, NO "auto-captured," NO Pause toggle.
  - **Visual honesty rule:** these items must NOT render with a "live/active" dot or any control affordance on the landing. They are catalog logos with a tier caption only.

### Featured-adapter treatment (coordinated with vercel-ai-demo thread)

Within the **Deployed-app adapters** tier, **Vercel AI SDK is the ONE featured adapter** for the demo (locked decision). Direction: render Vercel AI SDK first / with a subtle "Featured" caption linking to the demo's hosted trace, and render OpenAI Agents / CrewAI / LiveKit / ElevenLabs as plain catalog logos. CrewAI/LiveKit/ElevenLabs get NO featured chrome (synthesis §4 "CUT from demo, keep packages").

**Tag:** strip structure + labels BUILDABLE. The "Featured → live hosted trace" deep-link is **RISKY/UNCONFIRMED** until the vercel-ai-demo + hosted-namespace threads confirm a stable public hosted trace URL exists (see §8 dependencies).

---

## 6. `<head>` + global metadata (trace-led)

`apps/landing/app/layout.tsx:6-10` (SHIPPED) currently: title "OneMem - Decentralized persistent memory for AI agents", description memory-led.

Target direction (BUILDABLE):
- **title:** "OneMem — See + verify exactly what your agent did"
- **description:** "OneMem is the verifiable record of what your AI agent did: every tool, MCP, and skill call becomes a Merkle-chained object on Sui that anyone can re-verify — no vendor trust. Plus memory you actually own, encrypted on Walrus."

This matters for SEO/social-card honesty and for the judge who Googles the project.

---

## 7. The canonical 60-second judge demo script

This is THE script the pitch is organized around. It uses **execution-location (A) + one public hosted page + exactly ONE deployed adapter (Vercel AI)** — the locked demo scope. Coordinated handoff points to the **vercel-ai-demo** thread are marked **[→VERCEL]**.

**Pre-staged before the clock starts** (so 60s is spendable on the story, not setup):
- Local dashboard running at `localhost:4040`, BUG-1 (package-id) fixed so list pages are non-empty (synthesis §5a, §7.1 — **dependency on the dashboard-correctness thread**).
- A completed "send 5 USDC to Maya" session already traced from Claude Code on the laptop (location A).
- The Vercel-AI demo app already deployed and having emitted at least one `environment=vercel-ai` trace to the demo namespace **[→VERCEL]**.
- The public `/verify/<id>` page reachable at `app.onemem.xyz/verify/<id>` with no login (synthesis §3, `purpose-local-vs-hosted.md:83`).

**The 60 seconds (4 beats):**

| Time | Beat | Action | Spoken line (direction) | Grounding |
|---|---|---|---|---|
| 0:00–0:12 | **The act** | Show the agent already did it. "I told my agent on my laptop: *send 5 USDC to Maya.* It did." | "Agents act on your behalf. The problem isn't capability — it's that you can't see or prove what they did." | story = `GOAL.md:30-32`; SHIPPED runtime |
| 0:12–0:30 | **See it (local)** | Open `localhost:4040 → /trace/<id>`. Expand the tree: wallet skill → MCP server → oracle price read → broadcast → confirm. Parent→child, timing. | "Here's the whole tree — every tool, MCP, and skill call, in order, with the inputs." | `/trace/[id]` SHIPPED demo (`packages/dashboard/CLAUDE.md`) |
| 0:30–0:42 | **Verify it (the green moment)** | Click **Verify**. Page walks the Merkle chain of on-chain `ActionCall` objects; turns chartreuse: **Verified ✓**. | "This isn't OneMem's word. It re-walks the hashes straight from Sui. Verified." | Verify drawer = `packages/dashboard/CLAUDE.md` "Headline view"; `var(--verify)` SHIPPED |
| 0:42–0:54 | **Share it (public, no login)** | Paste session id into `app.onemem.xyz/verify/<id>` in a fresh/incognito window. It verifies again — no login, no install. "Send this to Maya's accountant." | "Anyone re-verifies it. No account, no install, no trusting me or any vendor." | public verify `purpose-local-vs-hosted.md:83,153-207` SHIPPED-by-design |
| 0:54–1:00 | **Beyond the laptop (one adapter)** | Switch to hosted hub; show the **Vercel-AI deployed-app** trace in the same namespace, verifying identically. **[→VERCEL]** | "Same trace, same proof — now from a deployed app, not my laptop. One format, everywhere it runs." | adapter read-by-environment `dashboard/lib/trace.ts:197-217` SHIPPED; hosted namespace view BUILDABLE |

**Demo honesty rules (non-negotiable, derived from synthesis §5d):**
- Do NOT toggle any framework Pause/Trace control on screen (they are no-ops — and are being deleted from local anyway).
- Do NOT claim "auto-captured across 8 runtimes." Show ONE local runtime + ONE deployed adapter; say "one format, two execution locations."
- The deployed-adapter beat (0:54) is the ONLY place a framework appears in the demo, and it appears on the **hosted** surface, never local chrome.

**Tag:**
- Beats 1–4 (local trace → verify → public verify): **SHIPPED / BUILDABLE on confirmed primitives** (the `/trace/[id]` + Verify + public `/verify` surfaces exist; the package-id fix is BUILDABLE).
- Beat 5 (Vercel hosted trace): **RISKY/UNCONFIRMED** — depends on the vercel-ai-demo thread producing a real deployed app emitting a real trace AND the hosted-namespace thread shipping the namespace-scoped trace view. If either slips, the demo gracefully ends at beat 4 (the full headline still lands; beat 5 is the breadth-mechanism flourish, not the headline). **This fallback must be explicit so the demo is never blocked.**

---

## 8. The exact dishonest copy to DELETE / REPLACE

The synthesis named these (§5d). Here is the landing-surface subset this thread owns, with exact locations:

| Dishonest element | Location (SHIPPED) | Why it's a lie | Target |
|---|---|---|---|
| H1 "One **memory layer** for every **agent runtime**" | `apps/landing/app/page.tsx:34-37` | memory-led + "every runtime" breadth claim | REPLACE → trace-led H1 (§2) |
| "every runtime and framework. One dashboard for all of them." | `landing-content.ts:57` | impossible: reads unify, *controls* cannot; no one dashboard hosts B as connected apps | DELETE the sentence; replace pillar 03 body (§4) |
| Flat 9-item `INTEGRATIONS` mixing A/B/C | `landing-content.ts:61-71` rendered `page.tsx:212-225` | erases execution-location categories; trains viewer that all 9 behave identically | REPLACE → 3 tiered groups (§5) |
| "8+ runtimes" hero stat | `page.tsx:64-66` | implies 8 uniform integrations | REPLACE → trust stat (§2) |
| Kicker "Decentralized persistent memory for AI agents." | `page.tsx:30-33` | memory-led framing | REPLACE → trace kicker (§2) |
| `<head>` title/description memory-led | `layout.tsx:6-10` | memory-led; "carry context across runtimes" breadth | REPLACE (§6) |
| Step 2 "Trace-capable plugins and providers record after install…" | `landing-content.ts:27-31` | blurs A (native) and B (deployed adapter) into one "records after install" claim | REVISE → split: "On your machine, native hooks capture automatically. In a deployed app, an adapter emits traces. MCP clients capture only explicit tool calls." |

**Copy that does NOT exist on the landing (so this thread does NOT touch it)** — these live in the dashboard package and belong to other threads, flagged here only so nothing is double-claimed: the "Auto-capture on / Auto-trace on" string (`SettingsView.tsx:226-227`), the fake "Verifiable" card + unconditional green checks (`dashboard app/page.tsx:74,113-115`), and the `coverage:"enforced"` rows (`dashboard/lib/runtimes.ts`). **Out of scope for the landing thread** (synthesis §5d — dashboard-honesty thread).

**Note on `VerifyDemo.tsx` (SHIPPED, `apps/landing/components/VerifyDemo.tsx`):** the hero/demo Verify card is a *scripted mock* (a `setInterval` walking a hardcoded `CALLS` array — `:6-36`). This is acceptable as a landing illustration BUT must not present itself as a live verification of a real chain. **Honesty requirement (BUILDABLE):** add a small, honest caption near it — e.g. *"Illustration — run the real one in the dashboard"* — and ensure the CTA under it deep-links to the real `/trace/<id>` demo. Do NOT let a judge believe the landing card is verifying a live chain. (Low-risk copy add; the mock itself can stay.)

---

## 9. SHIPPED / BUILDABLE / RISKY summary for this surface

**SHIPPED (cite):**
- Entire current landing (`page.tsx`, `landing-content.ts`, `layout.tsx`, `VerifyDemo.tsx`) — the thing being repositioned.
- The demo's load-bearing real surfaces it points at: `/trace/[id]` + Verify drawer (`packages/dashboard/CLAUDE.md` "Headline view"), public no-login `/verify` (`purpose-local-vs-hosted.md:83,153-207`), read-by-environment adapter traces (`dashboard/lib/trace.ts:197-217`).
- Available `Icon` keys for all proposed icons: `trace, replay, shield, memory, cube, bolt, branch, settings, apps, wallet, share, key, lock` (`apps/landing/components/Icon.tsx`).

**BUILDABLE (copy/array/IA edits only — no new external primitive):**
- Trace-led H1, kicker, subhead, hero stat, CTAs (§2).
- Problem reorder (§3), pillars reorder + DELETE the seeded lie (§4).
- Tiered integration strip data shape + per-tier capability labels + render split (§5).
- `<head>` metadata (§6).
- Step-2 copy split A/B/C (§8).
- Honest caption on the `VerifyDemo` mock (§8).

**RISKY / UNCONFIRMED (must be verified by named threads):**
- **Beat 5 / "Featured → live hosted Vercel trace" deep-link (§5, §7):** depends on the vercel-ai-demo thread shipping a real deployed app that emits a real `environment=vercel-ai` trace, AND the hosted-namespace thread shipping a stable public hosted trace URL. **Verify:** does a public/shareable hosted trace URL exist for a Vercel-emitted session by demo day? If not, the landing "Featured" link degrades to a static catalog logo and the demo ends at beat 4.
- **MCP-tier label honesty over time:** the "tool calls only, no verifiable trace" label is honest TODAY *because* BUG-3 (MCP writes don't attest, synthesis §8a) is unfixed. **Verify with the MCP/dashboard thread:** if BUG-3 is fixed (MCP writes DO attest), this label can be upgraded — but it must NOT be upgraded preemptively.
- **Package-id BUG-1 (synthesis §5a):** not a landing bug, but the demo's beats 2–3 require non-empty dashboard list pages. **Verify** the dashboard-correctness thread lands the `eventPackageId` fix before the demo is rehearsed.

---

## 10. The single biggest design risk (this surface)

**The trace-led repositioning over-promises beat 5 and re-imports the very dishonesty it removed.** If the landing's "Deployed-app adapters" tier — or the demo's final beat — implies the Vercel/OpenAI/CrewAI/LiveKit/ElevenLabs adapters are *live, captured, and watchable* the same way the local runtime is, we have simply relocated the "every framework, one dashboard" lie from the H1 into the integration strip. The mitigation is structural, not cosmetic: (a) the deployed-adapter tier renders as **caption-only catalog logos with NO live dot and NO control affordance**; (b) exactly ONE adapter (Vercel) is "Featured," and only if a real hosted trace exists; (c) the demo's final beat is explicitly a *breadth-mechanism flourish with a clean fallback to ending at beat 4*, never load-bearing for the headline. Trace-led honesty means the headline survives even if every deployed adapter is removed — because the headline is location-A + public verify, which needs zero adapters (problem-thread §2).

---

## 11. Dependencies on other threads

| Need | From thread | Blocking? |
|---|---|---|
| `eventPackageId` / BUG-1 fix so dashboard list + trace pages are non-empty for beats 2–3 | dashboard-correctness | **YES** — demo can't be rehearsed without it |
| A real deployed Vercel-AI app emitting a real `environment=vercel-ai` trace + its session id | **vercel-ai-demo** | Beat 5 only (degrades gracefully) |
| Hosted namespace-scoped trace view + stable public hosted trace URL for the Vercel session | hosted-namespace / hosted-hub | Beat 5 + "Featured" link only |
| Final visual design of hero, tiered strip, pillar cards (this thread sets concept hierarchy + copy; it does NOT set type/color/layout) | landing-visual | Non-blocking; parallel |
| Confirmation BUG-3 (MCP attestation) status so the MCP-tier label is correctly scoped | mcp / dashboard-honesty | Non-blocking (current label is honest either way) |
| The Verify-green moment + `/trace/[id]` tree remaining the demo's anchor | dashboard headline thread | **YES** — beats 2–3 are this surface's payload |

**This thread PROVIDES to others:** the canonical demo script (§7) is the spine the vercel-ai-demo, hosted-hub, and pitch threads coordinate against; the tier labels (§5) are the honest claims every surface must match; the copy-DELETE list (§8) is the landing-surface honesty checklist.
