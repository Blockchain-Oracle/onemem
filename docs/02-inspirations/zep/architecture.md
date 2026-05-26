# Zep — Architecture Deep Dive

## What it is
Zep is a cloud-hosted "context engineering platform" that assembles personalized agent context from chat history, business data, and events. Its core innovation is a **temporal knowledge graph** (powered by the open-source Graphiti library) where every fact carries `valid_at` / `invalid_at` timestamps so the graph evolves and invalidates stale relationships without deletion. Apache-2.0 SDKs, closed managed cloud (community edition deprecated). SOC 2 Type II / HIPAA compliant.

## Architecture (ASCII)

```
┌──────────────────────────────────────────────────────────────┐
│ Ingest                                                       │
│   thread.add_messages()  /  graph.add()                      │
│   chat | JSON | documents | CRM events                       │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ Graphiti pipeline (entity + relation extraction LLM)         │
│   - extracts entities & facts                                │
│   - resolves duplicates / contradictions                     │
│   - writes nodes + edges with bi-temporal validity windows   │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ Storage                                                      │
│   Neo4j (default) | FalkorDB | Kuzu | Amazon Neptune         │
│   + embedding store for hybrid search                        │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ Retrieval                                                    │
│   graph.search()  |  thread.get_user_context()               │
│   hybrid: semantic + BM25 + graph traversal                  │
│   returns templated context block (~200 ms P95)              │
└──────────────────────────────────────────────────────────────┘
```

## Storage model
- **Graph DB**: Graphiti backend — Neo4j default; FalkorDB / Kuzu / Neptune supported.
- **Vector**: embeddings co-located with graph nodes / edges; not user-pluggable in Zep Cloud.
- **Relational**: Postgres in legacy community edition; cloud manages this internally.
- **Bi-temporal**: each fact has `valid_at` and `invalid_at` so historical state is queryable.
- **Encryption**: at-rest via cloud provider; no client-side / user-held key model.

## API surface
- `graph.add(...)` — push raw JSON, text, or structured data.
- `thread.add_messages([...])` — chat ingest (auto-routes to user graph).
- `graph.search(query, ...)` — hybrid retrieval over the knowledge graph.
- `thread.get_user_context(thread_id)` — returns ready-to-prompt context block with `%{user_summary}`, `%{edges}`, `%{entities}` template variables.
- Entity / edge CRUD endpoints; custom entity types via Pydantic-like classes.
- MCP server component shipped in repo (for IDE / Claude clients).

## Memory taxonomy
- **Short-term**: recent thread / chat messages.
- **Long-term**: persistent facts on the temporal graph with from/to validity.
- **Episodic / behavioural**: user traits and interaction patterns, captured as graph attributes on the user node.
- No explicit "core memory" vs "archival memory" split — everything lives in one graph and is selected by retrieval scoring.

## Integration model
- Python (`zep-cloud`), TypeScript (`@getzep/zep-cloud`), Go (`getzep-go/v2`) SDKs.
- LangChain, LlamaIndex, AutoGen integration packages.
- MCP server in `legacy/` and current repo for editor clients.
- No self-hosted production tier (community edition deprecated, code moved to `legacy/`).

## Dashboard / UI
- Cloud console for projects, users, threads, graph browsing, custom entity definitions.
- Direct graph view (entities + edges with validity windows).
- No trace viewer for agent calls — Zep is positioned as context layer, not telemetry.

## What we'd borrow for OneMem
- **Bi-temporal validity** (`valid_at` / `invalid_at`) as the canonical pattern for "memory that doesn't lie about history." OneMem can anchor these timestamps on Sui.
- **Single graph, multiple retrieval modes** — semantic + BM25 + graph traversal blended into one assembled context block.
- **Templated context output** with named slots (user summary, edges, entities) — easier for downstream LLMs to consume than raw lists.
- **Graphiti as a library** (Apache-2.0) is an obvious dependency we can layer Walrus/Seal under for verifiable temporal facts.
- **Entity provenance** — every derived fact traces back to an Episode (raw ingest). Perfect anchor target.

## Sources
- https://github.com/getzep/zep
- https://www.getzep.com
- https://help.getzep.com/concepts
- https://github.com/getzep/graphiti
