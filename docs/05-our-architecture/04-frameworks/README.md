# Pillar 4 — Framework Provider SDKs (OneMem)

> Current note, 2026-06-17: this is a historical design document. Current
> provider package READMEs and source are the implementation truth; use
> `.thoughts/` for active planning.

Mem0-style 1-line `provider: "onemem"` integration for every AI app framework. The bar: a user moving from Mem0 → OneMem should not have to rewrite their integration code.

---

## Read order

| File | Purpose |
|---|---|
| `README.md` | This file — framework matrix + design principles |
| `vercel-ai-provider.md` | `@onemem/vercel-ai-provider` — `withOneMem(model, opts)` middleware |
| `openai-agents-tools.md` | `@onemem/openai-agents` — `save_memory` + `search_memory` function tools |
| `crewai-provider.md` | `onemem-crewai` Python package — `memory_config={"provider": "onemem"}` pattern |
| `livekit-voice-provider.md` | `onemem-livekit` — `OneMemMemory` voice agent subclass |
| `elevenlabs-voice-provider.md` | `onemem-elevenlabs` — voice agent provider (same subclass pattern as LiveKit) |
| `trace-emit-contract.md` | **Load-bearing.** How EVERY provider emits `ActionCall` consistently across frameworks |
| `deferred-frameworks.md` | LangChain / LangGraph / AutoGen / LlamaIndex / Google ADK / Pipecat / Mastra / Agno (all v0.2) |

---

## Framework coverage matrix

| Framework | v0.1 | v0.2+ | Pattern |
|---|---|---|---|
| **Vercel AI SDK** | ✅ | More middleware composability | `withOneMem(model, opts)` |
| **OpenAI Agents SDK** | ✅ | Tool surface expansion | function tools |
| **CrewAI** | ✅ | Multi-crew sharing | `memory_config={"provider": "onemem"}` |
| **LiveKit** | ✅ | Per-room namespace switching | voice agent subclass |
| **ElevenLabs** | ✅ | Per-conversation namespacing | voice agent provider |
| **LangChain** | v0.2 | — | `OneMemMemory(api_key=...)` class |
| **LangGraph** | v0.2 | — | SDK wrapper |
| **AutoGen** | v0.2 | — | SDK wrapper |
| **LlamaIndex** | v0.2 | — | `OneMemMemory` class |
| **Google ADK** | v0.2 | — | provider config |
| **Pipecat** | v0.2 | — | voice agent provider |
| **Mastra** | v0.2 | — | provider |
| **Agno** | v0.2 | — | provider |

**v0.1: 5 providers covering 5 framework categories.**

---

## Design principles

1. **Match Mem0's API ergonomic exactly.** Identical method names + parameter shapes. The user's existing Mem0 integration code keeps working with OneMem after swapping the import.
2. **Provider = THIN wrapper.** Each provider package is a few hundred lines max. Heavy logic lives in `@onemem/sdk-ts` / `onemem-sdk-python`.
3. **Trace emit on every model/tool call.** See `trace-emit-contract.md` for the consistent emission pattern.
4. **Configuration via env vars by default.** `ONEMEM_DELEGATE_KEY`, `ONEMEM_ACCOUNT_ID`, `ONEMEM_NAMESPACE_ID`, `ONEMEM_AGENT_ID`. Same as MemWal pattern.
5. **Apache-2.0 license** across all providers.

---

## Per-framework install commands (planned)

```bash
# TypeScript / JavaScript
npm install @onemem/vercel-ai-provider
npm install @onemem/openai-agents

# Python
pip install onemem-crewai
pip install onemem-livekit
pip install onemem-elevenlabs
```

---

## What we satisfy + what surprises (lens check)

| Walrus must-have | How frameworks pillar satisfies |
|---|---|
| Adding persistent memory to existing agent frameworks | Each provider IS that addition |
| Multi-agent coordination | All providers emit to the same OneMem namespace → traces compose |
| Cross-tool / cross-agent memory sharing | One namespace, every framework |

| Surprise dimension | Why judges recognize it |
|---|---|
| **5 framework providers at v0.1, matching Mem0's exact ergonomic** | Drop-in compat with the dominant memory layer's UX. Migration is 1-line for users |
| **Voice agent providers (LiveKit + ElevenLabs)** | Voice is the under-served frontier; Mem0 has it; we match |
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

| Provider | Status |
|---|---|
| `@onemem/vercel-ai-provider` | ⏳ pending |
| `@onemem/openai-agents` | ⏳ pending |
| `onemem-crewai` | ⏳ pending |
| `onemem-livekit` | ⏳ pending |
| `onemem-elevenlabs` | ⏳ pending |
