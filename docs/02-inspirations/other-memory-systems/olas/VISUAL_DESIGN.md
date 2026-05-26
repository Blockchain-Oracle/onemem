# Olas (Autonolas) — Visual Design

Captured 2026-05-23 from https://olas.network. Source-of-truth screenshot in `./screenshots/`. Computed-style data via Playwright `getComputedStyle()`.

## Primary screenshots

- `screenshots/01-landing-full.png` — https://olas.network full landing (page title: "Olas | Co-own AI")

## Brand colors

| Token | Hex | Role |
|---|---|---|
| `bg.page` | `#FFFFFF` | Primary body bg |
| `bg.alt` | `#F8FAFC` / `#F1F5F9` (slate-50/100) | Secondary section bgs |
| `bg.purple-soft` | `rgba(126,34,206,0.05)` | Tinted purple panels (signature) |
| `text.fg` | `#0F172A` / `#1E293B` (slate-900/800) | Body text |
| `text.muted` | `#475569` / `#64748B` / `#6B7280` (slate-600/500 + gray-500) | Secondary text |
| `accent.purple-700` | `#7E22CE` | Primary brand purple (deeper) |
| `accent.purple-600` | `#9333EA` | Hover/CTA purple |
| `accent.purple-50` | `#FAF5FF` | Light purple wash |
| `text.on-purple` | `#FAF5FF` | Text on purple surfaces |

The brand commits to a **single chromatic accent — violet** — used at three tints (`#7E22CE` deep, `#9333EA` standard, `#FAF5FF` wash). Body type is Tailwind slate (`#0F172A`, `#475569`, `#64748B`). The palette is essentially "Tailwind defaults + Tailwind purple-700".

## Typography

- Family: `Inter` (single typeface, throughout)
- H1: 60px, weight 800 — text: "Co-own AI"
- H2: 40px, weight 700 — examples: "Pearl: The 'Agent App-Store'", "Mech Marketplace: The AI Agent Bazaar", "OLAS: Powers AI Agent Economies"
- Body: 16px
- Single-font system (Inter for everything)
- Tailwind default font-stack with system fallbacks

## Component patterns observed

- **Tailwind-default look** — Inter + slate text + 6px / 8px button corners. This reads as "Vercel/Next.js starter template" — clean but undifferentiated.
- Single purple accent (`#7E22CE` / `#9333EA`) used as primary chromatic moment
- Light tinted-purple panels (`rgba(126,34,206,0.05)`) for "Olas-the-system" callouts
- White cards on slate-50 sections (alternating banding)
- Network/mechanism diagrams as primary visual interest (their product is autonomous-agent services; the marketing IS diagrams)
- "Ethereum" chip pattern — a small white pill with chain logo (likely repeats for Polygon/Base/Gnosis)

## Layout signature

- 4-section reel: hero → Pearl product → Mech Marketplace → OLAS network
- Each section: H2 + paragraph + product diagram/screenshot + CTA
- Multi-chain chip strip showing supported networks
- Footer-heavy with documentation tree

## What this teaches OneMem

- **Confirms purple/violet lineage in agent infrastructure**: Olas `#7E22CE`, Zep `#4226AA`/`#421FCB`, mem0 `#CBB2FF`, MemWal `#CAB1FF`, LangSmith `#EDE9FE`. That's 5 of the most relevant memory/agent products in the same chromatic family. **OneMem's lavender choice is on-pattern, not derivative — it's the genre.**
- Olas uses the *deeper* end of purple (`#7E22CE`) vs mem0/MemWal's *lighter* lavender (`#CAB1FF`). This is the differentiating axis within the purple family — we can pick a third position (mid-tone `#B08FFF`) and own the gap.
- Pure-Inter + Tailwind-defaults is a common shortcut but also makes Olas look like a generic dApp — it's visually less differentiated than mem0 or MemWal. **Lesson for OneMem: do NOT default to pure Inter + Tailwind purple-600 + rounded-6 — that's the "everyone uses it" trap.**
- Olas leans hard on **mechanism-design diagrams** as their key visual — every section has one. If OneMem's killshot is the trace viewer + Merkle chain, those diagrams need to be the equivalent visual signature.

## What we'd borrow

- Multi-tint purple system (3 tints: deep, standard, light-wash) — the BRAND_AND_SURFACES tokens already specify this
- Network/architecture diagrams as primary marketing visual (we should commission a real diagram of the OneMem trace flow, not a generic React tree screenshot)
- Multi-chain chip strip pattern — could be repurposed as our "Supported runtimes" strip (Claude Code, Hermes, Vercel AI, OpenAI, LiveKit chips)

## What we'd avoid

- Pure-Inter + pure-Tailwind-defaults look — too generic, blends with hundreds of dApp landing pages
- 6px button corners (Tailwind default rounded-md) — pick square (0px) or pill (full), don't default
- White-SaaS bg — choose cream `#FAF8F5` or tinted to differentiate (per BRAND_AND_SURFACES recommendation)
- The exact purple `#7E22CE` — Olas owns the deep end; OneMem uses mid-tone `#B08FFF`

## Notes

Olas's mechanism-design and tokenomics diagrams (visible on inner pages like `/whitepaper` and `/docs`) are some of the cleanest in agent-infra space — worth a follow-up pass specifically for diagram conventions when we design OneMem's `MemoryNamespace` capability-flow visuals.
