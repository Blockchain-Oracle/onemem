# mem0.ai — Visual Design

Captured 2026-05-23. Source-of-truth screenshots in `./screenshots/`.

## Primary screenshots

- `screenshots/01-landing-full.png` — https://mem0.ai full landing
- `screenshots/02-docs-full.png` — https://docs.mem0.ai introduction page

## Brand colors (extracted via getComputedStyle)

**Landing**
- Body bg: `#FFFFFF` (white)
- Body text: `#121212` (near-black)
- Primary CTA: `#0066FF` (electric blue, square corners `border-radius: 0`)
- Dark surface: `#121212`
- Lavender accent block: `#CBB2FF` (used as a callout panel)
- Mid-tier white overlay: `rgba(255,255,255,0.7)`

**Docs**
- Body bg: transparent (white parent)
- Sidebar / chrome: white, no fill
- H1 color: `#111827` (slate-900)

## Typography

**Landing — custom display family**
- H1: `Fustat SemiBold`, 96px, weight 600, color `#121212` — text: "Give your AI a memory"
- H2: `Fustat Bold`, 64px, weight 700, color `#FCFCFC` (light on dark sections)
- Body / paragraphs: `DM Mono`, 14px monospace — paragraphs in mono is the signature move
- Default body fallback: `sans-serif`, 12px

**Docs — Mintlify default**
- Family: `Inter` (with system fallback stack)
- H1: 36px

## Component patterns observed

- Square-corner CTA buttons (`border-radius: 0`) — uncommon, very confident
- Mono paragraphs on landing — code-feel even outside code blocks
- Lavender callout panel mid-page for a "feature highlight" surface
- Hard light/dark section alternation (white → near-black → white)
- Docs uses Mintlify (standard left-sidebar + table-of-contents-right layout, Inter throughout)

## Layout signature

- Landing: full-bleed sections, no max-width container visible on hero
- Hero H1 sized to fill viewport width (96px)
- Docs: standard 3-column Mintlify (left nav, article center, right TOC)

## UX moments worth borrowing

1. **Mono body copy on a marketing page** — instant "developer tool" credibility without resorting to terminal screenshots.
2. **Square-corner buttons** — feels engineering-honest vs the default rounded-12 SaaS look.
3. **Lavender feature block** — single chromatic moment in an otherwise monochrome page; reads as a "memory" signifier.
4. **Hard contrast section flips** — dark hero / light feature / dark CTA rhythm keeps long pages legible.
5. **Mintlify for docs** — zero design tax, ships fast, looks correct.

## What this teaches OneMem

- A marketing site can lean *fully* monochrome + one chromatic accent block — we don't need a multi-hue palette.
- Mono paragraphs on the marketing page signal "this is for engineers" louder than any tagline.
- Mintlify-style docs are table-stakes; don't reinvent.
- Square corners on CTAs read more "infra" than rounded.
