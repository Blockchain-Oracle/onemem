# Grounding Thread 01 — Problem & Judge Lens

**Date:** 2026-06-19
**Thread:** problem-and-judge — "What is OneMem TRULY solving + judge lens"
**Method:** Read GOAL.md, runtime/framework READMEs, wiki, landing source, plugin hook source. Every claim cited file:line. READ-ONLY.

---

## 1. The one-sentence truth

**OneMem is a decentralized, portable memory layer for AI agents (Mem0-style add/search, but stored as Seal-encrypted Walrus blobs with Sui-capability access control) that ALSO captures and verifies a Merkle-chained trace of what each agent did.**

That is what the *code* is. Note carefully: this is **memory-first with trace as a second pillar** — which is the EXACT OPPOSITE emphasis of what GOAL.md declares.

GOAL.md:25-26 says Pillar 2 (agent action trace + replay) is "*the end-user-value headline feature*." But:
- The landing page leads with memory, not trace (`apps/landing/app/layout.tsx:7`: "OneMem - Decentralized persistent memory for AI agents"; `apps/landing/app/page.tsx:32`: "Decentralized persistent memory for AI agents"; `page.tsx:35-36`: "One **memory layer** for every **agent runtime**").
- The prior Codex product-code audit (`.thoughts/research/2026-06-18-onemem-product-code-audit.md:146`) explicitly concludes: *"Verification is a support layer... it should not be the headline. The better headline is one persistent, encrypted, user/agent-owned memory layer."*
- The MCP server is described as "memory-first tools" (audit line 54).

**So there is a live, unresolved contradiction at the heart of the product:** GOAL.md says trace+replay is the headline; the shipped landing copy, the Codex audit, and the MCP tool ordering all say memory is the headline. The product is fighting itself about what it is. This is almost certainly a major source of the "confusing / partly dishonest" feeling Abu reported.

---

## 2. The 10-second judge "I get it" — and whether the product delivers it

A Walrus-track judge has ~10 seconds. The legible hook that lands fastest is Pillar 2's own framing (GOAL.md:30):

> *"I told my agent to send money to a friend — show me which wallet skill it used, which MCP, what amounts, and verify it independently."*

That is a 10-second "I get it." It is concrete, it is end-user POV, and it is the thing **nobody else ships**. "Decentralized memory" is NOT a 10-second hook — it sounds like "Mem0 but blockchain," which is the exact framing GOAL.md:93 warns loses the judge ("Not 'Mem0 but decentralized'").

**The tragedy:** GOAL.md correctly identifies the winning hook (trace+replay, "show me what my agent did, verifiably"), and then the shipped product (landing, MCP ordering, Codex audit framing) buries it under a memory headline that GOAL.md itself says is the losing framing. The headline that wins is the one the product hid.

---

## 3. Is the rest of the product serving the Pillar-2 headline, or burying it?

**Burying it.** Evidence:

- **Landing hero** (`page.tsx:34-43`): memory is the H1; trace appears only as "Trace-capable integrations anchor committed agent actions" — passive, hedged, secondary. The verb a user remembers is "memory," not "see what my agent did."
- **Framework providers** (`docs/04-framework-providers/README.md:8-12`): the providers actually *are* trace-first ("currently focus on verifiable trace capture"), but the landing/GOAL paragraph (GOAL.md:13) sells them as Mem0-parity `provider: "onemem"` memory drop-ins. The marketing promise (memory parity) and the built reality (trace capture + explicit memory helpers) point in different directions.
- **The four-pillar structure itself** dilutes the headline: by giving memory, trace, integrations, and dashboard equal billing as "four pillars," the doc structurally demotes the one differentiated pillar to 1-of-4. A judge skims four pillars and remembers none.

---

## 4. Where the product DRIFTED from the north star — RANKED

**DRIFT #1 (most damaging) — The headline inverted.** GOAL.md:25-26 names trace+replay the headline; the landing (`page.tsx:32-36`), the MCP "memory-first" tool order, and the Codex audit (`2026-06-18...audit.md:146`) all make *memory* the headline. The single most legible, most differentiated, judge-winning asset (verifiable "what did my agent do") is demoted to a supporting feature in the shipped surface. This is the core drift; everything else is downstream.

