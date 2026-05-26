# Route: `/sessions/[session_id]` — Dashboard

Multi-trace session view. When a "session" spans multiple TraceSessions (e.g., user worked across Claude Code + Hermes + Cursor on the same project over a day), this view unifies them as one logical session.

Distinct from `/trace/[session_id]` which is a single TraceSession Move object.

---

## When this matters

User-facing "session" concept:
- Same user
- Same project / namespace
- Time-bounded (e.g., "today's work")
- Spans multiple agent runtimes

Each runtime emits its own TraceSession Move object. This view groups them.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Sidebar │ Topbar                                                      │
├─────────┼────────────────────────────────────────────────────────────┤
│         │  Session: 2026-05-26 10:00 → 18:00 ("Today")                │
│         │                                                             │
│         │  3 runtimes • 47 calls total • All verified ✓               │
│         │                                                             │
│         │  Timeline (unified Gantt across runtimes)                   │
│         │  ┌─────────────────────────────────────────────────────┐    │
│         │  │ Claude Code  ████████      ███       ████           │    │
│         │  │ Hermes              ████████                        │    │
│         │  │ Cursor                            ██                │    │
│         │  └─────────────────────────────────────────────────────┘    │
│         │                                                             │
│         │  Sub-sessions:                                              │
│         │  ┌──────────────────────────────────────────────────┐      │
│         │  │ 10:14-10:32 Claude Code  0xCC_sess1...  18 calls │      │
│         │  │ 10:20-10:24 Hermes       0xH_sess1...   8 calls │      │
│         │  │ 11:05-11:08 Cursor       0xCU_sess1...  3 calls │      │
│         │  │ 14:30-14:35 Claude Code  0xCC_sess2...  47 calls │      │
│         │  └──────────────────────────────────────────────────┘      │
│         │                                                             │
│         │  [Verify ALL]   [Replay full session]   [Export]            │
│         │                                                             │
└─────────┴────────────────────────────────────────────────────────────┘
```

---

## Grouping logic

How sessions are grouped into "user sessions":

Option A (default): time-bucket — group by day; show all runtimes' TraceSessions in that day's namespace.

Option B (smart): cluster by `parent_call_id` chains — if Claude Code's session delegates to Hermes (`parent_call_id` cross-references), group them.

Option C (manual): user explicitly creates a session via `onemem trace tag-session <name> --include=<session_ids>`.

v0.1: Option A only. Options B+C in v0.2.

---

## What this enables (the cross-runtime composition demo)

User says "show me everything that happened today":
- Unified timeline across Claude Code, Hermes, Cursor
- One "Verify ALL" button walks every TraceSession's Merkle chain
- One "Replay" button reconstructs the entire day from chain + Walrus
- Export bundle includes all sessions' verification data

The cross-runtime composition story made tangible.

---

## Components reused from `/trace/[id]`

- `<TraceGantt>` (extended to render multiple TraceSessions on the same axis)
- `<TraceTree>` (rendered per sub-session)
- `<VerifyDrawer>` (runs verify across all sub-sessions sequentially)
- `<ReplayModal>` (runs replay across all sub-sessions)
- `<ExportDialog>`

---

## Cross-references

- `route-trace.md` — single TraceSession view (the per-session detail)
- `ui-architecture.md`
- `../03-runtimes/hermes-plugin.md` — `on_delegation` for parent_call_id cross-runtime linking
- `../01-protocol/data-model.md` — `TraceSession` + `ActionCall` structs
