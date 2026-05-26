# Route: `/memories` — Dashboard

Memory list view with search + filter + per-app provenance column. Lifts from Mem0's OpenMemory `/memories` pattern + adds OneMem's verification badge + Sui txid links.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Sidebar │ Topbar                                                      │
├─────────┼────────────────────────────────────────────────────────────┤
│         │  Memories                                  [+ Add memory]   │
│         │                                                             │
│         │  ┌──────────────────────────────────────────────────────┐  │
│         │  │ 🔍 Search memories...                                │  │
│         │  └──────────────────────────────────────────────────────┘  │
│         │                                                             │
│         │  [All ▾] [Class: all ▾] [Tier: all ▾] [App: all ▾]         │
│         │  [Verified: any ▾] [Sort: newest ▾]                         │
│         │                                                             │
│         │  ┌─────────────────────────────────────────────────────┐   │
│         │  │ ☐ │ Text                  Class  App     Verified  │   │
│         │  ├───┼──────────────────────────────────────────────────┤   │
│         │  │ ☐ │ User prefers dark...  epis.  CC       ✓ Verified│  │
│         │  │ ☐ │ Project uses pnpm     sem.   CC       ✓ Verified│  │
│         │  │ ☐ │ Run pnpm test         proc.  Hermes   ✓ Verified│  │
│         │  │ ☐ │ User's Sui addr is... sem.   CC       ✓ Verified│  │
│         │  │ ... 138 more ...                                     │  │
│         │  └─────────────────────────────────────────────────────┘   │
│         │                                                             │
│         │  Showing 1-20 of 142  ← →                                   │
│         │                                                             │
└─────────┴────────────────────────────────────────────────────────────┘
```

Click any row → opens side drawer with full memory detail.

---

## Components

| Component | Purpose |
|---|---|
| `<MemorySearch>` | Debounced search input; calls `client.search(query)` |
| `<MemoryFilterChips>` | Class / Tier / App-provenance / Verified filters (multi-select) |
| `<MemoryTable>` | Sortable, paginated, checkbox-selectable rows |
| `<MemoryDetailDrawer>` | Right-side drawer with full memory view |
| `<AddMemoryDialog>` | Modal for `client.add()` |
| `<BulkActionsBar>` | Appears when ≥1 row selected; offers Delete, Update tier, Export |

---

## Filter UX

Filter chips at top of list. Active filters render as chips with X button to remove. Combinable AND filter logic.

Filter fields (`MemoryFilterChips`):
- **Class:** semantic / episodic / procedural / all (Mem0-pattern)
- **Tier:** L0 / L1 / L2 / all (OpenViking-pattern)
- **App (provenance):** Claude Code / OpenClaw / Hermes / Cursor / etc / all
- **Verified:** verified / unverified / any
- **Date range:** custom date picker (last 24h / 7d / 30d / custom)

URL state: filters serialize to query params (`?class=semantic&app=claude-code`) for shareable views.

---

## Memory detail drawer

When user clicks a memory row:

```
┌─────────────────────────────────────┐
│ Memory 0xmem123...           [✕]    │
├─────────────────────────────────────┤
│                                     │
│  ✓ Verified                         │
│                                     │
│  Text                               │
│  ┌─────────────────────────────────┐│
│  │ User prefers dark mode and uses ││
│  │ TypeScript for the frontend.    ││
│  └─────────────────────────────────┘│
│                                     │
│  Class    Tier   Verified           │
│  episodic L0     ✓                  │
│                                     │
│  Provenance                         │
│  ├─ App: Claude Code 1.2.3          │
│  ├─ Agent: claude-code-1.2.3        │
│  ├─ Session: 0xsess... ↗            │
│  └─ Captured: 2026-05-26 14:32      │
│                                     │
│  On-chain                           │
│  ├─ Walrus blob: 0xblob... ↗        │
│  ├─ Seal envelope: 0xenv...         │
│  ├─ Sui tx: 0xtx... ↗ Suiscan       │
│  └─ Merkle root: 0xroot...          │
│                                     │
│  Version history (3 versions)       │
│  ├─ v1 — 2026-05-20 ↗               │
│  ├─ v2 — 2026-05-22 ↗               │
│  └─ v3 — 2026-05-26 (current)       │
│                                     │
│  Related memories (12)              │
│  ├─ "Project uses pnpm" ↗           │
│  ├─ "User's Sui addr is..." ↗       │
│  └─ ... 10 more ...                 │
│                                     │
│  Access log                         │
│  ├─ 14:32 Read by claude-code       │
│  ├─ 13:18 Read by hermes            │
│  └─ ... 4 more ...                  │
│                                     │
│  [Edit] [Delete] [Share]            │
└─────────────────────────────────────┘
```

The Provenance + On-chain + Version history + Access log sections are NEW vs Mem0/claude-mem. The verification badge + Suiscan links are the headline differentiator.

---

## Add memory dialog

```
┌──────────────────────────────────┐
│ Add memory                  [✕]  │
├──────────────────────────────────┤
│ Text                             │
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ └──────────────────────────────┘ │
│                                  │
│ Class:  [semantic ▾]             │
│ Tier:   [L0 ▾]                   │
│ Tags (optional): [____________]  │
│                                  │
│      [Cancel]   [Save memory]    │
└──────────────────────────────────┘
```

On save: SDK `client.add(text, opts)` → upload via /manual flow → Sui tx → on success: row appears in list with verification check animating green.

---

## Bulk actions

When user checks ≥1 row, BulkActionsBar slides up from bottom:

```
3 selected   [Delete]  [Move to tier: L2 ▾]  [Export verification bundle]
```

---

## Search behavior

- Debounced 300ms
- Calls `client.search(query, { topK: 20, threshold: 0.3 })`
- Highlights query terms in results (using `<mark>` styling — lavender background)
- Shows relevance score (right-aligned, muted)

---

## Empty / loading / error states

- **Empty (no memories):** illustration + "Add your first memory or install OneMem in a runtime to capture automatically"
- **Loading:** skeleton rows
- **Search returns 0:** "No memories matching 'X'. Try a different query or check spelling."
- **Auth error:** redirect to `/cli-login` (hosted) or show "Run `onemem login`" message (local)

---

## Cross-references

- `ui-architecture.md`
- `route-trace.md` — clicking session link in provenance opens trace view
- `route-share.md` — Share button opens share flow
- `../02-sdks/shared-api-surface.md` — methods: `search`, `add`, `update`, `delete`, `getAll`, `history`
- `../../02-inspirations/mem0/README.md` — OpenMemory `/memories` pattern reference
