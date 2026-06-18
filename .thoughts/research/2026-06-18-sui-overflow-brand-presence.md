# Reality Research: Sui Overflow Brand Presence

## Scope

Check whether public Sui Overflow evidence supports investing in OneMem brand, social, motion, demo video, and banner assets before submission.

Product-positioning correction: use `2026-06-18-onemem-product-code-audit.md` as the source of truth for what OneMem is. This note only covers why brand/social assets matter for Sui Overflow.

## Sources Checked

- Sui Overflow 2026 official site: https://overflow.sui.io/
- Sui Overflow 2025 winners announcement: https://blog.sui.io/2025-sui-overflow-hackathon-winners/
- Sui Overflow 2024 winners announcement: https://blog.sui.io/2024-sui-overflow-hackathon-winners/
- Sui Overflow 2025 Devfolio page: https://sui-overflow-2025.devfolio.co/
- Sui Overflow 2025 Holographik case study: https://holographik.co/work/sui-overflow-2025
- Sui Overflow 2025 Awwwards page: https://www.awwwards.com/sites/sui-overflow-2025
- Local OneMem brand assets and tokens:
  - `packages/brand/tokens.css`
  - `packages/brand/README.md`
  - `packages/dashboard/public/favicon.svg`
  - `apps/hosted-dashboard/app/icon.svg`
  - `apps/landing/app/page.tsx`
  - `docs/02-inspirations/BRAND_AND_SURFACES.md`
  - `docs/06-references/SUI_OVERFLOW_2026_HANDBOOK.md`
- User-provided Sui reference:
  - `contract-hero/sui-pilot`: https://github.com/contract-hero/sui-pilot

## Verified Facts

- Sui Overflow 2026 is positioned as Sui's global hackathon, running May-August 2026, with $500K+ in total prizes/rewards and a promise that top teams get opportunities and network support beyond the hackathon.
- The 2026 official site explicitly lists "Get your project in front of leading judges and leaders" and "Create momentum for your project beyond the hackathon" as reasons to participate.
- The 2026 site says the prior two editions drew 5,000+ registrants, 950+ submissions, and distributed over $1M in prizes.
- Sui Overflow 2025 had 599 submissions, 36 track winners, 10 university winners, demo days, judging, and community voting.
- Sui Overflow 2024 had 352 submissions, 32 track winners, Demo Days with 47 judges, a 65-project shortlist, and Community Favorite Awards through online voting.
- Sui Overflow 2025's event identity was professionally designed by Holographik, covering brand, website, and motion/3D work. The case study says a supporting promotional video was created for the event identity.
- The Sui Overflow 2025 site won Awwwards Site of the Day and a Developer Award. The Awwwards page highlights microanimation, hover interactions, loading animation, illustration interaction, art/illustration, web/interactive, animation, colorful graphic design, and illustration as attributes.
- Devfolio listed Sui Overflow 2025 as an online hackathon with project tracks including AI, Infra & Tooling, Payments & Wallets, Entertainment & Culture, and Programmable Storage.
- Sui's public winner pages often link project names to live websites or X pages. Several 2025 winner links go directly to `x.com`, including MFC.CLUB, Objection! AI, Suibotics, SuiSQL, Sui Provenance Suite, SuiSign, WalGraph, SuiMail, Chatiwal, and Archimeters.
- The local OneMem repo has a `packages/brand` package with canonical tokens, but its `logo/`, `fonts/`, and `og-images/` directories are empty.
- OneMem currently has small icon assets only:
  - `packages/dashboard/public/favicon.svg`
  - `apps/hosted-dashboard/app/icon.svg`
- The existing icon is a dark rounded square with a cube-like memory/chain mark using `#171717`, lime `#d4ff5e`, and violet `#8f7cff`.
- The dashboard also has an inline "Vault-Rail lockbox glyph" inside `packages/dashboard/components/AppShell.tsx`, so the repo currently contains more than one brand-mark shape.
- Canonical OneMem tokens define:
  - primary indigo: `oklch(0.52 0.20 268)`
  - verify green: `oklch(0.58 0.15 152)`, reserved for Verify/decrypted affordances
  - chain sea-blue: `oklch(0.60 0.13 232)`, reserved for on-chain explorer links
  - warm paper: `oklch(0.992 0.004 95)`
  - ink: `oklch(0.235 0.013 65)`
  - type: Bricolage Grotesque, Hanken Grotesk, JetBrains Mono
- Existing landing page copy includes verify-first phrases:
  - "Stop trusting your AI agent. Verify it."
  - "Verifiable agent memory + trace, for every runtime."
  - "Etherscan for AI agents."
  - "Every memory encrypted on Walrus, every action a Merkle-chained attestation on Sui."
- The code audit corrects this framing: these phrases should not be treated as the primary product positioning. OneMem should lead with decentralized persistent agent memory; verification/provenance is supporting evidence.
- Abu clarified the public domain is `onememe.xyz`.
- Abu selected the X handle `@OneMemAI`.
- `onemem.ai` is used as the target landing domain in repo docs, but `curl -I https://www.onemem.ai/` currently returns `server: Parking/1.0` and HTTP 405. The apex `https://onemem.ai/` timed out in a 10s curl test.
- The user-provided `sui-pilot` repo is a Claude Code plugin for Sui/Move development. Its README says it bundles Sui, Move Book, TS SDK, Walrus, Sui Prover, and Seal documentation, plus Move LSP and Sui Prover MCP servers. This is useful as an external Sui development reference, not a OneMem runtime dependency.

## Inferences

- Brand and social polish matter because Sui Overflow explicitly includes community voting, public shortlisting, demo days, and post-hackathon visibility. A project that is easy to recognize and share has an advantage in those public surfaces.
- A static product is probably not enough. The event itself sets a motion/interactive expectation through its award-winning 2025 site and promotional video.
- OneMem should keep its current technical identity instead of starting from a blank brand: dark technical base, violet/indigo memory layer, lime as a restrained persistence/provenance moment, and sea-blue chain links.
- OneMem needs a real logo system and social kit. The repo currently has tokens and a small app icon, but not export-ready logo lockups, X/Discord banners, OG images, or animation keyframes.
- The brand package gap is not just cosmetic. `packages/brand/package.json` exports `./logo/*` and `./og-images/*`, so empty directories make the published package promise misleading.
- Repo/docs references to `onemem.ai` should be treated as stale or placeholder until intentionally changed. Public brand assets should point to `onememe.xyz` and `@OneMemAI`.

## Unknowns And Questions

- Whether `onememe.xyz` is already deployed or still needs DNS/hosting setup.
- Whether the final submission platform will require a fixed-length demo video, specific aspect ratio, GitHub link, live demo URL, or pitch deck. The local handbook should be checked again before final production.

## Not Included

- No motion/video asset was generated in this pass.
- No logo or banner image was exported in this pass.
- No social account was created.
