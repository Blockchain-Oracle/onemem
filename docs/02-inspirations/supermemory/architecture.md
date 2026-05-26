# Supermemory — Architecture Deep Dive

## What it is
Supermemory is a **closed-source, Cloudflare-native** memory infrastructure positioned as "the memory layer for AI agents." Its architecture is a five-layer stack (connectors → extractors → Super-RAG → memory graphs → user profiles) with a **custom vector + graph engine using ontology-aware edges** (Updates / Extends / Derives). Hosted on Cloudflare Workers + Durable Objects + SSE for real-time streaming; claims **sub-300ms retrieval**, **94.8% on Deep Memory Retrieval benchmarks**, and 100B+ tokens/month throughput. Universal MCP server, Python + TypeScript + REST SDKs. Free tier with $5/mo built-in usage.

## Architecture (ASCII)

```
┌───────────────────────────────────────────────────────────────────┐
│ CONNECTORS (auto-sync)                                            │
│   Slack | Notion | Gmail | Google Drive | OneDrive | S3 | GitHub  │
│   Web Crawler | custom sources                                    │
└──────────────────────────────┬────────────────────────────────────┘
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│ EXTRACTORS (multi-modal chunking)                                 │
│   PDFs | images | audio | code | docs                             │
│   preserves semantic boundaries                                   │
└──────────────────────────────┬────────────────────────────────────┘
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│ SUPER-RAG (hybrid retrieval)                                      │
│   vector + BM25 + reranking                                       │
│   pluggable backends: Pinecone | Weaviate | Qdrant supported      │
│   sub-300 ms p95                                                  │
└──────────────────────────────┬────────────────────────────────────┘
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│ MEMORY GRAPHS (custom engine)                                     │
│   ontology-aware edges:                                           │
│     Updates  (new fact replaces contradictory old fact)           │
│     Extends  (new fact enriches existing fact)                    │
│     Derives  (system infers new edge from patterns)               │
└──────────────────────────────┬────────────────────────────────────┘
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│ USER PROFILES                                                     │
│   static (always-known preferences)                               │
│   + dynamic (real-time session state)                             │
│   all three layers share one pool per user_id                     │
└───────────────────────────────────────────────────────────────────┘
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│ Transport: SSE over Cloudflare Workers + Durable Objects          │
│ API:       https://api.supermemory.ai/v3                          │
│ MCP:       /.well-known/mcp                                       │
└───────────────────────────────────────────────────────────────────┘
```

## Storage model
- **Custom vector + graph engine** (proprietary, not OSS) running on Cloudflare.
- **Pluggable vector backends**: keep your existing Pinecone / Weaviate / Qdrant; Supermemory layers intelligence on top — no forced migration.
- **Durable Objects** for persistent, long-running per-user connections (CPU-billed only, idle is free).
- **SSE** for real-time bidirectional stream.
- Multi-modal extraction stored alongside the vector index, all keyed by `user_id`.
- **Encryption**: SOC 2 / HIPAA on Scale tier; GDPR claimed; no client-side key model surfaced.

## API surface
- `POST https://api.supermemory.ai/v3/add` — add memory (text, file, chat).
- Search / retrieve endpoints under `/v3`.
- **Memory API** — extracts and evolves user facts (write-path).
- **User Profiles API** — static + dynamic.
- **RAG Search API** — semantic + metadata filtering.
- All three share the same context pool per `user_id`.
- SDKs: TypeScript, Python, REST.
- **MCP server**: discoverable via `/.well-known/mcp`.

## Memory taxonomy
- **Short-term**: real-time session data (in user profile, dynamic).
- **Long-term**: indexed memories with ontology edges.
- **Episodic**: dynamic profile traits captured during sessions.
- **Procedural / declarative**: not separately named; folded into Memory Graph nodes.
- **Edges as a taxonomy primitive**: `Updates` / `Extends` / `Derives` — this is the most novel taxonomy in the space.

## Integration model
- Universal **MCP server** ("ultimate guide to universal AI memory" is the marketing).
- Plug-and-play SDK (Python / TypeScript / REST), 3 lines of code claim.
- Hermes Plugin shipped on the free tier.
- Connectors are first-party (Notion / Slack / Gmail / Drive / GitHub).
- Vercel AI SDK integration.

## Dashboard / UI
- **Developer Console** for API key management.
- Personal **app** that "remembers everything" (consumer surface).
- Connector status / sync visibility.
- No public trace viewer / graph browser surfaced.

## Pricing (signal)
- **Free** ($0; $5/mo built-in usage; Hermes plugin + MCP; community support).
- **Pro** ($19/mo; ~$20/mo built-in; Drive/Notion/OneDrive connectors; 2 teammates).
- **Scale** ($399/mo; ~$600/mo built-in; all connectors; SOC 2 / HIPAA; 10 teammates).
- **Enterprise** (custom; self-hosted or dedicated; SOC 2 / HIPAA / GDPR; forward-deployed engineer).
- Per-token billing: $0.005/1K text, $0.010/1K rich content (storage); $0.005/1K queries; deduplicated unique content ("SM tokens").

## What we'd borrow for OneMem
- **Ontology-aware edges** (`Updates` / `Extends` / `Derives`) — this is the single most useful primitive for *verifiable* memory. Each edge type is a different anchor obligation: `Updates` must reference the old fact's anchor; `Extends` shares the anchor; `Derives` produces a new anchor. Steal this directly.
- **Five-layer stack pattern** (connectors → extractors → RAG → graph → profiles) is the canonical reference architecture — OneMem can reuse it and slot Walrus blob storage between "extractors" and "RAG."
- **Pluggable vector backend** — never force users to migrate vector infra. OneMem should support Pinecone / Weaviate / Qdrant / pgvector + Walrus blob refs.
- **Cloudflare Workers + Durable Objects + SSE** as a stateful-but-cheap deployment pattern is worth understanding even though OneMem will run on Sui infra.
- **Dedup-based "SM token" billing** — only-charge-for-unique-content is the right billing primitive when memories repeat. OneMem can mirror this as "only-charge-for-unique-Walrus-blobs."
- **`/.well-known/mcp` discovery** — a clean standard pattern OneMem should adopt for runtime auto-discovery.

## Sources
- https://supermemory.ai/
- https://supermemory.ai/docs/
- https://supermemory.ai/docs/supermemory-mcp/technology
- https://supermemory.ai/pricing
- https://supermemory.ai/blog/context-memory-guide-ai-systems/
- https://supermemory.ai/blog/ai-memory-vs-vector-databases-complete-guide/
- https://betterstack.com/community/guides/ai/memory-with-supermemory/
- https://comprehensive-elements-633758.framer.app/