**DRIFT #2 — "Every runtime / every framework" breadth that the code does not back.** GOAL.md:13 promises "every framework Mem0 supports (Vercel AI SDK, LangChain, LangGraph, CrewAI, AutoGen, OpenAI Agents SDK, Pipecat, ElevenLabs, LiveKit, Mastra, Agno)" — 11 named. Implemented: **5** (`provider-crewai`, `provider-elevenlabs`, `provider-livekit`, `provider-openai-agents`, `provider-vercel-ai` — confirmed by `ls packages/provider-*`). LangChain, LangGraph, AutoGen, Pipecat, Mastra, Agno, LlamaIndex, Google ADK are all explicitly **deferred** (`docs/04-framework-providers/README.md:36-44`). The "every framework" copy is aspirational stated as present-tense. This is the breadth-drowns-the-headline problem AND the honesty problem in one.

**DRIFT #3 — "provider: onemem" = Mem0-parity memory is overclaimed.** GOAL.md:13/36 sells a 1-line Mem0-equivalent *memory* drop-in. The shipped providers do trace capture plus *explicit* recall/capture helpers — "Automatic memory extraction/tool wiring" is **deferred** (`04-framework-providers/README.md:39`). A user who installs expecting Mem0-style automatic memory gets manual helpers + trace. The ergonomic promise outruns the ergonomic reality.

**DRIFT #4 — Runtimes vs frameworks conflated in the pitch.** GOAL.md:13 lists Cursor/Windsurf/Gemini as "drop-in native plugins" alongside Claude Code, but `docs/03-target-runtimes/README.md:21-23` shows Cursor/Windsurf have **no plugin SDK** (MCP-only) and Gemini/Antigravity is **v0.2 deferred**. Only 4 runtimes have real native plugins (Claude Code, OpenClaw, Hermes, Codex; README.md:28). The "native plugin for every runtime" claim flattens a real MCP-vs-native distinction that judges (and users) will notice.

**DRIFT #5 — "Auto-capture is on" is *technically* true but narrower than it sounds.** `scripts/onemem-lib.mjs:152-159`: `traceCaptureEnabled` returns true by default (only off if `paused` or `traceCapture === false`). BUT `scripts/observe.js` only buffers a tool call "if a OneMem session was opened at SessionStart" — so capture requires the SessionStart inject hook to have run and provisioned a session. It is real auto-capture for Claude Code/Codex once a session exists, not a blanket "everything everywhere is captured." Claim is defensible but should be stated precisely (per-runtime, session-scoped), not as a universal.

**DRIFT #6 — The trace proves less than the word "verify" implies.** The Codex audit (`2026-06-18...audit.md:56`) records the code's own comment: the Merkle chain "prove[s] integrity of the recorded sequence, not that the agent honestly recorded all real-world activity." A judge/user hears "verify what my agent did" and may believe it proves the agent's *real* behavior; it proves the *recorded* sequence wasn't tampered. Honest framing must say "tamper-evident record," not "proof of what the agent actually did."

---

## 5. North-star statement (recommended, grounded)

> **OneMem gives every AI agent a verifiable action trace and a portable, encrypted memory — so you can open one dashboard, see exactly what any of your agents did and remembered across every runtime, and prove it to anyone without trusting a vendor.**

Lead with the trace (the differentiated, legible, judge-winning thing per GOAL.md:25-33). Memory is the durable substrate that makes the trace cross-runtime. This re-centers the GOAL's stated headline that the shipped surface abandoned.

---

## 6. The ideal 60-second user/judge story

