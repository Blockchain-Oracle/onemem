# Framework Providers — Current Surface

> Current note, 2026-06-17: this file tracks the implemented framework/provider
> packages in this repo. Older architecture docs may describe Mem0-style memory
> providers that are not shipped yet. Treat package READMEs and source as the
> API truth.

OneMem framework providers currently focus on verifiable trace capture. They
observe framework lifecycle events, buffer calls locally, then write a
`TraceSession` through the shared TypeScript trace bridge. TypeScript and Python
providers also expose explicit memory helpers: recall before a framework call,
capture after it, and keep memory failures from breaking host workflows.

## Implemented Packages

| Framework | Package | Language | Current scope | API truth |
|---|---|---|---|---|
| Vercel AI SDK | `@onemem/vercel-ai-provider` | TypeScript | Trace model calls via `withOneMem(...)`; explicit memory recall/capture via `createOneMemMemory(...)` | `packages/provider-vercel-ai/README.md` |
| OpenAI Agents SDK | `@onemem/openai-agents` | TypeScript | Trace runner lifecycle via `createTracedRunner(...)` / `attachOneMem(...)`; explicit memory recall/capture via `createOneMemMemory(...)` | `packages/provider-openai-agents/README.md` |
| CrewAI | `onemem-crewai` | Python | Trace `step_callback` / `task_callback`; explicit memory recall/capture via `create_onemem_memory(...)`; native CrewAI adapter deferred | `packages/provider-crewai/README.md` |
| LiveKit Agents | `onemem-livekit` | Python | Trace voice turns and function tools through `OneMemTracer.attach(...)`; explicit memory recall/capture via `create_onemem_memory(...)` | `packages/provider-livekit/README.md` |
| ElevenLabs Conversational AI | `onemem-elevenlabs` | Python | Trace transcript turns and client tools through callbacks/wrappers; explicit memory recall/capture via `create_onemem_memory(...)` | `packages/provider-elevenlabs/README.md` |

Hermes is tracked under runtime plugins, not this framework table:
`packages/plugin-hermes/README.md`.

## Shared Runtime Behavior

- TypeScript providers call `@onemem/sdk-ts/runtime`.
- Python providers shell through the `onemem-trace` Node bridge because the
  Walrus/Seal trace stack is TypeScript-first.
- Runtime controls are enforced before capture for current first-party providers.
- Failures are defensive: tracing should not break the host framework workflow.

## Deferred Provider Work

These are accepted follow-up areas, not current claims:

- Automatic memory extraction/tool wiring for Vercel AI SDK and OpenAI Agents.
- Native/automatic framework memory adapters inside CrewAI, LiveKit, and
  ElevenLabs providers.
- LangGraph, LangChain, AutoGen, LlamaIndex, Google ADK, Pipecat, Mastra, and
  Agno provider packages.
- Per-tool-call interception beyond what each current framework exposes today.

## Cross-references

- Current package map: `.thoughts/wiki/project-map.md`
- Current status queue: `.thoughts/wiki/context-engineering-status.md`
- Historical provider designs: `docs/05-our-architecture/04-frameworks/`
- Runtime plugin matrix: `docs/03-target-runtimes/README.md`
