# Langfuse — Visual Design

Captured 2026-05-23. Source-of-truth screenshots in `./langfuse/screenshots/`.

## Primary screenshots

- `langfuse/screenshots/03-landing.png` — https://langfuse.com landing
- `langfuse/screenshots/02-docs-observability.png` — https://langfuse.com/docs/observability/overview
- `langfuse/screenshots/01-docs-traces-full.png` — initial /tracing-features/traces URL (now 404 — kept as reference of the 404 page chrome)

NOTE: The hosted trace demo at cloud.langfuse.com requires auth; not captured. Docs pages contain embedded screenshots of the trace UI worth studying directly inside `02-docs-observability.png`.

## Brand colors

- Body bg: `#EDEDE8` (warm sand / paper — VERY distinctive in this corpus)
- Body text: `#020817` (near-black with blue tint)
- Sidebar bg: `#CFCFC9` (deeper sand)
- Main content panel bg: `#F6F6F3` (lighter sand)
- Headline color: `#222220`
- Link / CTA color: `#1863DC` (link blue, no fill)
- Dark accent: `#000000` (used in CTAs / dark blocks)
- Section bg: `#E5E5E1`, white `#FFFFFF`, `#F4F4F4`

## Typography

- Family: `Inter` (body, sidebar, main)
- Display headlines: `f37 Analog` — a serif (very unusual for a dev tool!) — H1: 68px, weight 500
- Docs h1: `f37 Analog` at 24px

## Component patterns observed

- **Sand/paper palette throughout** — `#EDEDE8` body, `#CFCFC9` sidebar, `#F6F6F3` content. Three-step warm neutrals, no white.
- **240px sidebar** (narrow, paper-toned)
- **Serif display + Inter body** — editorial feel, very rare in observability tools
- **No rounded buttons on hero** (`border-radius: 2px` ≈ flat)
- Link-style CTAs (text-only, blue, no fill)

## Layout signature

- 3-column docs (240px nav + ~1199px main + right TOC)
- Hero: large multi-line H1, no big chrome
- Paper bg threads through every surface

## UX moments worth borrowing for OneMem trace UI

- Trace UI screenshots embedded in their docs show:
  - Left tree of spans (collapsible)
  - Right pane: span detail (timing, input, output, metadata tabs)
  - Top: trace meta bar with timing / token counts / score chips
  - Color-coded span types (LLM / embedding / retrieval / function)
- The paper bg makes the trace UI feel "log book" rather than "monitoring dashboard"

## What this teaches OneMem

- **Paper/sand palette `#EDEDE8`** is the most differentiated background choice in this corpus. It pairs perfectly with the cream `#FAF8F5` (MemWal/Walrus) lineage — they're sibling tones.
- **Serif headlines on a dev tool** are unusual and effective for Langfuse — but probably wrong for us (we want "infra" signal more than "editorial").
- **Three-step warm neutrals** (`#EDEDE8` → `#CFCFC9` → `#F6F6F3`) is a viable system for our dashboard surfaces (page bg, sidebar, panel).
- **Color-coded span chips** is the established convention; we should adopt + extend with anchor/verification status.
