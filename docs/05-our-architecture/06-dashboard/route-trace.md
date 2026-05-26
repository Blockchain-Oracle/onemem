# Route: `/trace/[session_id]` — Dashboard (HEADLINE)

**This is the headline view.** Everything else exists to support this. The Verify drawer turning chartreuse is THE demo moment.

Lifts UX patterns from LangSmith (tree + tabbed detail), Phoenix (Gantt above tree), Langfuse (sessions view). Adds OneMem-unique: Verify drawer, Replay modal, on-chain Suiscan links per call.

---

## Layout

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Sidebar │ Topbar                                                          │
├─────────┼─────────────────────────────────────────────────────────────────┤
│         │  TraceSession 0xsess... (claude-code-1.2.3, COMPLETED, 47 calls)│
│         │                                                                 │
│         │  ● Verified  Merkle root: 0xabc...  Started: 14:30  Ended: 14:35│
│         │                                                                 │
│         │  [⊕ Verify chain]  [▶ Replay session]  [↗ Share]  [⤓ Export]   │
│         │                                                                 │
│         │  ─── Gantt (Phoenix-inspired) ───────────────────────────────── │
│         │  ┌─────────────────────────────────────────────────────────┐    │
│         │  │ memwal_write   ████                                     │    │
│         │  │ Read           ████                                     │    │
│         │  │ Bash           ─────████████████                        │    │
│         │  │ delegate→hermes              ────████                   │    │
│         │  │   analyze_data                   ───██████              │    │
│         │  │   ...                                                   │    │
│         │  └─────────────────────────────────────────────────────────┘    │
│         │                                                                 │
│         │  ┌─────────────────────────┬─────────────────────────────────┐ │
│         │  │ Tree (LangSmith-style)  │  Detail (selected call)         │ │
│         │  │                          │                                 │ │
│         │  │ Session 0xsess...        │  Call: Read /Users/abu/file.ts  │ │
│         │  │ └─ ✓ memwal_write        │  ────────────────────────────── │ │
│         │  │    ├─ ✓ Read file.ts ←   │  Status:    ✓ SUCCESS           │ │
│         │  │    ├─ ✓ Bash pnpm test   │  Level:     DEFAULT             │ │
│         │  │    ├─ ✓ delegate→hermes  │  Started:   14:30:14.234        │ │
│         │  │    │  ├─ ✓ analyze_data  │  Ended:     14:30:14.421 (187ms)│ │
│         │  │    │  └─ ✓ save_finding  │                                 │ │
│         │  │    └─ ✗ Bash git push    │  Tabs: [Inputs] [Outputs]       │ │
│         │  │                          │        [Metadata] [Verify]      │ │
│         │  │ Sub-sessions:            │                                 │ │
│         │  │ └─ 0xhermes... (8 calls) │  Inputs                         │ │
│         │  │                          │  ┌───────────────────────────┐  │ │
│         │  │ Filters:                 │  │ {                         │  │ │
│         │  │  [Status: all ▾]         │  │   "file_path": "/Users/  │  │ │
│         │  │  [Level: all ▾]          │  │   abu/dev/file.ts"        │  │ │
│         │  │  [Search...]             │  │ }                         │  │ │
│         │  │                          │  └───────────────────────────┘  │ │
│         │  │                          │                                 │ │
│         │  │                          │  Outputs                        │ │
│         │  │                          │  [shiki-rendered file contents] │ │
│         │  │                          │                                 │ │
│         │  │                          │  Verify (on-chain)              │ │
│         │  │                          │  Walrus blob: 0xblob... ↗       │ │
│         │  │                          │  Seal envelope: 0xenv...        │ │
│         │  │                          │  Content hash: 0xc4d...         │ │
│         │  │                          │  Prev hash:    0xa1b...         │ │
│         │  │                          │  Sui tx:       0xtx... ↗ Suiscan│ │
│         │  └─────────────────────────┴─────────────────────────────────┘ │
└─────────┴─────────────────────────────────────────────────────────────────┘
```

---

## Components

| Component | Purpose |
|---|---|
| `<TraceSessionHeader>` | Top metadata block with Verified badge + actions |
| `<TraceActionsBar>` | Verify / Replay / Share / Export buttons |
| `<TraceGantt>` | Time-axis Gantt above the tree (Phoenix-inspired) |
| `<TraceTree>` | Collapsible tree (LangSmith-style); main left-hand view |
| `<TraceCallDetail>` | Right-side detail panel with Inputs/Outputs/Metadata/Verify tabs |
| `<TraceFilters>` | Filter by status/level/tool, search by name |
| `<TraceCallSubsessions>` | When a call delegated to a sub-runtime, link to that runtime's session |
| `<VerifyDrawer>` | THE HEADLINE — slides up from bottom, walks chain, turns chartreuse on success |
| `<ReplayModal>` | Full-session reconstructed view (fullscreen modal) |
| `<ShareDialog>` | Mint a ReadOnly cap to a recipient address |
| `<ExportDialog>` | Tamper-evident export (SARIF/JSON with Walrus IDs + Sui txids + Seal proofs) |

---

## The Verify drawer (the demo moment)

User clicks "⊕ Verify chain" button. Drawer slides up from bottom:

```
┌───────────────────────────────────────────────────────────────────────┐
│ Verifying TraceSession 0xsess...                              [✕]    │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ [████████████████████████████░░░░░░░] 38/47 calls verified            │
│                                                                       │
│ ✓ Call 1/47: memwal_write          0xc4d... ↗                         │
│ ✓ Call 2/47: Read file.ts          0xa1b... ↗                         │
│ ✓ Call 3/47: Bash pnpm test        0xe8f... ↗                         │
│ ...                                                                   │
│ ✓ Call 38/47: save_finding         0xb22... ↗                         │
│   Verifying call 39/47...                                             │
│                                                                       │
│ Expected merkle_root: 0xabc...                                        │
│ Computed merkle_root: 0xabc... (in progress)                          │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

