# Demo: Multi-Agent Coordination

> Current implementation note, 2026-06-17: the executable v0.1 harness lives in
> `demos/multi-agent-coordination`. It writes real Sui testnet TraceSessions
> with cross-session `parent_call_id` links, but Claude Code, Hermes, CrewAI,
> and LangGraph execution are mocked. The current dashboard supports linked
> call markers and grouped verification/export; a true `/trace/[id]`
> cross-session tree walker remains future work.

**Wedge moment:** cross-runtime trace composition. Claude Code spawns a Hermes sub-agent, which uses a LangGraph workflow. ALL THREE render as ONE unified trace tree in the dashboard.

**Duration:** ~90 seconds.

---

## Story

Abu's Claude Code session needs to do parallel data analysis. Claude Code delegates to a Hermes Agent (which is better at parallel orchestration). Hermes spawns a LangGraph workflow (which is better at chained inference). All three runtimes write to the same OneMem namespace. The dashboard renders the cross-runtime composition as ONE tree.

This is THE demo that proves cross-runtime trace composition.

---

## Script

```
[0:00 — Claude Code in foreground]
Narrator: "I need to analyze 50 documents in parallel and produce a summary.
           Claude Code's good at orchestration; Hermes is good at parallel;
           LangGraph is good at chained inference. Let's use all three."

Abu (in Claude Code): "Spawn a Hermes sub-agent to analyze ./docs/ in parallel.
                        Use LangGraph for the final synthesis step."

[0:15 — Claude Code calls a Hermes sub-process]
[Cross-runtime parent_call_id set via env var]

[Hermes starts; spawns 10 worker tasks; each task uses a LangGraph workflow]

[0:35 — All workers complete; Hermes returns final summary]

Claude: "Done. Summary: ... [3-sentence summary]"

[0:42 — Abu opens dashboard]
Abu: "$ onemem dashboard"

[/trace/[session_id] for Claude Code's session opens]

[0:48 — Tree shows the FULL composition]
[Tree:
  Session 0xCC_main (Claude Code)
  └─ ✓ delegate_to_subagent → spawned 0xH_session
     └─ Session 0xH_session (Hermes)  [color-coded different]
        ├─ ✓ analyze_doc_1 → spawned 0xLG_1
        │  └─ Session 0xLG_1 (LangGraph)
        │     ├─ ✓ extract_entities
        │     ├─ ✓ semantic_chunk
        │     └─ ✓ summarize
        ├─ ✓ analyze_doc_2 → spawned 0xLG_2
        │  └─ Session 0xLG_2 (LangGraph)
        │     └─ ... (similar)
        ├─ ... (10 docs total)
        └─ ✓ final_synthesis
]

Narrator: "One tree. Three runtimes. Color-coded by agent. All
           hierarchically composed via parent_call_id references."

[1:10 — Click Verify]
Abu clicks "Verify chain" on the root session.

[Drawer walks ALL trace sessions in the hierarchy, ~120 calls total]
[Each glows chartreuse as verified]

[1:25 — VERIFIED]
"✓ VERIFIED  3 runtimes  3 trace sessions  120 calls  All integrity-preserved"

[1:30 — Closing]
Narrator: "Cross-runtime. Cross-framework. Cryptographically composed.
           This doesn't exist anywhere else."

[Demo card]
"OneMem · onemem.ai"
[End]
```

---

## What's exercised

- Pillar 1: ActionCall.parent_call_id cross-runtime composition
- Pillar 2: Both TS SDK (Claude Code) AND Python SDK (Hermes, LangGraph wrapper)
- Pillar 3: Claude Code + Hermes plugins
- Pillar 4: LangGraph provider (v0.2; for v0.1 demo, use Hermes `on_delegation` + manual ActionCall emit)
- Pillar 7: `/trace/[id]` rendering the cross-runtime tree
- Hermes `on_delegation` hook setting `parent_call_id` correctly
- Env var propagation (`ONEMEM_PARENT_TRACE_SESSION_ID` + `ONEMEM_PARENT_CALL_ID`)

---

## Reproducibility

The demo script (simplified):

```python
# Claude Code plugin emits delegate_to_subagent call
# → calls subprocess: hermes chat "analyze ./docs/ in parallel; LangGraph for synthesis"
#   with env: ONEMEM_NAMESPACE_ID=... ONEMEM_PARENT_TRACE_SESSION_ID=... ONEMEM_PARENT_CALL_ID=...
# 
# Hermes plugin reads env vars → starts its own TraceSession with parent_call_id set
# 
# Within Hermes: for each doc, spawn a LangGraph workflow
#   with env: ONEMEM_PARENT_CALL_ID=<the analyze_doc_X call ID>
# 
# LangGraph workflow uses onemem-langgraph (v0.2 — at v0.1 manually emit ActionCalls)
```

Pre-record the agent runs; trace is captured; play back in dashboard for demo.

---

## What makes this demo land

1. **No other product can do this.** Mem0, claude-mem, Zep, Letta — none compose traces across runtimes.
2. **The tree is visually striking.** Nested, color-coded, with delegation markers. Looks like a real distributed system trace.
3. **120 verified calls** at scale shows the Merkle chain holds up.
4. **Narrator's line: "This doesn't exist anywhere else."** — said with confidence because it's true.

---

## v0.1 vs v0.2 caveat

At v0.1, the LangGraph provider isn't shipped (deferred per `04-frameworks/deferred-frameworks.md`). For the demo, we either:
- (a) Manually emit LangGraph ActionCalls via the Python SDK directly (works; less polished)
- (b) Use a pre-recorded run from v0.2 prep work
- (c) Substitute a v0.1-supported framework (e.g., CrewAI sub-task instead of LangGraph workflow)

Recommendation: (c) for v0.1 demo (use CrewAI as the third layer), then re-record with LangGraph at v0.2.

---

## Cross-references

- `README.md`
- `../03-runtimes/hermes-plugin.md` — `on_delegation` hook (the load-bearing mechanic)
- `../04-frameworks/trace-emit-contract.md` — env var propagation contract
- `../06-dashboard/route-trace.md` — tree rendering with cross-runtime hierarchy
- `../01-protocol/data-model.md` — parent_call_id field
