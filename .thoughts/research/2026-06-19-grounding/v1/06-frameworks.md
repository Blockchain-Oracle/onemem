# Grounding Audit — Framework Providers (Thread 06)

**Date:** 2026-06-19
**Auditor:** independent grounding thread (frameworks surface)
**Method:** read README + src for all 5 provider packages, the shared memory/trace
runtime, current-facing docs, historical specs, and the 2 assigned Codex
artifacts. Verified registry state live. Read-only on product code.

---

## 1. The one-paragraph truth

The framework providers are **real, shipped, and published** — but they are
**trace/callback wrappers, NOT the `provider: "onemem"` Mem0-native ergonomic**
that GOAL.md:36 and GOAL.md:46-48 promise. Every one of the five packages
(`@onemem/vercel-ai-provider`, `@onemem/openai-agents`, `onemem-crewai`,
`onemem-livekit`, `onemem-elevenlabs`) works the same way: you explicitly wrap a
model / attach to a runner / register callbacks, the wrapper observes the
framework's lifecycle events, buffers the calls, and on flush writes one
`TraceSession` to chain (TS providers via `@onemem/sdk-ts/runtime` directly;
Python providers by shelling out to the `onemem-trace` Node CLI because the
Walrus/Seal stack is JS-only). Memory exists only as a **separate, explicit,
opt-in helper** (`createOneMemMemory()` / `create_onemem_memory()`) that the
developer must call by hand around each turn — **no provider ever auto-invokes
recall or capture**, and **none of them is a drop-in `provider: "onemem"` config
that a Mem0 user could swap in without rewriting code**. Critically: in OneMem's
own model these are "adapters that only appear after they emit a trace" — there
is no passive "connected app" until the wrapper fires and a session lands on
chain. The honest collective claim is *"5 framework trace-instrumentation
packages, each with an explicit memory helper"* — and, refreshingly, the
**current-facing docs already say almost exactly that.** The dishonesty risk is
not in today's docs; it is in (a) the GOAL.md headline that still implies
Mem0-parity `provider: "onemem"` for 11 frameworks, and (b) the per-package
"verifiable on-chain" framing that leans hard on a chain write the provider unit
tests only mock.

---

## 2. Per-provider truth table

Classification key:
- **Native `provider:"onemem"`** = the GOAL.md:36 promise: 1-line config a Mem0
  user swaps in, automatic recall+capture+trace.
- **Explicit tracer/callback wrapper** = you wire it in; it observes lifecycle
  events and emits a trace; memory (if any) is a hand-called helper.
- **Doc-only / not shipped** = promised in a spec, no source.

| Provider | Shipped form | True classification | Auto-memory? | "Connected app" or "appears only after a trace"? |
|---|---|---|---|---|
| `@onemem/vercel-ai-provider` | `withOneMem(model, opts)` AI-SDK middleware (`wrapGenerate`/`wrapStream`) + separate `createOneMemMemory()` | **Explicit tracer wrapper** (model-call trace) + explicit memory helper | **No** — `recallInto`/`capture` only on the standalone helper; never called inside `withOneMem` | Appears only after it emits a trace (no passive connection) |
| `@onemem/openai-agents` | `attachOneMem(runner)` / `createTracedRunner()` Runner-event listener + separate `createOneMemMemory()` | **Explicit tracer wrapper** (runner lifecycle) + explicit memory helper | **No** — same; helper is hand-called around `runner.run` | Appears only after `agent_end` flushes a trace |
| `onemem-crewai` | `OneMemTracer(...).step/.task` callbacks + `tracer.flush()` + `create_onemem_memory()` | **Explicit tracer wrapper** (CrewAI step/task callbacks) + explicit memory helper | **No** | Appears only after `flush()` writes a trace |
| `onemem-livekit` | `OneMemTracer(...).attach(session)` (subscribes to LiveKit events, auto-flush on close) + `create_onemem_memory()` | **Explicit tracer wrapper** (voice-session events) + explicit memory helper | **No** | Appears only after the session closes + flush |
| `onemem-elevenlabs` | `OneMemTracer(...).callbacks()` + `.wrap_tools()` + `create_onemem_memory()` | **Explicit tracer wrapper** (conversation callbacks + client-tool wrap) + explicit memory helper | **No** | Appears only after `callback_end_session` flush |

**Frameworks in GOAL.md:44-50 with NO shipped package (doc-only / deferred):**
LangChain, LangGraph, AutoGen, OpenAI Agents *Google ADK*, Pipecat, Mastra,
Agno, LlamaIndex. GOAL.md lists ~11 frameworks; **5 are shipped.** The deferred
set is honestly listed in `docs/05-our-architecture/04-frameworks/README.md:35-42`
and `deferred-frameworks.md`.

### Evidence (file:line)

- Vercel trace-only: `packages/provider-vercel-ai/src/index.ts:44-94` (`withOneMem`
  records `model.generate`/`model.stream`); memory is a *separate* function at
  `:108-122`. Top comment `:5-6` explicitly says "automatic memory extraction
  remains a separate product layer."
