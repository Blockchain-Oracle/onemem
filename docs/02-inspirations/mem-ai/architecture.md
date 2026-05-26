# Mem.ai — Architecture Deep Dive

## What it is
Mem.ai (by Mem Labs, originally OpenAI Startup Fund-backed) is a **consumer-facing AI note-taking app** — not a memory infrastructure layer for agents. It positions as "your AI thought partner": users dump voice notes, meeting transcripts, web clips, and chats, and Mem auto-organizes them and surfaces related context via a feature called **"Heads Up"**. There is **no developer API, no SDK, no MCP server, no self-host** — it is a closed SaaS product. Included here because the *UX patterns* (auto-org, related-context surfacing, chat over personal corpus) are exactly what an end-user-facing OneMem dashboard would feel like.

## Architecture (ASCII)

```
                       (no public technical architecture)

┌──────────────────────────────────────────────────────────────┐
│ INPUTS (consumer capture)                                    │
│  Voice brain-dump  → transcription → note                    │
│  Meeting recorder  → transcript + auto-notes                 │
│  Chrome Extension  → web clip                                │
│  iMessage/SMS-style mobile capture                           │
│  Manual notes                                                │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ Closed AI organization layer                                 │
│   - automatic collection / tagging                           │
│   - "Heads Up" surfaces related notes + timeline             │
│   - chat over your notes (LLM as a layer on top)             │
│   - third-party LLM providers used as context sources        │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ OUTPUTS                                                      │
│  Web app + mobile app                                        │
│  Smart search                                                │
│  AI chat / drafting                                          │
│  Meeting briefs (beta)                                       │
└──────────────────────────────────────────────────────────────┘
```

## Storage model
- Closed SaaS — backend stack not publicly documented.
- Cloud-hosted; no self-host option.
- Connected emails + LLM API keys (BYOK for the LLM layer) on Pro.
- **No encryption claims** surfaced in public marketing (no E2EE, no client-side keys, no zero-knowledge claims).

## API surface
- **None publicly available.** Pro plan mentions "unlimited API keys" but that refers to BYOK for connected LLM providers (OpenAI etc.), not a public Mem API.
- Chrome Extension is the only programmatic surface.

## Memory taxonomy
- **Notes** (atomic capture unit, multimodal).
- **Collections** (auto-organized groupings; user can curate).
- **Templates** (Pro).
- **Heads Up surfaces** — runtime-surfaced related context (no persistent typed memory the way Letta/Memori have).
- No published distinction between short-term / long-term / episodic; entire corpus is one searchable pool.

## Integration model
- **Apps only**: web, macOS desktop, iOS, Chrome Extension.
- Mobile messaging capture (text a number, it becomes a note).
- LLM provider integrations are inbound (Mem uses them); nothing outbound for developers.

## Dashboard / UI
- The **product IS the dashboard**. Note feed, collections sidebar, chat panel, Heads Up surfacing on each note.
- "Meeting briefs" beta — auto-generated pre-meeting context cards.
- This is the most polished consumer surface for "AI memory" — worth studying as UX inspiration even though there's no API to integrate with.

## Pricing (signal)
- Free: 25 notes / 25 chats / 25 PDF pages per month (effectively a trial).
- Mem Pro: **$12/mo** unlimited notes/chats/searches, dark mode, model selection, BYOK, beta features.
- Mem Teams: custom (group billing, SLAs, dedicated CSM).

## What we'd borrow for OneMem
- **"Heads Up" surfacing pattern** — proactively show related anchored memories when the user (or agent) is working on something. Don't make them search. OneMem dashboard should do this for cross-tool memory.
- **Multimodal capture without ceremony** — voice → text → note in one step. OneMem ingest should be similarly low-friction (one MCP tool call = one anchored memory).
- **Meeting briefs as a UX primitive** — the equivalent for agents is the "session brief" (OMEGA also does this). OneMem can serve a verifiable session brief at every agent start.
- **The negative lesson** — Mem.ai has burned $40M+ struggling against Microsoft/Google because it competes on **end-user notes** with no developer surface and no defensible data moat. OneMem should NOT chase the consumer notes lane; we sit underneath agent runtimes where Mem.ai never went.
- **Pricing anchor** — $12/mo for a consumer "AI memory" subscription is the market-clearing price. Developer infra prices (Memori, Honcho, Supermemory) are 1–2 orders of magnitude higher per seat.

## Sources
- https://get.mem.ai/
- https://get.mem.ai/pricing
- https://support.mem.ai/article/43-what-is-the-pricing-for-mem
- https://medium.com/@theo-james/mem-ai-the-40m-second-brain-failure-burning-the-worlds-money-5f3176a34cbd