1. **(0:00–0:10) The ask.** "I told my agent to send money to a friend." — concrete, GOAL.md:30.
2. **(0:10–0:25) The trace appears.** Dashboard `/trace/[id]` shows the step tree: wallet skill → MCP call → oracle read → amount. "Here is exactly what it did." (GOAL.md:61 — "the headline view.")
3. **(0:25–0:40) Verify.** Click Verify: OneMem walks every call, recomputes hashes, compares to the on-chain Merkle root (`page.tsx:186-187`). Green check. Memory stayed encrypted; integrity is public.
4. **(0:40–0:50) Cross-runtime.** Same dashboard shows a Hermes agent and a Cursor session in the same namespace — memory and trace followed the agent across runtimes (Walrus + Sui).
5. **(0:50–0:60) Share/own.** Hand the trace to a teammate via a Sui capability transfer; revoke on-chain later. No vendor ever saw the plaintext.

This story is buildable from shipped primitives (trace.move, seal_approve, NamespaceCapability — all confirmed present in the Codex audit lines 48-51, 66-69). The product CAN tell it; the marketing currently doesn't.

---

## 7. Verdicts on Codex claims in my area (form my own from source)

**Codex artifact:** `.thoughts/research/2026-06-18-onemem-product-code-audit.md`

- **"OneMem is closest to 'Mem0-style persistent memory, but decentralized'; the core object is a memory namespace, not a verifier" (audit:140-144).**
  **CONFIRMED as code-accurate.** The contract's central object is `MemoryNamespace` (audit:48, 66; namespace.move). The SDK's primary surface is `MemoryAPI.add/search` (audit:44). The code is memory-centric.
  → BUT this is a description of the *code*, not a mandate for the *pitch*. See next verdict.

- **"Verification is a support layer... should not be the headline; memory should be the headline" (audit:146-148).**
  **REFUTED as product strategy** (CONFIRMED only as a description of current code emphasis). This directly contradicts GOAL.md:25-26 (trace+replay = "the end-user-value headline feature") and GOAL.md:93 ("Not 'Mem0 but decentralized'... anyone benchmarking us against Mem0's integration count loses sight of the point"). The Codex audit optimized for "what the code currently emphasizes," not "what wins the judge / what GOAL declared." Following it deepens DRIFT #1. The memory-first landing (`page.tsx:32`) appears to have taken this audit's advice — and that is the wrong turn. Truth: memory is the substrate; the verifiable trace is the differentiator and the legible hook.

- **"Provider integrations include Vercel AI SDK, OpenAI Agents, CrewAI, LiveKit, ElevenLabs, and Hermes" (audit:53, 116-120).**
  **CONFIRMED.** `ls packages/provider-*` shows exactly those 5 framework providers + Hermes under plugins. Accurate. (Note this is 5/6, not GOAL.md's promised 11 — the audit correctly lists what exists, GOAL overpromises.)

- **"Trace proves integrity of the recorded sequence, not that the agent honestly recorded all activity" (audit:56).**
  **CONFIRMED** and important. Matches the honest boundary; the marketing word "verify what your agent did" must be qualified to "tamper-evident record of what was captured."

- **"Codebase contains OpenClaw, not OpenClaude; public copy should say OpenClaw" (audit:101).**
  **CONFIRMED.** `packages/plugin-openclaw` exists; no OpenClaude. Minor but correct.

---

## 8. The single most important correction

**Re-invert the headline back to GOAL.md's north star.** The product, the landing, and the Codex audit have collectively demoted the one differentiated, judge-legible, end-user asset — *"see and verify exactly what your agent did, across every runtime"* (Pillar 2) — beneath a generic "decentralized memory" headline that GOAL.md itself flags as the losing frame ("Mem0 but decentralized"). Lead with the verifiable cross-runtime **trace+replay**; position encrypted Walrus memory as the substrate that makes it portable. This one correction fixes the confusion, restores honesty (a trace demo is concrete and demoable; "every framework memory" is not yet true), and gives the judge a 10-second "I get it."

(Honesty addendum, equally load-bearing for the Walrus track: change "every framework / every runtime / drop-in Mem0 memory" present-tense copy to reflect the real, shipped surface — 4 native runtimes, 5 framework providers, trace-capture-first with explicit memory, automatic Mem0-parity memory deferred. Overclaiming breadth is the second face of the same dishonesty Abu is feeling.)
