---
name: onemem-codex
description: Use when the user asks Codex to remember, recall, search, save, verify, replay, or inspect OneMem memory or trace sessions.
---

# OneMem For Codex

Use the bundled OneMem MCP tools when the user asks for durable memory,
cross-session recall, or verifiable trace inspection.

## Tooling

- Save durable memory with `onemem_add_memory`.
- Search prior memory with `onemem_search_memory`.
- Verify a trace session with `onemem_verify_trace`.
- Replay or inspect trace sessions with the available OneMem trace tools.

## Rules

- Do not treat Codex built-in Memories as the OneMem backend. Codex Memories are
  local Codex state; OneMem is the verifiable cross-runtime memory and trace
  system exposed through MCP.
- Prefer searching memory before implementing when the user asks about prior
  decisions or project history.
- Save concise, durable decisions only when the user asks to remember something
  or when the work produces a stable project fact worth retaining.
- Do not store secrets, private keys, API keys, or raw credentials.
- Do not claim full Codex tool-call trace coverage unless the lifecycle hooks
  are configured, trusted, and verified in the current environment.
