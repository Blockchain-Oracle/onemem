# Plan: Codex Built-In Memory Positioning

Date: 2026-06-17

## Objective

Close the Codex-memory follow-up by documenting how OneMem relates to first-party
Codex Memories and Chronicle without changing the runtime code path.

## Work

1. Refresh Codex docs with Context7 and official OpenAI docs.
2. Update `packages/plugin-codex/README.md` to distinguish OneMem from Codex
   built-in Memories.
3. Update the Codex skill rules so agents do not confuse local Codex Memories
   with OneMem's verifiable MCP-backed memory.
4. Update the runtime matrix and Codex notes so the incumbent memory story and
   distribution channel are current.
5. Register the research, plan, and verification artifacts in the structure test.
6. Update the Context Engineering status queue.

## Checks

- `pnpm test:structure`

## Non-Goals

- Do not add code that edits `~/.codex/memories`.
- Do not claim live Codex hook trace parity.
- Do not publish the plugin to a public marketplace in this slice.

