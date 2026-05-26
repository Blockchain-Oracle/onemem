# MemWal — Visual Design

Captured 2026-05-23. Source-of-truth screenshots in `./screenshots/`.

## Primary screenshots

- `screenshots/01-landing-full.png` — https://memwal.ai landing (public, not authenticated dashboard)

## Brand colors

- Body bg: `#FAF8F5` (warm cream / paper) — identical to Walrus light-mode accent
- Body text: `#000000`
- Subdued paragraph color: `#2D2D3A` (near-black, slight blue)
- Lavender accent: `#CAB1FF` — surface color for hero illustration / decorative panels
- Button: white fill (`#FFFFFF`), black text, `border-radius: 12px`

## Typography

- Family: `Ratch` (custom face — same family as Walrus brand site)
- H1: 85px, weight 600 — text: "Long-Term Memory for AI Agents"
- Paragraph: 17px, color `#2D2D3A`
- No serif anywhere — Ratch is a geometric sans, slightly humanist

## Component patterns observed

- Cream-paper background as the dominant surface (warm, non-tech, "archive" feel)
- Lavender used sparingly as a single decorative tone
- Rounded-12 buttons (softer than mem0's square)
- All-caps spacing on nav links (typical Ratch usage)

## Layout signature

- Hero with extremely large H1 (85px), short body copy, single CTA
- Cream bg threads through every section — no dark mode flip
- Decorative lavender shapes only

## UX moments worth borrowing

1. **Cream-on-cream surfaces** — distinctive against the all-white SaaS norm; reads as "documents" / "memory" rather than "dashboard".
2. **Single-accent palette** — only lavender appears as color. Restraint = confidence.
3. **Ratch + warm bg combo** — feels editorial, almost print-design, which is unusual for AI infra.

## What this teaches OneMem

- The Walrus/MemWal palette (`#FAF8F5` cream + `#CAB1FF` lavender + black) is a coherent ecosystem visual language — OneMem can borrow this without copying logos, signaling "Sui + Walrus native" via color alone.
- Ratch is custom-licensed; we should pick a free analogue (e.g. Geist, Söhne fallback, or General Sans).
- Cream bg differentiates from the LangSmith / Phoenix / Helicone "white SaaS" sea.
