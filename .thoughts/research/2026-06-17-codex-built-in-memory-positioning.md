# Reality Research: Codex Built-In Memory Positioning

Date: 2026-06-17

## Scope

Clarify whether OneMem needs a separate Codex Memory path beyond the existing
`packages/plugin-codex` package, and how that package should be positioned now
that Codex has first-party Memories and Chronicle docs.

## Sources Checked

- Context7 `/openai/codex` docs for plugin, marketplace, MCP, and hook shapes.
- OpenAI Codex Memories docs:
  `https://developers.openai.com/codex/memories`
- OpenAI Codex Chronicle docs:
  `https://developers.openai.com/codex/memories/chronicle`
- OpenAI Codex Hooks docs:
  `https://developers.openai.com/codex/hooks`
- OpenAI Codex Plugins docs:
  `https://developers.openai.com/codex/plugins`
- Local Codex CLI:
  `codex-cli 0.140.0`
- Repo files:
  - `packages/plugin-codex/`
  - `docs/03-target-runtimes/README.md`
  - `docs/02-inspirations/claude-mem/README.md`
  - `.thoughts/research/2026-06-17-codex-memory-plugin.md`

## Verified Facts

- Codex has first-party Memories. They are enabled in the Codex app settings or
  with `[features] memories = true` in `config.toml`.
- Codex-generated memories live under the Codex home directory, normally
  `~/.codex/memories/`, as generated local files.
- Codex exposes `/memories` in the app/TUI for thread-level memory behavior.
- Chronicle is an opt-in macOS research preview that can build Codex memories
  from recent screen context.
- Chronicle memories are local markdown files under
  `$CODEX_HOME/memories_extensions/chronicle/`.
- Codex plugins bundle skills, apps, and MCP servers into reusable workflows.
- Codex plugin hooks can be bundled under `hooks/hooks.json`; plugin-bundled
  hooks still require review and trust before they run.
- `packages/plugin-codex` already gives Codex OneMem through a plugin package:
  `.codex-plugin/plugin.json`, `.mcp.json`, a OneMem skill, and optional hooks.

## Interpretation

Codex built-in Memories and OneMem solve adjacent but different jobs.

Codex Memories are local Codex personalization state. They are useful for
preferences, recurring workflows, and project conventions inside Codex. They are
not a Sui/Walrus/Seal/MemWal backend and are not designed as the shared
cross-runtime verification layer.

OneMem should stay MCP-first for Codex. That gives Codex access to the same
verifiable memory/search/verify tools used by other runtimes. Optional Codex
hooks remain the path for automatic tool-call trace capture after live trust
proof.

## Product Position

- Do not call OneMem "Codex Memories" or imply it writes `~/.codex/memories`.
- Say OneMem coexists with Codex Memories.
- Use Codex Memories for local Codex recall.
- Use OneMem for portable, encrypted, shareable, and verifiable memory or trace
  records across runtimes.
- Keep the Codex plugin package as the correct install surface. There is no
  separate first-party "Codex Memory plugin API" to implement.

## Remaining Unknowns

- Live `/hooks` trust/session proof is still needed before claiming automatic
  Codex tool-call trace parity with Claude Code.
- Public distribution still needs a marketplace listing decision.

