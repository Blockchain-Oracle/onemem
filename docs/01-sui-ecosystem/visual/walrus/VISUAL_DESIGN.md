# Walrus — Visual Design

Captured 2026-05-23. Source-of-truth screenshots in `./screenshots/`.

## Primary screenshots

- `screenshots/01-landing-full.png` — https://walrus.xyz full landing

## Brand colors

- Body bg: `#000000` (pure black) — dark mode by default
- Body text: `#FAF8F5` (warm cream, same cream as MemWal light bg — inverse pair)
- Section bg variants: `#1C2228`, `#2B2D31`, `#222222` (graphite/charcoal stepped tones)
- Light section fill: `#FAFAFA`, `#F3F2F2`
- Pale-blue tint overlay: `rgba(161,200,255,0.1)` (subtle "data" tint)
- Frosted: `rgba(255,255,255,0.05)` for overlay panels

## Typography

- Family: `Ratch` (custom)
- H1: 144px, weight 500 — text: "Infra for data that matters"
- H2: 16px (used as small caps / labels)
- Paragraph: 18px
- All on cream `#FAF8F5` color over black

## Component patterns observed

- Massive headline typography (144px) — confident, brand-poster scale
- Pill-shaped outline buttons (`border-radius: 26px`)
- Stepped graphite background tones for section depth (no harsh dividers)
- Cream-on-black is the brand signature
- Small-caps labels (16px H2) above large body text — editorial pattern

## Layout signature

- Black hero, full bleed
- Section transitions via background tone changes, not lines
- Light sections inverted (cream bg, dark text) for product detail callouts

## UX moments worth borrowing

1. **Cream/black inverse pair** — same `#FAF8F5` cream becomes the foreground on dark sections and the background on light sections. Brilliant single-token reuse.
2. **Pill-shaped outline buttons (26px radius)** — softer than mem0 squares, rounder than MemWal's 12px.
3. **144px brand-poster H1** — confident scale that says "infrastructure".
4. **Subtle blue tint overlays** — light blue is the Walrus "data" accent.

## What this teaches OneMem

- The Sui+Walrus visual ecosystem = black/cream + Ratch + small-caps labels. If OneMem wants to read as "Sui-native", borrow the cream/black inverse pair (not the logo).
- Dark-by-default is the on-brand choice for the dashboard; light mode is the marketing site.
- Section bg tone-stepping (`#1C2228` → `#2B2D31` → `#222222`) is more elegant than dividers — a viable system for our trace-detail panels.
- Ratch isn't a free font — substitute General Sans, Söhne, or Geist for budget.
