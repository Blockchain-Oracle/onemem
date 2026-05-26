# OneMem Dependency Graph

How the 12 pillars depend on each other. Read this to know what blocks what during the build.

---

## ASCII dependency diagram

```
                              ┌──────────────────────────────────┐
                              │   External Mysten primitives     │
                              │   (mainnet-live, no work for us) │
                              ├──────────────────────────────────┤
                              │ Sui Move + PTBs                  │
                              │ @mysten/sui                      │
                              │ @mysten-incubation/memwal (TS+Py)│
                              │ @mysten-incubation/oc-memwal     │
                              │ @mysten/walrus                   │
                              │ @mysten/seal                     │
                              │ @mysten/dapp-kit-react           │
                              │ @mysten/enoki                    │
                              │ MystenLabs/onlyfins-example-app  │
                              └──────────────────────────────────┘
                                              │
                                              ▼
                              ┌──────────────────────────────────┐
                              │ Pillar 1 — Move Protocol         │
                              │ MemoryNamespace + TraceSession   │
                              │ + ActionCall + capability share  │
                              │ + event::emit_authenticated      │
                              └──────────────────────────────────┘
                                              │
                                              │ blocks everything below
                                              ▼
                              ┌──────────────────────────────────┐
                              │ Pillar 2 — Core SDKs (TS + Py)   │
                              │ @onemem/sdk-ts + onemem-sdk-py   │
                              │ — namespace ops, trace emit,     │
                              │   memory API, Seal /manual flow  │
                              └──────────────────────────────────┘
                                              │
              ┌───────────────────┬───────────┴────────┬──────────────────────┐
              │                   │                    │                      │
              ▼                   ▼                    ▼                      ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Pillar 6 — MCP   │ │ Pillar 3 — Per-  │ │ Pillar 4 — Per-  │ │ Pillar 5 — CLI   │
│ server           │ │ runtime plugins  │ │ framework        │ │ (Node + Python)  │
│ @onemem/mcp      │ │ • Claude Code    │ │ providers (v0.1) │ │ login/init/etc   │
│ (serves Cursor,  │ │ • OpenClaw       │ │ • Vercel AI      │ └──────────────────┘
│ Codex, Cline,    │ │ • Hermes (PyPI)  │ │ • OpenAI Agents  │           │
│ Antigravity etc) │ │ • Codex via MCP  │ │ • CrewAI         │           │
└──────────────────┘ └──────────────────┘ │ • LiveKit (voice)│           │
              │                   │       │ • ElevenLabs     │           │
              │                   │       └──────────────────┘           │
              │                   │                    │                  │
              └───────────────────┴───────────┬────────┘                  │
                                              │                           │
                                              ▼                           │
                              ┌──────────────────────────────────┐        │
                              │ Pillar 7 — Local Dashboard       │◄───────┘
                              │ Next.js + Tailwind + shadcn      │ launched by CLI
                              │ + Radix Themes + dapp-kit        │
                              │ localhost:4040 + SSE             │
                              │ 7 routes (/, memories, apps,     │
                              │ trace, sessions, share, settings)│
                              └──────────────────────────────────┘
                                              │
                                              │ same codebase
                                              ▼
                              ┌──────────────────────────────────┐
                              │ Pillar 8 — Hosted Dashboard      │
                              │ app.onemem.ai + Enoki/zkLogin    │
                              │ + sponsored-tx                   │
                              │ + Walrus Sites mirror            │
                              └──────────────────────────────────┘

                  ┌───────────────────────────────────────────────────────────┐
                  │ Pillar 9 — Marketing (onemem.ai)                          │
                  │ Pillar 10 — Docs (docs.onemem.ai Mintlify)                │
                  │   — Document + market every other pillar                  │
                  └───────────────────────────────────────────────────────────┘

                  ┌───────────────────────────────────────────────────────────┐
                  │ Pillar 11 — Demos / e2e tests                             │
                  │   — Exercise every other pillar end-to-end                │
                  │   1. Switch-laptops  2. Agent-sends-money                 │
                  │   3. Verifiable-research-agent  4. Multi-agent coord      │
                  └───────────────────────────────────────────────────────────┘

                  ┌───────────────────────────────────────────────────────────┐
                  │ Pillar 12 — Nautilus TEE relayer (stretch, Day 23+)       │
                  │   — Builds on Pillar 1 (TEE-attested writes)              │
                  └───────────────────────────────────────────────────────────┘
```

