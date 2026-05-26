# Framework Providers — OneMem SDK Wrappers

OneMem ships as a 1-line provider into every AI app framework Mem0 supports. We match Mem0's ergonomic exactly so users moving between Mem0 and OneMem don't have to rethink their wiring.

**Source-of-truth files:**
- `../../TRACE_AND_PROVIDERS.md` §1 — verbatim Mem0 provider code snippets for all 12 frameworks + OneMem-equivalent shapes
- `../../MEM0_DEEP_DIVE.md` §2 — full Mem0 integration matrix (30+ rows)

---

## Provider integration matrix (Mem0-pattern, OneMem-implemented)

| Framework | Integration model | Mem0 pattern | OneMem v0.1? | Effort | Reuse target |
|---|---|---|---|---|---|
| **Vercel AI SDK** | Middleware (`withMem0(model, opts)`) | `withMem0(openai("gpt-4o"), { ... })` | ✅ v0.1 | 1 day | `withMemWal()` already in `@mysten-incubation/memwal/ai` |
| **OpenAI Agents SDK** | Function tools (`save_memory`, `search_memory`) | Two tools registered with `Agent` | ✅ v0.1 | 1 day | TS+Python provider files |
| **CrewAI** | 1-line config (`memory_config={"provider": "..."}`) | `Crew(memory=True, memory_config={"provider": "mem0", "config": {...}})` | ✅ v0.1 | 1 day | Python provider class |
| **LiveKit** | Voice agent subclass | `Mem0Memory(LLM)` subclass injected into VoiceAgent | ✅ v0.1 (one voice provider proves the pattern) | 1 day | Python subclass |
| **Hermes Agent** | Standalone PyPI `MemoryProvider` | bundled `mem0` provider in `plugins/memory/mem0/` | ✅ v0.1 (covered in 03-target-runtimes) | 2-3 days | See 03-target-runtimes/README.md |
| **LangGraph** | SDK wrapper (`Mem0Memory` class injected) | `from langgraph_mem0 import Mem0Memory` | v0.2 | 1 day | Python class wrapper |
| **LangChain** | SDK wrapper (`MemoryClient`) | `from mem0 import MemoryClient` + manual wiring | v0.2 | 1 day | Python/JS clients |
| **AutoGen** | SDK wrapper | `from autogen + mem0` patterns | v0.2 | 1 day | Python wrapper |
| **LlamaIndex** | `Mem0Memory` class | `from llama_index.memory.mem0 import Mem0Memory` | v0.2 | 1 day | Python wrapper |
| **Google ADK** | SDK wrapper | per Mem0's `/integrations/google-ai-adk` | v0.2 | 1 day | Python wrapper |
| **Pipecat** | Voice agent provider | per Mem0's `/integrations/pipecat` | v0.2 | 1 day | Python subclass (extends LiveKit pattern) |
| **ElevenLabs** | Voice agent provider | per Mem0's `/integrations/elevenlabs` | v0.2 | 1 day | Python subclass (extends LiveKit pattern) |
| **Mastra** | Agent framework | per Mem0's `/integrations/mastra` | v0.2 | 1 day | TS provider |
| **Agno** | Agent framework | per Mem0's `/integrations/agno` | v0.2 | 1 day | Python provider |

### v0.1 cut (6 providers covering 9 framework categories via 3 reusable patterns)

| Pattern | Implementations |
|---|---|
| **MCP transport** | Claude Code + Cursor + Windsurf + Codex + OpenCode + Cline + VS Code Copilot + Antigravity (one MCP server serves all 8) |
| **Native plugin** | Claude Code (plugin.json + hooks) + OpenClaw (uses oc-memwal) + Hermes (standalone PyPI) |
| **Framework SDK middleware** | Vercel AI SDK (`withOneMem`) + OpenAI Agents SDK (function tools) + CrewAI (provider config) + LiveKit (voice subclass) |

Total v0.1 effort: ~10-12 days for 1 engineer (concurrent with Move contract + dashboard work).

---

## Per-framework code shape (paste-ready)

