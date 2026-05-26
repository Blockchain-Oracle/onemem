# Zep — Visual Design

Captured 2026-05-23. Source-of-truth screenshots in `./screenshots/`.

## Primary screenshots

- `screenshots/01-landing-full.png` — https://www.getzep.com full landing

## Brand colors

- Body bg: `#FFFFFF` (white)
- Body text: `#000000`
- Subdued paragraph: `oklch(0.373 0.034 259.733)` (cool slate)
- Primary purple: `#4226AA` (deep)
- Brand purple alt: `#421FCB` (more vivid)
- Lavender bg fill: `#F5F3FF`
- Cream fill: `#F5F3F0`
- Warm gray text: `oklch(0.21 0.034 264.665)` near `#13182A`
- Status: red `oklch(0.637 0.237 25.331)` ~ `#DA3633`, amber `oklch(0.795 0.184 86.047)` ~ `#D4A017`

## Typography

- Family: `neueMontreal` (custom — popular grotesk by Pangram Pangram)
- H2: 48px (Zep uses H2 as hero — no H1 on the page)
- Body: 24px
- Code: system monospace stack (`ui-monospace, SFMono-Regular, Menlo, Monaco`) with bg `#282C34`, color `#ABB2BF` (One Dark colorway)

## Component patterns observed

- Deep purple primary (`#4226AA`) + lavender fill (`#F5F3FF`) — two-tone purple
- Rounded buttons (`border-radius: 8px`) — mid-range
- One Dark color scheme for code blocks (`#282C34` bg, `#ABB2BF` text) — recognizable
- Cream fill `#F5F3F0` for secondary panels (similar warm-paper feel to MemWal)
- Status colors present (red, amber) — suggests they have built-in alerting/state UI

## Layout signature

- Light hero with purple accent
- Code blocks in One Dark — strong "developer" signal
- Mix of cream and lavender background tints

## UX moments worth borrowing

1. **Purple + lavender two-tone** — single hue, two intensities, fills + accents
2. **One Dark code blocks** — instant recognition for developers
3. **Status colors baked into the brand palette** — implies the product surfaces state changes prominently (relevant to OneMem trace status)
4. **24px body** — large, readable, editorial pace

## What this teaches OneMem

- Purple lineage runs through Zep + mem0 (accent) + Walrus (CAB1FF) + Sui ecosystem. OneMem's purple is on-brand.
- One Dark for code is a safe, recognizable choice for our JSON/span rendering.
- Status palette (red `#DA3633` + amber `#D4A017`) is a known pairing — we can adopt directly for trace status (error / warning / pending).
