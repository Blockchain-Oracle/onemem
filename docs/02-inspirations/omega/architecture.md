# OMEGA — Architecture Deep Dive

## What it is
OMEGA is an **Apache-2.0, local-first, MCP-native** persistent memory system for AI coding agents (Claude Code / Cursor / Windsurf / OpenClaw / Obsidian / Cline). Tagline: *"The LLM is rented. The intelligence is owned."* Everything — embeddings, vector index, semantic search — runs on the user's machine via SQLite + `sqlite-vec`. No API keys, no cloud calls, zero vendor lock-in. Free Core tier is **perpetually Apache-2.0**; paid Pro tier ($19/mo) is **additive** and never gates Core features. Best architectural reference for "client-side first" memory in the comparison set.

## Architecture (ASCII)

```
┌─────────────────────────────────────────────────────────────────┐
│ MCP Clients                                                     │
│   Claude Code | Cursor | Windsurf | OpenClaw | Obsidian | Cline │
└────────────────────────────┬────────────────────────────────────┘
                             │ stdio (MCP)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ OMEGA MCP Server  (`omega setup`)                               │
│                                                                 │
│  CORE (17 tools, free, Apache-2.0)                              │
│   omega_store / omega_query / omega_welcome                     │
│   omega_checkpoint / omega_resume_task                          │
│   omega_consolidate / timeline / graph traversal                │
│                                                                 │
│  PRO ADD-ONS (additive, $19/mo)                                 │
│   53 coordination tools (file/branch locking, deadlock detect)  │
│   10 multi-LLM routing tools                                    │
│   8 entity registry tools                                       │
│   6 knowledge-base tools                                        │
│   4 oracle intelligence tools                                   │
│   4 secure profile tools (AES-256-GCM + Keychain)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Local Embedding                                                 │
│   BGE-small-en-v1.5 ONNX (~90 MB), 384-dim                      │
│   CPU inference, ~8 ms per embedding                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Local Storage                                                   │
│   SQLite + sqlite-vec (vector similarity)                       │
│   FTS5 (full-text)                                              │
│   ~10 MB for ~240 memories; ~50 ms query                        │
│   Pro: optional Supabase cloud sync                             │
│   Pro: AES-256-GCM encryption + macOS Keychain                  │
└─────────────────────────────────────────────────────────────────┘
```

## Storage model
- **SQLite** with **sqlite-vec** extension for 384-dim vector similarity.
- **FTS5** for full-text / keyword search.
- **No cloud dependency** in Core tier — all data on disk in `~/.omega/`.
- **Optional cloud sync** via Supabase on Pro.
- **AES-256-GCM at rest** + macOS Keychain integration for the **secure profile** module (Pro).
- ~31 MB startup RAM; ~337 MB after model load; ~100 MB disk overhead.

## API surface
Core (17 tools), Pro adds 85 more across coordination, routing, entity, knowledge base, oracle, secure profile modules. Key Core tools:
- `omega_store(content, type, tags)` — typed memory write (decisions / lessons / errors / summaries).
- `omega_query(query, tags, type)` — semantic search with tag + type filters.
- `omega_welcome()` — start-of-session briefing.
- `omega_checkpoint(task_id)` / `omega_resume_task(task_id)` — cross-session continuity.
- `omega_consolidate()` — dedupe + flag contradictions.
- Graph traversal across related memories.
- Timeline view + weekly digest.
- `omega doctor` — health check CLI.

Search pipeline:
1. Vector similarity (cosine).
2. FTS5 keyword.
3. Type-weighted scoring.
4. Contextual re-ranking.

## Memory taxonomy
- **Typed memories**: `decision`, `lesson`, `error`, `summary`, `preference`.
- **Sessions**: bracketed by welcome + checkpoint.
- **Tags** for filtering.
- **Entity registry** (Pro): people / orgs / relationships / hierarchies.
- **Knowledge base** (Pro): ingested PDFs / documents with semantic chunking.
- **Secure profile** (Pro): AES-256-encrypted personal data.

## Integration model
- **MCP server** is the entire delivery mechanism — no SDK, no REST.
- `pip install omega-memory[server]` → `omega setup` → `omega doctor`.
- Per-client setup flags: `--client claude-desktop`, `--client cursor`, etc.
- Library-only mode: `omega setup --hooks-only` (no background process).
- Works with any MCP-compatible client; works with any LLM (LLM is just a renter of the local intelligence).

## Dashboard / UI
- **No web dashboard.** Inspection is CLI-driven: `omega doctor`, timeline view, weekly digest output.
- This is the gap OneMem can fill for local-first agents: a dashboard that reads OMEGA-style local SQLite + an optional verifiable mirror on Walrus.

## What we'd borrow for OneMem
- **Local-first as a primary design axis** — OMEGA proves you can ship serious memory without a cloud round-trip. OneMem's wedge is "local-first + verifiable mirror"; OMEGA is the closest existing reference for the local half.
- **MCP-as-only-surface** — no REST, no SDK ceremony. OneMem should ship MCP first, REST later.
- **Typed memory schema** (`decision` / `lesson` / `error` / `summary`) — this is exactly the structure that maps cleanly to anchored audit logs. Each type = different retention / anchor policy.
- **Apache-2.0 forever on Core + additive Pro** — the right OSS license / business split to win developer trust. OneMem should mirror.
- **AES-256-GCM + Keychain pattern** — a working precedent for client-held keys in a memory layer. OneMem can extend this to Seal-managed keys.
- **`omega doctor`** — single command that returns the runtime health of the memory layer. OneMem needs `onemem doctor` that also reports Sui anchor depth + Walrus blob health.
- **Checkpoint / resume** as session primitives — the obvious anchor-able events. OneMem should anchor `omega_checkpoint` equivalents by default.

## Sources
- https://github.com/omega-memory/omega-memory
- https://github.com/omega-memory/omega-memory/blob/main/README.md
- https://github.com/omega-memory/core
- https://github.com/omega-memory/omega-memory/blob/main/llms-install.md
- https://omegamax.co/
- https://omegamax.co/pricing