Full verbatim snippets are in `../../TRACE_AND_PROVIDERS.md` §1. Per-framework brief:

### Vercel AI SDK
```ts
import { withOneMem } from "@onemem/vercel-ai-provider";
import { openai } from "@ai-sdk/openai";

const model = withOneMem(openai("gpt-4o"), {
  key: process.env.ONEMEM_PRIVATE_KEY,
  accountId: process.env.ONEMEM_ACCOUNT_ID,
  serverUrl: "https://relayer.memwal.ai",
  namespace: "my-app",
  enableTrace: true,    // emits ActionCall per tool call
});
```

### OpenAI Agents SDK
```python
from agents import Agent
from onemem.openai_agents import save_memory, search_memory

agent = Agent(
    instructions="...",
    tools=[save_memory, search_memory],  # writes to Walrus + emits ActionCall
)
```

### CrewAI
```python
from crewai import Crew
from onemem import OneMemConfig

crew = Crew(
    agents=[...],
    memory=True,
    memory_config={"provider": "onemem", "config": OneMemConfig(...).dict()},
)
```

### LiveKit (voice)
```python
from livekit.agents import VoiceAgent
from onemem.livekit import OneMemMemory

agent = VoiceAgent(
    llm=...,
    memory=OneMemMemory(key=..., accountId=..., serverUrl=..., namespace="..."),
)
```

### Hermes Agent (covered in 03-target-runtimes)
```python
# In Hermes config:
memory_provider: onemem

# pip install hermes-onemem
```

---

## The "1-line provider" north star

For every framework, the integration must collapse to ~5-10 lines max. If a user takes more than 60 seconds to wire up OneMem, they'll bounce to Mem0. The ergonomic IS the moat (alongside the underlying trust model).

Concrete examples of when we miss the bar:
- Requiring users to deploy their own relayer for v0.1 (relayer is hosted by Mysten at `relayer.memwal.ai`)
- Requiring users to manually mint a `MemWalAccount` via raw `sui client publish` (we ship a CLI: `npx onemem init`)
- Requiring users to bring their own embedding API key for v0.1 (relayer's server-side embedding handles this)

---

## Cross-framework trace composition

Because every framework's provider emits to the same Sui `TraceSession` (keyed by `namespace_id`), traces compose naturally:

```
User session: namespace="my-research-2026"

Vercel AI SDK agent ──> ActionCall (model: gpt-4o, tool: web_search)
                            │
                            └─> Spawns Hermes subagent
                                  │
                                  └─> ActionCall (model: claude-sonnet, tool: extract_pdf)
                                          │
                                          └─> Calls LangGraph workflow
                                                │
                                                └─> ActionCall (tool: generate_chart)
```

All three `ActionCall`s share `namespace_id`; the parent-child chain via `parent_call_id` makes the cross-runtime trace render as one tree in the dashboard's `/trace/[id]` view.

Hermes `on_delegation(task, result, child_session_id=)` gives us this for free at the runtime level — for non-Hermes frameworks, the provider SDK sets `parent_call_id` from a context var.

---

## What we DON'T ship at v0.1

- **Multi-LLM provider compression** — Mem0 supports 16 LLM providers; we use Anthropic Haiku (default) + relayer's server-side `analyze()` for v0.1
- **Multi vector store** — Mem0 supports 20+; we use MemWal's pgvector (managed)
- **Webhooks** — Mem0 ships 4 events; we emit Sui events natively, dashboard subscribes. Webhooks defer to v0.2.
- **RBAC UI** — Mem0 has Members / Orgs; we have Sui capability transfer; UI for managing caps defers to v0.2.
- **Custom categories** — Mem0 platform feature; not load-bearing.

---

## Cross-references

- `../../TRACE_AND_PROVIDERS.md` — load-bearing for all paste-ready code
- `../../MEM0_DEEP_DIVE.md` — full integration matrix
- `../02-inspirations/mem0/README.md` — what we borrow from Mem0
- `../03-target-runtimes/README.md` — runtime plugin matrix (the other half of the integration story)