- OpenAI Agents trace-only: `packages/provider-openai-agents/src/index.ts:43-129`
  (event listeners → one trace at `agent_end`); separate memory helper `:148-162`.
- CrewAI: `packages/provider-crewai/onemem_crewai/tracer.py:65-97` (step/task
  buffering), `:101-166` flush shells to `npx ... onemem-trace`
  (`_DEFAULT_TRACE_CMD` `:35`). Memory helper is the shared `ProviderMemory`
  (`onemem_crewai/memory.py:10-29`).
- LiveKit: `packages/provider-livekit/onemem_livekit/tracer.py:80-143` (attach +
  event handlers + off-thread flush). Same bridge `:34`.
- ElevenLabs: `packages/provider-elevenlabs/onemem_elevenlabs/tracer.py:74-156`
  (callbacks + `wrap_tools`). Same bridge `:44`.
- **No auto-memory anywhere:** `grep` for `recallInto|recall(|capture(|recall_context`
  across all `provider-*/src` and `provider-*/onemem_*` returns *only* the
  standalone helper bodies and docstrings — never a call inside a trace path.

---

## 3. GOAL.md promise vs shipped reality (the honesty delta)

GOAL.md:36 — *"Same `provider: "onemem"` ergonomic as Mem0 wherever possible."*
GOAL.md:46-48 lists `withOneMem(model, opts)` middleware and
`memory_config={"provider": "onemem"}` for CrewAI.

The **historical spec** `docs/05-our-architecture/04-frameworks/vercel-ai-provider.md:11-40`
shows the *original intent*: `withOneMem` with `enableRecall: true` (inject
memories into the prompt) + `enableCapture: true` (extract durable facts after
each call) + `enableTrace: true` — a true Mem0-mirror doing memory **and** trace
automatically.