---

## Critical-path dependencies

These MUST land in order. Each later step is blocked until the earlier one ships:

1. **External Mysten primitives** (already live; nothing to do) → unlocks Pillar 1
2. **Pillar 1 (Move protocol)** → unlocks Pillar 2 (SDKs reference the contract IDs)
3. **Pillar 2 (Core SDKs)** → unlocks Pillars 3, 4, 5, 6 (all consume the SDK)
4. **Pillar 2 (Core SDKs)** → unlocks Pillar 7 (dashboard reads via SDK)
5. **Pillar 7 (Local Dashboard)** → unlocks Pillar 8 (same codebase, just different deploy)
6. **All pillars 1-8** → enable Pillar 11 (demos exercise the full stack)
7. **Pillars 9 + 10 (marketing + docs)** can be designed in parallel with anything after Pillar 2

## Parallelizable groups

After Pillar 2 (SDKs) lands, these groups can run in parallel:

**Group A — Runtimes + Plugins (Pillars 3 + 6):**
- Claude Code native plugin
- OpenClaw native plugin
- Hermes Agent PyPI standalone
- MCP server (`@onemem/mcp`)

**Group B — Framework providers (Pillar 4):**
- Vercel AI SDK middleware
- OpenAI Agents SDK function tools
- CrewAI provider
- LiveKit voice subclass
- ElevenLabs voice subclass

**Group C — CLI (Pillar 5):**
- Node implementation (`@onemem/cli`)
- Python implementation (`onemem-cli`)

**Group D — Dashboard (Pillar 7):**
- Per-route design (`/`, `/memories`, `/apps`, `/trace`, `/sessions`, `/share`, `/settings`)
- Data flow / SSE
- Design system token application

**Group E — Marketing + Docs (Pillars 9 + 10):**
- Landing page
- Mintlify docs site

All five groups can be designed and implemented concurrently after Pillar 2 ships.

---

## What blocks what (lookup table)

| If you want to build... | You first need... |
|---|---|
| Pillar 1 (Move) | External Mysten primitives (already done) |
| Pillar 2 (SDKs) | Pillar 1 published to mainnet (need contract IDs) |
| Pillar 3 (Runtimes) | Pillar 2 published to npm + PyPI |
| Pillar 4 (Frameworks) | Pillar 2 published to npm + PyPI |
| Pillar 5 (CLI) | Pillar 2 published to npm + PyPI |
| Pillar 6 (MCP server) | Pillar 2 published to npm |
| Pillar 7 (Local Dashboard) | Pillar 2 published to npm |
| Pillar 8 (Hosted Dashboard) | Pillar 7 done |
| Pillar 9 (Landing) | Brand tokens (already in `BRAND_AND_SURFACES.md`); cross-references to integrations (Pillars 3+4) |
| Pillar 10 (Docs) | Pillars 2-7 have shipped (so we can document them) |
| Pillar 11 (Demos) | All of Pillars 1-8 |
| Pillar 12 (Nautilus stretch) | Pillar 1 + Mysten's Nautilus template (whichever ships first) |

---

## Inversion: what each pillar EMITS (so downstream knows what it depends on)

| Pillar | Emits (consumed by other pillars) |
|---|---|
| 1 Move | Package IDs, type definitions, event schemas, capability types — referenced by Pillars 2-12 |
| 2 SDKs | TS + Py SDK clients with public API methods + types — referenced by Pillars 3-7 |
| 3 Runtimes | Per-runtime plugin packages (npm + PyPI) — referenced in docs (Pillar 10) and demos (Pillar 11) |
| 4 Frameworks | Provider packages — referenced in docs + demos |
| 5 CLI | `onemem` binary — referenced in docs (install instructions) + Pillar 7 (CLI launches dashboard) |
| 6 MCP | `@onemem/mcp` stdio binary — referenced in docs + per-runtime install instructions |
| 7 Local Dashboard | Web app served on `localhost:4040`, REST API + SSE — same code reused by Pillar 8 |
| 8 Hosted Dashboard | Deployed at `app.onemem.ai` — referenced in docs + landing |
| 9 Landing | The marketing surface — referenced in pitch deck + GitHub READMEs |
| 10 Docs | The doc surface — referenced from every package README |
| 11 Demos | Demo videos + demo apps — referenced in pitch deck + landing |
| 12 Nautilus | (Stretch) — referenced in pitch as additional differentiator |
