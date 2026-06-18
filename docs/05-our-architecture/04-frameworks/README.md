# Pillar 4 — Framework Provider SDKs (OneMem)

> Current note, 2026-06-17: this is a historical design document with a
> maintained implementation-status table at the bottom. Current provider package
> READMEs and source are the API truth; use `.thoughts/` for active planning.

Mem0-style 1-line `provider: "onemem"` integration for every AI app framework. The bar: a user moving from Mem0 → OneMem should not have to rewrite their integration code.

---

## Read order

| File | Purpose |
|---|---|
| `README.md` | This file — framework matrix + design principles |
| `vercel-ai-provider.md` | `@onemem/vercel-ai-provider` — `withOneMem(model, opts)` trace middleware plus explicit `createOneMemMemory(...)` |
| `openai-agents-tools.md` | `@onemem/openai-agents` — traced runner helpers plus explicit `createOneMemMemory(...)` |
| `crewai-provider.md` | `onemem-crewai` Python package — current trace callbacks plus explicit `create_onemem_memory(...)`; Mem0-style memory provider remains a follow-up |
| `livekit-voice-provider.md` | `onemem-livekit` — current trace callbacks for voice turns/tools plus explicit `create_onemem_memory(...)`; native memory provider remains a follow-up |
| `elevenlabs-voice-provider.md` | `onemem-elevenlabs` — current trace callbacks/wrappers plus explicit `create_onemem_memory(...)`; native memory adapter remains a follow-up |
| `trace-emit-contract.md` | **Load-bearing.** How EVERY provider emits `ActionCall` consistently across frameworks |
| `deferred-frameworks.md` | LangChain / LangGraph / AutoGen / LlamaIndex / Google ADK / Pipecat / Mastra / Agno (all v0.2) |

---

## Framework coverage matrix

| Framework | v0.1 | v0.2+ | Pattern |
|---|---|---|---|
| **Vercel AI SDK** | ✅ | More middleware composability | `withOneMem(model, opts)` |
| **OpenAI Agents SDK** | ✅ | Tool surface expansion | function tools |
| **CrewAI** | ✅ | Multi-crew sharing | trace callbacks; explicit memory helper; native provider follow-up |
| **LiveKit** | ✅ | Per-room namespace switching | trace callbacks; explicit memory helper; native provider follow-up |
| **ElevenLabs** | ✅ | Per-conversation namespacing | trace callbacks/wrappers; explicit memory helper; native adapter follow-up |
| **LangChain** | v0.2 | — | `OneMemMemory(api_key=...)` class |
| **LangGraph** | v0.2 | — | SDK wrapper |
| **AutoGen** | v0.2 | — | SDK wrapper |
| **LlamaIndex** | v0.2 | — | `OneMemMemory` class |
| **Google ADK** | v0.2 | — | provider config |
| **Pipecat** | v0.2 | — | voice agent provider |
| **Mastra** | v0.2 | — | provider |
| **Agno** | v0.2 | — | provider |

**v0.1: 5 providers covering 5 framework categories.**

In the current repository, v0.1 provider coverage means installable provider
packages with verifiable trace capture. TypeScript providers also ship explicit
memory recall/capture helpers. Python providers now ship matching explicit
`create_onemem_memory(...)` helpers. The original Mem0-style/native provider
ergonomics remain tracked follow-ups unless a package README states otherwise.

---

## Design principles

1. **Match Mem0's API ergonomic exactly.** Identical method names + parameter shapes. The user's existing Mem0 integration code keeps working with OneMem after swapping the import.
2. **Provider = THIN wrapper.** Each provider package is a few hundred lines max. Heavy logic lives in `@onemem/sdk-ts` / `onemem-sdk-python`.
3. **Trace emit on every model/tool call.** See `trace-emit-contract.md` for the consistent emission pattern.
4. **Configuration via env vars by default.** `ONEMEM_DELEGATE_KEY`, `ONEMEM_ACCOUNT_ID`, `ONEMEM_NAMESPACE_ID`, `ONEMEM_AGENT_ID`. Same as MemWal pattern.
5. **Apache-2.0 license** across all providers.

---

## Provider install commands

```bash
# TypeScript / JavaScript
npm install @onemem/vercel-ai-provider
npm install @onemem/openai-agents

# Python
pip install onemem-crewai
pip install onemem-livekit
pip install onemem-elevenlabs
```

Registry check, 2026-06-18: the five framework provider packages are current on
public registries with the explicit memory helper APIs:
`@onemem/vercel-ai-provider@0.1.2`, `@onemem/openai-agents@0.1.3`, and Python
providers `0.1.1`. Re-run `pnpm registry:status --strict` before making a fresh
published-helper claim.

---

## What we satisfy + what surprises (lens check)

| Walrus must-have | How frameworks pillar satisfies |
|---|---|
| Adding verifiable memory/trace hooks to existing agent frameworks | Current providers add trace capture; TypeScript and Python providers also add explicit memory helpers |
| Multi-agent coordination | All providers emit to the same OneMem namespace → traces compose |
| Cross-tool / cross-agent memory sharing | One namespace, every framework; explicit memory helpers are available in TS and Python provider packages |

| Surprise dimension | Why judges recognize it |
|---|---|
| **5 framework provider packages at v0.1** | Broad trace instrumentation across model SDKs, agent SDKs, Python agent frameworks, and voice agents |
| **Voice agent providers (LiveKit + ElevenLabs)** | Voice is the under-served frontier; current packages trace voice sessions and expose explicit memory helpers |
| **All providers emit to the same ActionCall Move struct** | Cross-framework trace composition — never been done across this many frameworks before |

---

## Cross-references

- `../02-sdks/shared-api-surface.md` — the SDK methods providers call
- `../01-protocol/data-model.md` — the Move types providers emit
- `trace-emit-contract.md` — consistent emission across frameworks
- `../../02-inspirations/mem0/README.md` — Mem0 ergonomic to match
- `../../../TRACE_AND_PROVIDERS.md` §1 — Mem0 provider patterns (verbatim code per framework)

---

## Implementation status

| Provider | Current repo status | Registry evidence checked 2026-06-18 | Deferred boundary |
|---|---|---|---|
| `@onemem/vercel-ai-provider` | Built/tested: trace model calls via `withOneMem(...)`; explicit memory via `createOneMemMemory(...)` | npm current at `0.1.2` with explicit memory helper | Automatic memory extraction and per-tool-call interception |
| `@onemem/openai-agents` | Built/tested: trace runner lifecycle via `createTracedRunner(...)` / `attachOneMem(...)`; explicit memory via `createOneMemMemory(...)` | npm current at `0.1.3` with explicit memory helper | Verify/replay tools and automatic memory extraction |
| `onemem-crewai` | Built/tested: trace CrewAI callbacks plus explicit memory via `create_onemem_memory(...)` | PyPI current at `0.1.1` with explicit memory helper | Mem0-style `memory_config={"provider": "onemem"}` memory provider |
| `onemem-livekit` | Built/tested: trace voice turns/function tools plus explicit memory via `create_onemem_memory(...)` | PyPI current at `0.1.1` with explicit memory helper | Native memory provider and per-room namespace switching |
| `onemem-elevenlabs` | Built/tested: trace transcript turns/client tools plus explicit memory via `create_onemem_memory(...)` | PyPI current at `0.1.1` with explicit memory helper | Native memory adapter and per-conversation namespacing |