**Shipped reality:** `enableRecall`/`enableCapture`/`memory_config`/`provider:"onemem"`
**do not exist in any shipped source** (verified by grep — "NONE FOUND").
`withOneMem` does trace only. Memory was split out into an explicit helper you
must wire by hand. So the GOAL.md headline ("provider:onemem ergonomic for every
framework Mem0 supports") is **aspirational, not delivered** — what's delivered
is *trace instrumentation + a manual memory helper for 5 of ~11 frameworks*.

**Where the docs are honest (credit due):** the current-facing
`docs/04-framework-providers/README.md:1-22` opens with "Older architecture docs
may describe Mem0-style memory providers that are not shipped yet. Treat package
READMEs and source as the API truth," and the table correctly scopes each
package to "trace + explicit memory helper." `docs/05-our-architecture/04-frameworks/README.md:44-50`
and the per-provider "Scope (v0.1)" sections (e.g. crewai README:65-70 explicitly
defers `memory_config={"provider":"onemem"}`) are accurate. **This surface is the
LEAST dishonest part of the project I audited** — the README layer was clearly
corrected in the 2026-06-17/18 passes. The remaining dishonesty lives upstream in
GOAL.md and in the unqualified "verifiable on-chain" hero line.

---

## 4. The "verifiable on-chain" framing risk

Every package README opens with **"Record X as verifiable on-chain OneMem
TraceSessions (Sui + Walrus + Seal) — Merkle-chained ActionCalls anyone can
verify."** That is the chain claim. But:
- The provider packages themselves contain **zero** Sui/Walrus/Seal code. TS
  providers delegate to `@onemem/sdk-ts/runtime`; Python providers shell to the
  `onemem-trace` Node bin (`packages/sdk-ts/package.json:60`). The chain truth
  lives entirely in sdk-ts (out of this thread's scope — flag for the sdk/chain
  thread).
- The provider **unit tests mock the bridge** (`provider-vercel-ai/tests/provider.test.ts:9`
  `vi.mock("@onemem/sdk-ts/runtime")`; `provider-crewai/tests/test_tracer.py:1`
  "subprocess mocked"). So *the providers are proven to build the right payload
  and call the bridge defensively*, **not** proven to land a verifiable object on
  chain. A user reading "verifiable on-chain… anyone can verify" on the README
  believes more than these packages' own tests demonstrate. The real chain proof
  must come from sdk-ts integration tests, not these packages.

This is not a lie in the providers (the bridge really does write), but the hero
sentence front-loads the strongest possible claim on a package whose own tests
stop at the bridge boundary. A stressed user reading the README will **believe
the provider writes to chain**; what is **true** is the provider hands a payload
to a Node CLI that (per sdk-ts) writes to chain.

---

## 5. What a real user SEES vs what is TRUE

- **Sees (GOAL/marketing):** "1-line `provider: "onemem"` for every framework
  Mem0 supports; auto memory + trace."
  **True:** 5 frameworks; each needs explicit wiring (wrap/attach/callbacks);
  memory is a separate manual helper; no `provider:"onemem"` config exists.
- **Sees (README hero):** "verifiable on-chain, anyone can verify."
  **True for the provider:** builds a payload and calls a bridge; the verify
  guarantee is inherited from sdk-ts, not tested here.
- **Sees (Pillar 2 headline — trace + replay):** the providers genuinely DO
  capture tool/model/turn calls as structured ActionCalls with input/output
  (the actual end-user value). This part is **real and well-built** — defensive,
  per-run isolation (WeakMap), failed-tool capture in `finally`, retry-on-flush.
  This is the honest strength of the surface.

---

## 6. Codex claim verdicts (my own evidence)

**Artifact A — `2026-06-17-ts-provider-memory-alignment.md`:**

- "vercel src exports `createOneMemMemory` with `recallInto` + inherited
  recall/capture" → **CONFIRMED** (`provider-vercel-ai/src/index.ts:108-122`).
- "vercel test file has NO assertions for `createOneMemMemory`/recall/capture" →
  **CONFIRMED** as of that date, **now REFUTED/STALE**: `provider-vercel-ai/tests/provider.test.ts:9,57-59`
  now mocks `recall`/`capture` and clears them — coverage was added after the brief.
- "openai-agents test already covers recall injection + capture" → **CONFIRMED**
  (mocks present at `provider-openai-agents` test; helper at src:148-162).
- "shipped TS provider memory helper is explicit/opt-in, not automatic" →
  **CONFIRMED** — no auto-invocation anywhere (grep).
- "Python providers have no memory helper (document as deferred)" →
  **REFUTED / STALE**: Python providers NOW ship `create_onemem_memory()` via the
  shared `ProviderMemory` (`sdk-python/onemem/provider_memory.py:27-72`;
  `onemem_crewai/memory.py`). The follow-up brief (Artifact B) closed this gap.

**Artifact B — `2026-06-18-python-provider-memory-helpers.md`:**

- "Python providers ship explicit `create_onemem_memory()` wrapping `MemoryClient`,
  defensive (recall→[]/unchanged, capture→False)" → **CONFIRMED**
  (`provider_memory.py:47-72`; recall_context unchanged on empty at `:57-60`).
- "Registry publication NOT actionable; `@onemem/*` npm + `onemem-sdk-python`
  PyPI MISSING; tokens unset" → **REFUTED / STALE (point-in-time)**: live check
  2026-06-19 shows `@onemem/vercel-ai-provider@0.1.4`, `@onemem/openai-agents@0.1.5`,
  `@onemem/sdk-ts@0.6.3` on npm and `onemem-crewai`/`onemem-livekit`/
  `onemem-elevenlabs`/`onemem-sdk-python` all HTTP 200 on PyPI. **Everything this
  thread covers is now published** (npm versions even exceed the README's 0.1.2/
  0.1.3 claims — READMEs are slightly behind reality, harmless direction).
- "Python providers depend on no install-time Python packages" → **REFUTED /
  STALE**: `provider-crewai/pyproject.toml:11-13` now declares
  `onemem-sdk-python>=0.2.0` (workspace source). Correct, since the memory helper
  imports `onemem.provider_memory`.

Net: both Codex briefs were **accurate snapshots that have since been
superseded** by the very follow-up work they recommended. No live-false claims
found; the staleness cuts in OneMem's favor (gaps closed, packages published).

---

## 7. Top 3 gaps / problems

1. **GOAL.md still oversells the framework pillar.** GOAL.md:13/36/44-50 implies
   `provider:"onemem"` Mem0-parity (auto memory+trace) across ~11 frameworks.
   Shipped = 5 explicit trace wrappers + manual memory helper, no
   `provider:"onemem"` config anywhere. The current-facing docs are honest; the
   north-star headline is not. Fix the GOAL framing or add a "delivered vs vision"
   delineation.
2. **"Verifiable on-chain… anyone can verify" is front-loaded on packages whose
   own tests mock the chain.** True end-to-end, but unproven *within these
   packages*. Either soften the per-package hero line ("emits to OneMem's
   on-chain trace via the SDK") or point to the sdk-ts integration test that
   actually demonstrates verify.
3. **No provider is a passive "connected app."** A user opening the dashboard
   sees a runtime only *after* it has wrapped a call and flushed a trace. There is
   no registration/heartbeat — "connected runtimes" (GOAL.md:60, `/apps`) is an
   after-the-fact projection of "things that have emitted a trace," not a live
   connection model. Make sure dashboard copy doesn't imply live monitoring of an
   idle framework.

## 8. Single most important correction

**Stop implying `provider: "onemem"` Mem0-parity in the headline.** The shipped
reality — and it is a genuinely good, defensively-built reality — is *"explicit
trace-instrumentation wrappers for 5 frameworks, each with an opt-in memory
helper; the framework appears in OneMem only after it emits a trace."* Say that
sentence everywhere the GOAL currently says "1-line provider:onemem for every
framework." The providers don't need to lie to be impressive; the cross-framework
ActionCall capture is the real, defensible win.
