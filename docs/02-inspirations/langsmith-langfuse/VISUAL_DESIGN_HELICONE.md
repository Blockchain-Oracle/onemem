# Helicone — Visual Design

Captured 2026-05-23. Source-of-truth screenshots in `./helicone/screenshots/`.

## Primary screenshots

- `helicone/screenshots/01-landing-full.png` — https://helicone.ai landing

NOTE: Helicone landing/marketing site is live. Hosted dashboard requires login.

## Brand colors

- Body bg: `#FFFFFF`
- Body text: default `#09090B` (zinc-950)
- H1 color: `#000000`
- **Primary sky-blue: `#0EA5E9`** (Tailwind sky-500) — Helicone's brand accent
- Secondary sky: `#32ACEB`
- Light blue fill: `rgba(226,241,253,0.4)`
- Dark surface: `#09090B`
- Section bg: `#F8FAFC`, `#F4F4F5`, `#F3F4F6` (zinc/slate steps)

## Typography

- Family: `Inter` (with system fallback)
- H1: 84px — text: "Build Reliable AI Apps"
- Square buttons (`border-radius: 0`)

## Component patterns observed

- Massive Inter H1 (84px)
- Sky-blue accent only — single chromatic
- Tailwind-default-feel (zinc grays, sky-500 blue, Inter)
- Hero with marketing headline + dual CTAs

## Layout signature

- Standard SaaS hero
- White background, big type
- Looks like a Tailwind starter that was tastefully polished

## What this teaches OneMem

- Helicone is the "Tailwind defaults polished" archetype — fastest to ship, hardest to differentiate.
- Inter + sky-blue + zinc grays is the safe default stack. OneMem should beat this by adopting the cream/paper bg from MemWal/Walrus/Langfuse.
- If we're time-constrained on hackathon day, this stack (Inter + Tailwind defaults + one accent) is the fallback that won't embarrass us.
