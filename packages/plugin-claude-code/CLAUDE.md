# `@onemem/claude-code-plugin` — Coding Agent Context

OneMem hook plugin for Claude Code. **Coexists with claude-mem** — both can be installed in the same project. OneMem owns verifiable on-chain action traces (`event::emit_authenticated` writes); claude-mem owns local conversation summary + semantic recall.

## Read before editing
- `docs/05-our-architecture/03-runtimes/claude-code-plugin.md` (hook surface contract)
- `docs/02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` (reference pattern — SSE viewer, hook flow)
- `docs/02-inspirations/claude-mem/README.md` (what claude-mem does; we complement, never compete)

## Non-negotiables
- **Hooks must be FAST.** `PostToolUse` runs synchronously on every tool call; >100ms latency cripples Claude Code UX. Push slow work (Walrus blob upload, Seal encryption) to a background process.
- **Never crash the parent.** Hook scripts exit 0 on internal error; log to `~/.onemem/logs/claude-code-plugin.log` instead of failing the tool call.
- **Coexist with claude-mem.** Don't replace its directories or hooks. Check `~/.claude-mem/` exists; integrate, don't overwrite.
- **No plaintext writes.** All content goes through `@onemem/sdk-ts` which Seal-encrypts client-side.
- **TDD per `superpowers:test-driven-development`.** Vitest. Integration test against a real Claude Code session via the `claude` CLI subprocess.

## Hooks we implement
| Hook | Script | Purpose |
|---|---|---|
| `PostToolUse` | `scripts/observe.js` | Emit ActionCallEmitted/ActionCallClosed for the tool call |
| `UserPromptSubmit` | `scripts/observe.js` | Open a new TraceSession or attach to the active one |
| `SessionStart` | `scripts/inject.js` | Inject relevant memories into the system prompt |
| `SessionEnd` | `scripts/summarize.js` | Close the TraceSession + emit final Merkle root |
