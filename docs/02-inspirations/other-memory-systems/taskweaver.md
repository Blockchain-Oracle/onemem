# TaskWeaver (Microsoft)

## What it is

TaskWeaver is Microsoft Research's open-source **code-first** agent framework, designed for data-analytics tasks. The memory model is interesting not because it's a product — it's not — but because TaskWeaver demonstrates a tight, sessionful, scope-aware memory pattern inside the agent loop itself rather than as an external store.

Repository: `microsoft/TaskWeaver`. Maintained but not the primary focus of MS's current agent push (which is more Autogen/Magentic-driven).

## Memory model

TaskWeaver has two kinds of memory in `taskweaver/memory/memory.py`:

1. **Conversation History** — the full conversation between user and the various roles in TaskWeaver (planner, code-interpreter, etc.).
2. **Shared Memory** — explicit cross-role information sharing via `SharedMemoryEntry` attachments. Each entry has:
   - `type` — what kind of info
   - `content` — the actual data
   - `scope` — `round` (only valid for current round) or `conversation` (persists for full conversation)

## Plugin state

Distinctive: each TaskWeaver session is bound to a **Jupyter kernel**. Plugin objects live in kernel memory and persist across calls within the session. Plugins can hold stateful objects (DataFrames, models, etc.) between invocations — memory as kernel state, not as DB rows.

## API surface

- Python SDK
- YAML-defined roles and plugins
- No MCP server, no managed cloud

## Integration model

- **Self-contained Python app.** You import TaskWeaver, configure it, and run it.
- **Jupyter kernel is the runtime.**
- **No external memory backend** — the conversation history and shared memory are in-process; plugin state is in kernel memory.

## What we'd borrow for OneMem

- **The `scope` field on shared memory (`round` vs `conversation`) is a clean primitive.** OneMem should support scoped writes: ephemeral (don't anchor), session (anchor at session end), permanent (anchor immediately). One enum, three values.
- **Kernel state as memory** is an underrated pattern. A long-running agent session often has live objects (DataFrames, models, parsed configs) that are too large/expensive to re-derive. OneMem could optionally checkpoint these to Walrus on session pause/resume — distinct from "facts" memory.
- **Role-aware memory.** TaskWeaver has multiple roles (planner, executor, user) each writing to a shared bus. OneMem's MemoryNamespace could carry role labels on writes — useful for trace reconstruction.
- **Limited direct overlap.** TaskWeaver is a niche framework — not a popular integration target. Borrow the design ideas, not the integration path.

## Sources

- https://microsoft.github.io/TaskWeaver/docs/memory/
- https://github.com/microsoft/TaskWeaver
- https://github.com/microsoft/TaskWeaver/blob/main/taskweaver/session/session.py
- https://www.microsoft.com/en-us/research/blog/taskweaver-a-code-first-agent-framework-for-efficient-data-analytics-and-domain-adaptation/
- https://microsoft.github.io/TaskWeaver/docs/overview/
