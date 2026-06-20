## Scope

Adversarial re-verification of the HANDBOOK BRIEF against live primary sources, fetched fresh on 2026-06-19. Focus: (1) does the Notion connector work, (2) are the Walrus track sanctioned-tools list + exact resource link hrefs quoted accurately, (3) are the Walrus track requirements/framing quoted accurately, (4) spot-check prizes, judging, mainnet rules, eligibility, and the flagged team-size contradiction. Verdict per claim: CONFIRMED / REFUTED / PARTIAL, with source URL.

## Sources Checked

- **Notion connector `notion-fetch`** — `https://mystenlabs.notion.site/walrus-track-problem-statement` and `.../overflow-2026-handbook`. Both returned **HTTP 500** `internal_server_error` "Cross-cell memcached access is not allowed" (request_ids `c8fa710d-...`, `b760b05f-...`). Connector is non-functional for the public Mysten site.
- **Notion connector `notion-search`** — queries for "Walrus Track ... MemWal" and "Sui Overflow 2026 Walrus track $35,000" returned ONLY Abu's own personal workspace pages (e.g. "Agent Demo", "Databases Demo", a personal memory-system page). It does NOT index the public Mysten site. Both connector limitations in the brief are CONFIRMED.
- **Live Walrus Track Problem Statement** — `https://mystenlabs.notion.site/walrus-track-problem-statement` via Playwright (full innerText + all 18 `<a>` hrefs extracted after SPA render).
- **Live Handbook root** — `https://mystenlabs.notion.site/overflow-2026-handbook` via Playwright; all 22 toggle blocks auto-expanded ("Close" state confirmed); full innerText + 60 link hrefs extracted.
- **NOT re-fetched live this session:** Detailed Submission Guide page and its FAQ toggles (the brief's submission-guide-specific quotes — "we require your repository to be public", "You may only choose ONE track per project" — were NOT re-verified today); the three other track problem statements; Code of Conduct.

## Verified Facts (verdicts on brief's key claims)

### Notion connector status
- **CONFIRMED** — `notion-fetch` HTTP 500 "Cross-cell memcached access is not allowed" persists; `notion-search` indexes only Abu's workspace, not the public site. Brief's tooling note is accurate. Live content below obtained via Playwright (brief's stated fallback).

### Walrus Track — sanctioned/recommended tools + EXACT hrefs (source: live Walrus page)
Every link href in the brief's Walrus-track list is **CONFIRMED verbatim**:
- `https://docs.wal.app/` ; getting-started ; `/docs/walrus-client` (CLI) ; `/docs/http-api/storing-blobs` ; `https://sdk.mystenlabs.com/walrus` ; `/docs/system-overview/public-aggregators-and-publishers` — CONFIRMED.
- Walrus Sites `/docs/sites` ; site-builder install ; publish-a-site — CONFIRMED.
- MemWal docs `https://docs.memwal.ai/` — CONFIRMED.
- **MemWal Playground link text = "create an account and a delegate key for your agent", href = `https://docs.memwal.ai/`** — CONFIRMED. The brief's key claim that the Playground link target resolves to the docs URL (not a distinct playground URL) is exactly right.
- MemWal GitHub `https://github.com/MystenLabs/MemWal` — CONFIRMED.
- Seal docs `https://seal-docs.wal.app/` ("privacy layer for Walrus and MemWal") — CONFIRMED.
- Sui Stack Messaging `https://github.com/MystenLabs/sui-stack-messaging` — CONFIRMED.
- Walrus Telegram `https://go.sui.io/ofw-walrus-tg` ; Discord `https://discord.com/invite/walrusprotocol` — CONFIRMED.
- **"persistent, verifiable memory for agents" hyperlink → `https://memwal.ai/`** (distinct from docs domain) — CONFIRMED.

### Walrus Track — framing/requirements quotes (source: live Walrus page)
- **CONFIRMED verbatim:** opening "AI agents today are powerful, but still fundamentally stateless and fragmented..." through "...difficult to trust."; "This track challenges you to rethink how agentic systems are built by using Walrus as a Verifiable Data Platform for AI."
- **CONFIRMED verbatim:** the three "What you'll build" bullets; the three "especially interested in" bullets (research/trading/monitoring; multi-agent coordination; artifact-driven workflows); the four integrations/tooling angles; the three "Your project could be" options.
- **CONFIRMED verbatim:** "What we're looking for" block ("We're not just looking for demos...") and the closing "The goal is to push toward a future where AI agents are not just reactive tools, but persistent, collaborative systems powered by a reliable data layer."

### Prizes / tracks (source: live handbook root)
- **CONFIRMED:** Agentic Web & DeFi & Payments = $30,000 / $15,000 / $10,000 / $7,500. Walrus & DeepBook = $35,000 / $15,000 / $7,500 / $5,000, each with the "$7,500 in additional funds ... honorable mentions or ... special awards" NB. University Award = "10 winners of $2,500 USD ... at least 50% student participation". Post-Hackathon "$250,000+ in additional value".

### Award structure / mainnet (source: live handbook root)
- **CONFIRMED verbatim:** "50% of the prize will be awarded upon announcement of winners"; "50% ... after successful mainnet deployment"; "If a winning team has already deployed their project to mainnet by the time winners are announced in August, they will receive 100% of the prize upfront." Plus FAQ restatement (50% after results, remainder after Sui Mainnet deploy + post-award requirements). Mainnet "minimum functional requirements as defined by the Sui team and/or track sponsors" — CONFIRMED.

### Timeline & Demo Day (source: live handbook root)
- **CONFIRMED:** May 7 launch; May 7–June 21 build; **June 21, 6:00 PM Pacific** deadline; July 8 shortlist; July 20–21 Demo Day; Aug 27 winners. Demo Day schedule **July 20 = Agentic Web + Walrus; July 21 = DeFi & Payments + DeepBook** — CONFIRMED.
- **NUANCE (minor):** Live page says "**Zoom meeting links** will be shared directly via email." The brief's Demo Day section did not mention the Zoom/email logistics; not a contradiction, just an omission. Live also confirms YouTube livestream, 5 min + up to 2 min Q&A, strictly enforced, second-no-show forfeiture.

### Judging weights (source: live handbook root)
- **CONFIRMED verbatim:** Real-World Application 50%; Product & UX 20%; Technical Implementation 20%; Presentation & Vision 10%. (Live page orders them Product&UX, then Real-World; weights identical to brief.)

### Submission checklist (source: live handbook root)
- **CONFIRMED verbatim:** all 8 rows match (Project Name, Description, Logo 1:1 JPG/PNG, Public GitHub Repo, Demo Video YouTube ≤5 min, Website optional, Deployment testnet/mainnet, Package ID if on-chain).

### Eligibility & FAQ (source: live handbook root, all toggles expanded)
- **CONFIRMED verbatim:** the 5 eligibility bullets; multiple-tracks ("each submission may only be submitted under one primary track"); subtracks-are-guides; Core-Track checkbox (Agentic Web/DeFi only, none for Walrus/DeepBook); solo builder allowed; multiple teams allowed if meaningfully different; code reuse with disclosure; AI tools "allowed and expected"; KYC only if you win; updating-after-submission not judged.
- **Open-source FAQ:** handbook version CONFIRMED ("Projects should be accessible for review during judging... we recommend making it accessible during the shortlisting and judging period"). The brief's stronger submission-guide quote ("During judging period, we require your repository to be public") was NOT re-verified live today (submission guide not re-fetched) — see Unknowns.

### Team-size contradiction (the brief's flagged material item)
- **CONFIRMED — the contradiction is real and live.** Live FAQ contains BOTH, verbatim, on the same page:
  - "Can I join Sui Overflow as a solo builder? **Yes! Solo builders are absolutely welcome... You can register, build, and submit a project on your own without needing to be part of a team.**"
  - "What is the minimum team size? **Teams must have at least 2 members.** There is no requirement to have more than the minimum as long as all team members are properly listed in the submission."
- The brief's characterization is accurate. This remains an unresolved internal contradiction on the live page; needs an organizer ruling. (Note the live text adds the sentence about listing members, which the brief abridged.)

### Resource Hub extras (source: live handbook root)
- **CONFIRMED:** MemWal workshop video `https://youtu.be/GncjVUEJw9Y?si=tzWeNi_3gAIkVT6f` + walkthrough doc `https://mystenlabs.notion.site/p/3666d9dcb4e9801dadb0e67ad368235e`; all Getting Started links (Founder Starter Pack, Sui docs, TS SDK, awesome-sui, sui-move-bootcamp, sui-pilot `https://github.com/contract-hero/sui-pilot`); DeepBook links; sponsors (Walrus headline, DeepBook, OpenZeppelin, OtterSec, Scallop) with the quoted descriptions; office-hours hosts incl. **Abner (Walrus) `https://calendar.app.google/bUkFydDYhHb2rQxAA`** "Idea validation and project discussions relating to Walrus".

### Items the brief left as Unknown — now RESOLVED from live page
- **OpenZeppelin Move Libraries link target** (brief: "not separately captured") — now captured: `https://mystenlabs.notion.site/OpenZeppelin-s-audited-Move-Libraries-and-Tools-36d6d9dcb4e980539272ded72c2856f6` (a Notion child page, not the OZ external site).
- **APAC/EMEA office-hours booking links** (brief unspecified): APAC `https://calendar.app.google/LZ35Pam7msxXCZnv6`; EMEA `https://calendar.app.google/P6XLaYdMNRuZMYu59`.
- **OFAC link**: `https://ofac.treasury.gov/sanctions-programs-and-country-information`.

## Inferences

- The brief's two MemWal-domain inferences are now **upgraded to verified fact**: `memwal.ai` is the marketing/landing href and `docs.memwal.ai` is the docs/Playground entry point — both hrefs confirmed verbatim from the live Walrus page. The actual Playground UI URL is still not exposed in the handbook (it lives behind `docs.memwal.ai`).

## Unknowns And Questions

- **Team-size vs solo-builder contradiction is live and unresolved** — REFUTES any clean reading; needs organizer confirmation (Telegram). Do not rely on either "solo OK" or "min 2" as settled.
- **DeepBook Predict docs link drift (brief's flagged item) — REFUTED as a drift concern.** The live Resource Hub shows only "Deepbook v3" (`https://docs.sui.io/onchain-finance/deepbookv3/deepbook`) and "Deepbook margin" (`https://docs.sui.io/onchain-finance/deepbook-margin`); there is NO `docs.sui.io/onchain-finance/deepbook-predict/` link in the live Resource Hub. The brief correctly suspected this; confirmed it is absent live.
- **Submission-guide–specific quotes not re-verified today** — "we require your repository to be public" and "You may only choose ONE track per project. However, if you have a different project, you may submit a different project under a different or same track." live on the separate Submission Guide page (`https://mystenlabs.notion.site/overflow2026-submission-guide`), which I did not re-fetch this session. Cannot confirm or refute today.
- **Notion connector unusable for the public Mysten site** — all future verification of these pages must go through Playwright, not the Notion connector.
- The three other track problem statements + Code of Conduct were not opened live (consistent with brief).

**Net verdict:** No REFUTED claims in the brief's core Walrus-track sanctioned-tools list or track requirements — every sanctioned tool, every href, and every framing quote is CONFIRMED verbatim against the live page. The only correction is the DeepBook Predict docs link (correctly flagged by the brief as absent). The team-size contradiction is confirmed real and remains the one material open question.