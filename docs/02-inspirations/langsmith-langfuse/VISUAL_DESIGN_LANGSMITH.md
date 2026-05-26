# LangSmith — Visual Design

Captured 2026-05-23. Source-of-truth screenshots in `./langsmith/screenshots/`.

## Primary screenshots

- `langsmith/screenshots/01-docs-observability.png` — https://docs.langchain.com/langsmith/observability (LangSmith observability docs, current LangChain Docs unified site)

NOTE: Hosted app at smith.langchain.com requires auth; only public docs captured.

## Brand colors

- Body bg: white (transparent body, parent white)
- Body text: `#030710` (near-black with cool tint)
- Dark surface: `#161F34` (deep navy)
- Section bg: `#FFFFFF`, `#EEEEEF`
- **Lavender fill: `#EDE9FE`** (LangChain's signature pale purple)
- **Light blue fill: `#E0EDF8`** (secondary accent fill)
- `#EEF2F7` mid-gray section
- Overlay: `rgba(255,255,255,0.9-0.92)` (sticky header frost)
- Error red: `#FF0000` (used somewhere, probably destructive button)

## Typography

- Family: `Inter` (sidebar, body)
- H1: `TWK Lausanne`, 30px (display sans by Lineto — slightly humanist)

## Component patterns observed

- 267px left sidebar
- Lavender + light-blue paired fills for callouts/sections (LangChain's brand DNA)
- Inter throughout most of UI; Lausanne for headlines only
- Frosted sticky header (`rgba(255,255,255,0.9)`)
- Clean white SaaS dashboard chrome

## Layout signature

- 3-column docs (267px sidebar + main + TOC)
- Standard documentation IA — left nav grouped by section, expandable
- Hero per page is compact (30px H1 only)

## UX moments worth borrowing for trace UI

- LangSmith trace viewer (visible in their public marketing screenshots, not captured directly here):
  - Vertical span tree on the left
  - Tabbed detail pane (Input / Output / Metadata / Feedback / Logs)
  - Inline diff view for prompt changes
  - "Run" objects are first-class — every span has a clickable detail page
  - Status pills color-coded by tag (success / error / pending)

## What this teaches OneMem

- LangSmith = the "white SaaS" extreme of the observability space. Functional but indistinct.
- Lavender + light-blue paired fills (`#EDE9FE` + `#E0EDF8`) is LangChain's signature — we should NOT adopt this exact pair to avoid looking derivative.
- TWK Lausanne for headlines is premium but licensed — Geist Display or General Sans are free analogs.
- Tabbed detail pane (Input/Output/Metadata) is established UX — we adopt and add "Anchor / Verification" as a tab.
