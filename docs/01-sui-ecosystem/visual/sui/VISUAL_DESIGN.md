# Sui — Visual Design

Captured 2026-05-23. Source-of-truth screenshots in `./screenshots/`.

## Primary screenshots

- `screenshots/01-landing-full.png` — https://sui.io full landing

## Brand colors

- Body bg: `#000000` (black)
- Body text: `#6C7584` (slate gray)
- Headline color: `#FFFFFF`
- Signature Sui blue: `#298DFF` (CTA + accent everywhere)
- Section variants: `#131518`, `#222529`, `#011829`, `#030F1C`, `#000A17` (graphite + deep navy stepped)
- Slate text: `#4B515B`
- Pure light fill: `#F4F5F7`, `#FFFFFF`

## Typography

- Family: `TWK Everett` (custom — premium grotesk)
- H1: 176px, weight 400 — text: "Build full stack" (display poster scale)
- H2: 90px
- Paragraph: 18px
- Square buttons (`border-radius: 0`)

## Component patterns observed

- Massive display headlines (176px) — even bigger than Walrus
- Square corner buttons + sharp dividers (no rounded SaaS softness)
- Deep navy section variants (not just gray) — Sui's blue runs through bg tones
- Hero takes the entire viewport with single headline + brand color CTA

## Layout signature

- Full-bleed dark hero
- Section background tone shifts ~5 distinct stepped values, navy-tinted
- Container widths feel uncapped — text scales with viewport

## UX moments worth borrowing

1. **Sui blue `#298DFF` as the only chromatic moment** in an otherwise black/gray page — single-accent discipline.
2. **Display-scale typography (176px)** — extreme but lands because it's the only chromatic element competing.
3. **Navy-tinted dark sections** (vs neutral graphite) — subtle ecosystem signal.
4. **Square buttons** — matches mem0; the "infra grade" pattern.

## What this teaches OneMem

- Sui's brand signal in code = Sui blue `#298DFF` + black + TWK Everett. Using a complementary blue (e.g. our trace UI accent) ties us in without copying.
- Navy-tinted dark mode (vs pure neutral) is the ecosystem-correct dark mode for a Sui app.
- OneMem can pick *one* chromatic accent for the trace viewer (status/state color) and let the rest stay monochrome — this is the recurring pattern across mem0, Walrus, Sui, and Pieces.
- TWK Everett is licensed; substitutes: Söhne, Inter Display, Geist.
