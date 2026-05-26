# Pillar 5 — CLI (OneMem)

`onemem` — the developer command-line for OneMem. Both Node (`@onemem/cli`) and Python (`onemem-cli`) implementations, identical command surface so users can pick whichever runtime they already have.

---

## Read order

| File | Purpose |
|---|---|
| `README.md` | This file — design principles |
| `command-surface.md` | **Load-bearing.** Every command, sub-command, flag, exit code |
| `output-design.md` | Color, table format, error format, JSON output |
| `cli-typescript-impl.md` | `@onemem/cli` Node implementation (using commander.js) |
| `cli-python-impl.md` | `onemem-cli` Python implementation (using typer) |
| `login-flow.md` | Browser-based wallet login (mirrors MemWal MCP login) |

---

## Design principles

1. **Same command surface in both languages.** Identical commands, sub-commands, flags, exit codes, output format. Differences only at the install command level (`npm i -g @onemem/cli` vs `pip install onemem-cli`).
2. **Mirrors Mem0's CLI pattern** where applicable + adds OneMem-specific commands (trace, verify, replay, namespace, dashboard).
3. **Mirrors claude-mem's `install --runtime <id>` pattern** so users can wire OneMem into any runtime with one command.
4. **JSON output via `--json` flag** on every read command — for scripting.
5. **Colored, table-formatted human output by default** — uses `chalk` (Node) / `rich` (Python).
6. **Read commands fast (<500ms p95)** — direct relayer + chain calls, no waiting on Sui finality.
7. **Write commands report on-chain tx digest + Walrus blob ID** so users can verify externally.
8. **Apache-2.0 license.**

---

## Implementation status

| Component | Status |
|---|---|
| `@onemem/cli` skeleton | ⏳ pending |
| Command surface implemented (Node) | ⏳ pending |
| `onemem-cli` skeleton | ⏳ pending |
| Command surface implemented (Python) | ⏳ pending |
| Browser login flow | ⏳ pending |
| `onemem install --runtime <id>` per-runtime configurators | ⏳ pending |

---

## Cross-references

- `../02-sdks/shared-api-surface.md` — SDK API the CLI wraps
- `../../02-inspirations/mem0/README.md` — Mem0 CLI patterns
- `../../02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` — claude-mem install --ide pattern
