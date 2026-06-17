---
name: onemem-claude-code
description: Use when working with OneMem in Claude Code, especially memory, trace capture, hook behavior, or coexistence with claude-mem.
---

# OneMem For Claude Code

Use OneMem for verifiable on-chain action traces in Claude Code. OneMem can
coexist with claude-mem: OneMem owns Sui/Walrus/Seal trace evidence, while
claude-mem owns local conversation summaries and semantic recall.

## Hook Model

The plugin implements these Claude Code hooks:

- `SessionStart` -> `scripts/inject.js`: opens a OneMem `TraceSession` when
  trace configuration exists.
- `PostToolUse` -> `scripts/observe.js`: buffers tool calls locally and exits
  quickly.
- `SessionEnd` -> `scripts/summarize.js`: flushes buffered calls on-chain and
  closes the trace session.

## Rules

- Keep hooks fast. `PostToolUse` must not do Sui, Walrus, or Seal network work.
- Never crash or block the parent Claude Code session. Hook scripts should exit
  `0` defensively on internal OneMem failures.
- Do not replace claude-mem directories, hooks, or storage.
- Do not store secrets, private keys, API keys, or raw credentials.
- Do not claim live automatic trace coverage unless the plugin is installed,
  hooks are enabled by Claude Code, and the resulting OneMem `TraceSession`
  verifies on-chain.

## Configuration

Trace capture needs:

- `ONEMEM_NAMESPACE_ID`
- `ONEMEM_RW_CAP_ID`
- `ONEMEM_PRIVATE_KEY` or a local Sui keystore
- `SUI_NETWORK`

Without those values, the plugin is intentionally inert rather than partially
writing traces.
