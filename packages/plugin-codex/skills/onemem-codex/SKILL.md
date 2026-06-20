---
name: onemem-codex
description: Use when the user asks Codex to remember, recall, search, save, list, or delete OneMem memory.
---

# OneMem For Codex

Use the bundled OneMem MCP tools when the user asks for durable memory or
cross-session recall.

## Tooling

- Save durable memory with `onemem_add_memory`.
- Search prior memory with `onemem_search_memory`.
- Fetch one memory with `onemem_get_memory`.
- List memories with `onemem_list_memories`.
- Remove a memory with `onemem_delete_memory`.

Memory is client-side Seal-encrypted and stored on Walrus via MemWal — the
relayer never sees plaintext, and the memory is owned by the user across runtimes.

## Rules

- Do not treat Codex built-in Memories as the OneMem backend. Codex Memories are
  local Codex state; OneMem is the decentralized, cross-runtime memory exposed
  through MCP.
- Prefer searching memory before implementing when the user asks about prior
  decisions or project history.
- Save concise, durable decisions only when the user asks to remember something
  or when the work produces a stable project fact worth retaining.
- Do not store secrets, private keys, API keys, or raw credentials.
- Do not claim any on-chain action trace, replay, or verification feature — the
  surface is memory (store/search/recall) plus a live local dashboard view.