On completion (success):

```
┌───────────────────────────────────────────────────────────────────────┐
│ ✓ VERIFIED                                                    [✕]    │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ All 47 calls verified.                                                │
│ Merkle chain integrity: ✓                                             │
│ On-chain root matches computed root: ✓                                │
│ Walrus blob hashes match plaintext hashes: ✓                          │
│ Seal decryptions: 47/47 ✓                                             │
│                                                                       │
│ This session's actions are cryptographically proven to be exactly     │
│ what the agent reported.                                              │
│                                                                       │
│ [⤓ Export verification bundle]    [↗ Share verification proof]        │
└───────────────────────────────────────────────────────────────────────┘
```

**Visual effect:** the entire `/trace/[id]` page gets a subtle chartreuse glow border (the `shadow-verify` CSS class). The "Verified" badge in the header animates from grey → chartreuse with pulse animation. This is the moment.

On failure:

```
┌───────────────────────────────────────────────────────────────────────┐
│ ✗ VERIFICATION FAILED                                         [✕]    │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ Chain broken at call 12/47: "Bash git push"                          │
│                                                                       │
│ Expected content_hash: 0xa1b...                                       │
│ Actual content_hash:   0xc4d...                                       │
│                                                                       │
│ This means one of:                                                    │
│   - The call's input or output was tampered with on Walrus            │
│   - The call's on-chain commit was tampered with on Sui               │
│   - The Seal key servers returned different plaintext than expected   │
│                                                                       │
│ [Investigate]   [Re-fetch from chain]                                 │
└───────────────────────────────────────────────────────────────────────┘
```

This is the "scary" version — but it's the proof that the verification ACTUALLY DOES SOMETHING. Demos can intentionally trigger this to show what protection users get.

---

## The Replay modal

User clicks "▶ Replay session". Fullscreen modal opens with a timeline scrubber:

```
┌───────────────────────────────────────────────────────────────────────┐
│ Replay TraceSession 0xsess...                                  [✕]    │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ ⏮ ⏯ ⏭   Speed: [1x ▾]                                                │
│ ████████████████████████████░░░░░░░░░░░░░░░  14:30:18 / 14:32:45      │
│                                                                       │
│ ┌─────────────────────────────────────────────────────────────────┐  │
│ │ Current call: Read /Users/abu/file.ts                            │  │
│ │                                                                  │  │
│ │ Inputs:                                                          │  │
│ │ { "file_path": "/Users/abu/dev/file.ts" }                       │  │
│ │                                                                  │  │
│ │ [Outputs render here, shiki-highlighted]                         │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│ All data fetched from on-chain commits + Walrus + Seal-decrypted.    │
│ Independent of the original Claude Code session.                      │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

User can scrub through the session at any speed. Each frame fetches the corresponding call's data from on-chain + Walrus. Demonstrates "even without the original runtime, you can replay what happened."

---

## Data flow

Per `data-flow.md`:

```
On mount:
  1. SWR fetches /api/sessions/[session_id]
     - TraceSession metadata + ActionCalls (metadata only)
  2. Render skeleton tree + skeleton Gantt
  3. SSE subscribes to this session's stream
     - new_action_call → append to tree (live updating for active sessions)
     - call_closed → update node status
  4. User clicks a call:
     - Fetch input/output blobs from Walrus (browser-side)
     - Seal-decrypt (browser-side, requires SessionKey)
     - Render in detail panel
  5. User clicks Verify:
     - Open VerifyDrawer
     - For each call: fetch + decrypt + recompute hash + compare prev_hash
     - Stream progress to drawer
     - On complete: chartreuse glow OR scary failure modal
```

---

## Cross-runtime trace composition (the surprise)

If session has sub-sessions (cross-runtime, e.g., Claude Code delegated to Hermes per `03-runtimes/hermes-plugin.md`):
- Sub-sessions appear in the tree under their parent delegation marker
- Clicking a sub-session expands its calls inline OR links to `/trace/[sub_session_id]` for full focus
- Gantt shows sub-session calls indented + color-coded by agent

This is the demo: ONE trace tree spanning multiple runtimes, all cryptographically verifiable end-to-end.

---

## Cross-references

- `ui-architecture.md`
- `data-flow.md` — verify drawer logic + SSE subscription
- `design-system.md` — `<VerifyBadge>` + chartreuse glow CSS
- `route-share.md` — share dialog opened from here
- `../01-protocol/events-and-attestation.md` — what events drive the SSE feed
- `../02-sdks/shared-api-surface.md` — `trace.verifySession`, `trace.replaySession`
- `../../02-inspirations/langsmith-langfuse/TRACE_VIEWERS_COMPARISON.md` — UX patterns adopted
