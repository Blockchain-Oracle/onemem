---
name: onemem-claude-code
description: Use when working with OneMem in Claude Code, especially memory (store/search/recall), the live local dashboard, hook behavior, or coexistence with claude-mem.
---

# OneMem For Claude Code

Use OneMem for decentralized, portable memory in Claude Code. OneMem can coexist
with claude-mem: OneMem stores memory you own (Seal-encrypted on Walrus via
MemWal) and offers a live local dashboard of session activity, while claude-mem
owns local conversation summaries and semantic recall.

## Hook Model

The plugin implements these Claude Code hooks. They talk to a local OneMem worker
for the live dashboard view — no on-chain work:

- `SessionStart` -> `scripts/inject.js`: registers the session with the local
  OneMem worker.
- `PostToolUse` -> `scripts/observe.js`: posts each tool call to the worker so
  the dashboard fills up live, then exits quickly.
- `Stop` -> `scripts/summarize.js`: marks the session ended so the dashboard
  shows it closed.

Durable memory (store/search/recall) is the bundled MCP server, not the hooks.

## Rules

- Keep hooks fast. `PostToolUse` only posts to the local worker; no Sui, Walrus,
  or Seal network work in hooks.
- Never crash or block the parent Claude Code session. Hook scripts should exit
  `0` defensively on internal OneMem failures.
- Do not replace claude-mem directories, hooks, or storage.
- Do not store secrets, private keys, API keys, or raw credentials.
- The dashboard view is local; durable memory lives on Walrus via MemWal. Do not
  claim any on-chain action trace, replay, or verification feature.

## Configuration

Durable memory tools read MemWal config from `onemem login` credentials or env:

- `ONEMEM_ACCOUNT_ID`, `ONEMEM_DELEGATE_KEY`, `ONEMEM_EMBEDDING_API_KEY`
- `MEMWAL_PACKAGE_ID`, `MEMWAL_RELAYER_URL`, `SUI_NETWORK`

The dashboard hooks use the local worker (`ONEMEM_WORKER_URL`, default
`http://127.0.0.1:4041`) and need no on-chain config.
