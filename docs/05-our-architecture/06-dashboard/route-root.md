# Route: `/` (Overview) — Dashboard

Landing page when user opens the dashboard. Lightweight, scan-able, surfaces what's been happening recently.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Sidebar  │  Topbar (Active namespace dropdown, theme, account)        │
│          ├──────────────────────────────────────────────────────────  │
│          │                                                            │
│  -       │  Welcome to OneMem                                         │
│  Overview│  Verifiable agent memory + trace on Walrus + Sui           │
│  Memories│                                                            │
│  Apps    │  ┌──────────┬──────────┬──────────┬──────────┐            │
│  Trace   │  │ Memories │ Sessions │ Caps     │ Verify   │            │
│  Sessions│  │  142     │   47     │   3      │  142/142 │            │
│  Share   │  └──────────┴──────────┴──────────┴──────────┘            │
│  Settings│                                                            │
│          │  Recent activity                                           │
│          │  ┌────────────────────────────────────────────────────┐    │
│          │  │ 14:32  Claude Code  Read /Users/.../file.ts ✓     │    │
│          │  │ 14:31  Claude Code  Bash "pnpm test" ✓            │    │
│          │  │ 14:29  Hermes       analyze_data() ✓               │    │
│          │  │ ... 8 more ...                                     │    │
│          │  └────────────────────────────────────────────────────┘    │
│          │                                                            │
│          │  Connected runtimes                                        │
│          │  ┌────────────────────┐ ┌────────────────────┐            │
│          │  │ Claude Code        │ │ Hermes             │            │
│          │  │ Full coverage ●    │ │ Full coverage ●    │            │
│          │  │ Last seen: 2s ago  │ │ Last seen: 14m ago │            │
│          │  └────────────────────┘ └────────────────────┘            │
│          │  ┌────────────────────┐ ┌────────────────────┐            │
│          │  │ Cursor             │ │ + Add runtime      │            │
│          │  │ Partial coverage ◐ │ │                    │            │
│          │  │ Last seen: 2h ago  │ │                    │            │
│          │  └────────────────────┘ └────────────────────┘            │
│          │                                                            │
│          │  Active namespace                                          │
│          │  ┌────────────────────────────────────────────────────┐    │
│          │  │ "personal" (USER)                                  │    │
│          │  │ Merkle root: 0xabc...  (view on Suiscan ↗)         │    │
│          │  │ 142 memories • 47 sessions • 3 caps minted         │    │
│          │  └────────────────────────────────────────────────────┘    │
│          │                                                            │
└──────────┴──────────────────────────────────────────────────────────┘
```

---

## Components used

| Component | Purpose |
|---|---|
| `<StatsCard>` | One of the 4 top-row stats (Memories / Sessions / Caps / Verify ratio) |
| `<RecentActivityList>` | Last 10 ActionCalls (live via SSE) |
| `<RuntimeCard>` | Per-connected-runtime status card with coverage badge |
| `<NamespaceCard>` | Active namespace summary with Suiscan link |
| `<AddRuntimeCTA>` | Dashed-border card linking to `/apps` for installing more runtimes |

---

## Data flow

```
useSWR(["/api/overview", namespaceId], fetcher)
  → returns: { stats, recentCalls, connectedRuntimes, namespace }

useSSE("new_action_call", (event) => {
  // prepend to recentCalls
  mutate("/api/overview");  // refresh stats
});
```

---

## Empty state

If user has no activity yet:

```
You haven't connected any runtimes yet.

Install OneMem in your AI coding agent to start capturing memory and traces:

  [Install in Claude Code →]
  [Install in OpenClaw →]
  [Install in Hermes →]
  
  Or, install everywhere:  $ onemem install --runtime all
```

---

## Mobile responsive

Stats cards stack vertically on <768px. Recent activity list takes full width. Runtime cards: 2 columns on tablet, 1 column on phone.

---

## Cross-references

- `ui-architecture.md` — overall page structure
- `design-system.md` — brand application
- `data-flow.md` — overview API route + SSE
- `route-memories.md` — link target for "View all memories"
- `route-apps.md` — link target for "Add runtime"
