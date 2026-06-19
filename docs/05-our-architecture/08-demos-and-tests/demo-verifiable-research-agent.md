# Demo: Verifiable Research Agent

**Wedge moment:** long-running memory accumulates over days. Replay shows what was learned. Demonstrates the "agents become more useful over time" Walrus track language.

**Duration:** ~90 seconds.

---

## Story

A Hermes Agent runs as a "research assistant" over a 3-day project. It searches the web, reads PDFs, writes summaries to memory. On Day 3, Abu asks it a synthesis question. The agent answers using memory accumulated over the prior days. Abu then uses `onemem replay` to reconstruct the full research journey from chain.

---

## Script

```
[0:00 — Research dashboard open, showing 3 days of activity]
Narrator: "Three days ago, I started a research agent on Hermes."

[Show /trace tree spanning multiple sessions across days]

[0:08 — Highlight memory count]
Narrator: "It accumulated 142 memories. Search results, PDF summaries, key findings.
           All encrypted on Walrus. All attested on Sui."

[0:15 — Switch to Hermes terminal]
Abu: "Hermes, what are the three most important findings from this week's research
      on prediction markets?"

[Hermes uses memory recall + generates synthesis]
Hermes: "Based on the 142 memories accumulated, the three key findings are:
         1. CLOB-based markets (like Polymarket) settle slowly...
         2. Sub-hour expiries enable real options-style trading...
         3. Vol surface pricing is the missing primitive..."

[0:45 — Abu opens dashboard]
Narrator: "Now I want to verify what the agent learned. And replay how it got there."

Abu (in dashboard): clicks Replay on the 3-day session.

[0:55 — Replay modal opens with scrubber]
[Modal shows day-by-day timeline; scrubber lets Abu jump to specific calls]

Abu scrubs to Day 1, 14:32 — call: "search_web('options vol surface basics')"
[Detail shows: input, output (encrypted text from a Wikipedia article), tx digest]

Abu scrubs to Day 2, 09:15 — call: "extract_pdf_summary(...)"
[Detail shows extracted summary]

[1:15 — Verify]
Abu clicks Verify on the 3-day session.

[Chain walks all 47 sessions across 3 days. Page glows chartreuse.]
"VERIFIED ✓  3 sessions  142 memories  47 trace sessions  All integrity-preserved"

[1:25 — Closing]
Narrator: "Three days of agent work. Every fact provable.
           Every conclusion reconstructible from chain."

[Demo card]
"OneMem · onemem.xyz"
[End]
```

---

## What's exercised

- Pillar 1: ActionCall + TraceSession with high call volume (stress test for the Merkle chain)
- Pillar 2: SDK memory.add over days, memory.search at query time
- Pillar 3: Hermes plugin (long-running session)
- Pillar 4: Vercel AI SDK provider (Hermes uses gpt-4o under the hood; we wrap)
- Pillar 7: `/sessions/[id]` multi-trace view, Replay modal
- Walrus: 142 encrypted blobs persisting across days
- Sui: hundreds of authenticated events
- Seal: 142 decryptions during replay

---

## Reproducibility

This demo needs 3 days of pre-existing data. For recording:
- Pre-populate by running the agent for 3 days on a test namespace
- OR: simulate by writing 142 memories + 47 traces via the SDK script
- Record the demo against the pre-populated namespace

---

## What makes this demo land

1. **The "over time" story.** Most demos show single-session value. This shows compounding value.
2. **Replay scrubber is visually distinctive.** Nobody else has on-chain session replay.
3. **The verification covers a LOT of data** (142 memories, 47 sessions) — Chain integrity at scale is the proof point.

---

## Cross-references

- `README.md`
- `../03-runtimes/hermes-plugin.md`
- `../06-dashboard/route-sessions.md` — multi-trace view
- `../06-dashboard/route-trace.md` — Replay modal
- `../02-sdks/shared-api-surface.md` — `trace.replaySession`
