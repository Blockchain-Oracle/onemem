# Cline Memory Bank

## What it is

Cline (formerly Claude Dev) is an open-source code agent for VS Code. **Memory Bank** is Cline's persistent project context system — a structured set of markdown files in your repo that Cline reads/writes/verifies across sessions to avoid re-exploring the codebase on every new chat.

Memory Bank is not a product; it's a **convention** that Cline enforces, plus an MCP server (`cline-memory-bank` / `dazeb-cline-mcp-memory-bank`) for managing it programmatically.

## Storage model

- **Plain markdown files in the repo**, typically under `memory-bank/`:
  - `projectbrief.md` — foundation document
  - `productContext.md` — why this project exists
  - `activeContext.md` — current work focus
  - `systemPatterns.md` — architecture & patterns
  - `techContext.md` — tech stack & setup
  - `progress.md` — status & milestones
- **Operates on a continuous read-verify-execute-update cycle.** Cline reads the bank at session start, executes, updates the bank before exiting.
- **Versioned by git.** The bank is part of the repo, so it ships with the codebase and survives across users.

## API surface

- No SDK — Cline reads/writes the files directly via its file-tool plugin.
- An optional **MCP server** wraps the bank for programmatic use by other clients.

## Integration model

- **VS Code extension (Cline)** is the primary consumer.
- **MCP server** lets other tools (Cursor, Claude Code, etc.) read the same bank.
- **Repo-resident** — no external service.

## What we'd borrow for OneMem

- **The markdown-as-memory pattern is brilliant for one reason: it's diffable, reviewable, and human-readable.** OneMem's anchored blobs should be human-readable JSON/markdown by default, not binary protobufs.
- **The 6-file structure is a near-perfect schema for the MemoryNamespace.** OneMem could literally adopt these names (or close variants) as the default child object types of a namespace.
- **Continuous read-verify-execute-update cycle = exactly the loop OneMem wants on each session.** Read the namespace state from Sui, verify (hash-check Walrus blobs), execute the agent run, update + anchor at the end.
- **Repo-coupled portability.** Cline's bank travels with the git repo — so a teammate cloning the repo inherits the agent's memory of the project. OneMem can do the same with a Sui namespace object reference in `package.json` / `Cargo.toml` / etc.
- **The cross-tool MCP wrapper is the right distribution choice.** Cline made its bank usable from any MCP client. OneMem's MCP server lets any agent runtime (Hermes, Letta, elizaOS, Claude Code, Cursor, Windsurf) read/write the same namespace.
- **Critique:** Cline Memory Bank has no verifiability, no cryptographic provenance, no cross-user reputation. OneMem is precisely the layer that bolts those properties onto this pattern.

## Sources

- https://docs.cline.bot/features/memory-bank
- https://cline.bot/blog/memory-bank-how-to-make-cline-an-ai-agent-that-never-forgets
- https://mcpmarket.com/server/cline-memory-bank
- https://lobehub.com/mcp/dazeb-cline-mcp-memory-bank
- https://memu.pro/blog/cline-vscode-ai-agent-memory
