## Scope

What the official Sui Overflow 2026 handbook (live Notion site) and its linked child pages authoritatively state regarding: RESOURCES, FAQ, the Walrus Track Problem Statement, judging/eligibility, sanctioned tools + resource links, submission requirements, and prize/mainnet rules. Pulled live from the Mysten Labs Notion handbook on 2026-06-19. Cross-referenced against the locally captured verbatim copy at `/Users/abu/dev/hackathon/sui-overflow/onemem/docs/06-references/SUI_OVERFLOW_2026_HANDBOOK.md`.

## Sources Checked

- **Handbook (root)** — "Sui Overflow 2026 Hackathon Participant Handbook", https://mystenlabs.notion.site/overflow-2026-handbook — full body text + all hyperlinks extracted live, all 21 FAQ toggles expanded and read verbatim.
- **Walrus Track Problem Statement** — "Walrus Track Problem Statement", https://mystenlabs.notion.site/walrus-track-problem-statement — full body text + exact resource link URLs extracted live.
- **Detailed Submission Guide** — "Sui Overflow 2026: Detailed Submission Guide", https://mystenlabs.notion.site/overflow2026-submission-guide — full body + all 10 submission-FAQ toggles expanded and read verbatim.
- **Local capture** — `/Users/abu/dev/hackathon/sui-overflow/onemem/docs/06-references/SUI_OVERFLOW_2026_HANDBOOK.md` (Abu-pasted, 2026-05-25). Content matches the live site.
- **NOT fetched in full** (linked but not opened): Agentic Web Problem Statement (https://mystenlabs.notion.site/agentic-web-problem-statement), DeFi & Payments Problem Statement (https://mystenlabs.notion.site/defi-payments-problem-statement), DeepBook Predict Problem Statement (https://mystenlabs.notion.site/deepbook-predict-problem-statement), Hackathon Code of Conduct (https://mystenlabs.notion.site/Hackathon-Code-of-Conduct-3586d9dcb4e9806bbd32d3dc06615dd3), MemWal walkthrough doc (https://mystenlabs.notion.site/p/3666d9dcb4e9801dadb0e67ad368235e). The local file covers the three other track problem statements verbatim.
- **Tooling note:** The Notion connector (`notion-fetch`) returned a persistent server-side HTTP 500 ("Cross-cell memcached access is not allowed") on every attempt against the public site. `notion-search` only indexes Abu's own workspace, not the public Mysten site. `WebFetch` got only "Notion" (JS-rendered SPA). All live content above was obtained via Playwright (navigate + JS innerText/link extraction + toggle expansion).

---

## Verified Facts

### Walrus Track Problem Statement (verbatim, live page)

Opening framing:
> "AI agents today are powerful, but still fundamentally stateless and fragmented. They complete tasks in isolation, lose context across sessions, and struggle to share knowledge across tools, teams, or workflows. Memory is often tied to a single app, model, or device — making agent systems brittle, hard to scale, and difficult to trust."

> "As agents evolve from simple assistants to autonomous, long-running systems, they need a more durable foundation: the ability to store and retrieve memory across sessions; share context across agents and workflows; and access data that is portable, persistent, and not locked into a single platform."

> "This track challenges you to rethink how agentic systems are built by using Walrus as a Verifiable Data Platform for AI."

**What you'll build** — "functional AI agents or agentic workflows (single or multi-agent) in any domain — from finance to productivity to gaming — that demonstrate:"
- "Long-term memory using persistent, verifiable memory for agents" (the phrase "persistent, verifiable memory for agents" links to https://memwal.ai/)
- "Persistent data and file access using Walrus (directly or via a file management interface)"
- "Integrations and tooling that make it easier for developers to adopt Walrus or MemWal (Walrus Memory) in agentic systems"

**Especially interested in:**
- "Long-running workflows where agents track state over time (e.g., research agents, trading agents, monitoring systems)"
- "Multi-agent coordination, such as negotiation, task delegation, or step-by-step execution across agents"
- "Artifact-driven workflows, where agents generate, store, and reuse files like datasets, logs, reports, or intermediate outputs"

**Integrations/tooling angles:** adding persistent memory to existing agent frameworks/tools (plugins/adapters to use Walrus directly, or MemWal as the Walrus Memory layer); workflow orchestration layers combining memory + messaging + execution with Walrus as storage foundation; cross-tool/cross-agent memory sharing reading/writing the same context on Walrus; interfaces/dev tools to inspect, debug, or manage agent memory and data on Walrus.

**Project could be:** a user-facing agent or multi-agent system; a developer tool or framework integration; or a new interface for interacting with persistent AI memory and data.

**What we're looking for** (verbatim):
> "We're not just looking for demos — we're looking for working systems that show: how agents become more useful when they can remember and build over time; how workflows improve when data is shared, durable, and portable; and how developers can move beyond fragile, siloed memory setups."
> "The goal is to push toward a future where AI agents are not just reactive tools, but persistent, collaborative systems powered by a reliable data layer."

### Walrus Track — sanctioned/recommended tools with EXACT resource links (verbatim hrefs from the live Walrus page)

- Walrus docs — https://docs.wal.app/
  - Getting started — https://docs.wal.app/docs/getting-started
  - CLI — https://docs.wal.app/docs/walrus-client
  - HTTP API — https://docs.wal.app/docs/http-api/storing-blobs
  - Typescript SDK — https://sdk.mystenlabs.com/walrus
  - Public aggregators and publishers — https://docs.wal.app/docs/system-overview/public-aggregators-and-publishers
- Walrus Sites docs — https://docs.wal.app/docs/sites
  - Install the site-builder CLI — https://docs.wal.app/docs/sites/getting-started/installing-the-site-builder
  - Publish a site — https://docs.wal.app/docs/sites/getting-started/publishing-your-first-site
- MemWal (Walrus Memory) docs — https://docs.memwal.ai/
- "MemWal (Walrus Memory) Playground - create an account and a delegate key for your agent" — links to https://docs.memwal.ai/ (NOTE: on both the Walrus page and the Resource Hub, the "Playground" link target resolves to the docs URL `https://docs.memwal.ai/`, not a distinct playground URL)
- "MemWal (Walrus Memory) Github Repo - includes sample apps, skills etc." — https://github.com/MystenLabs/MemWal
- Seal docs ("privacy layer for Walrus and MemWal") — https://seal-docs.wal.app/
- "Sui Stack Messaging - messaging tooling that uses Walrus for storage & recovery and Seal for privacy" — https://github.com/MystenLabs/sui-stack-messaging
- Walrus Builder Group / Telegram — https://go.sui.io/ofw-walrus-tg
- Walrus Discord #developers — https://discord.com/invite/walrusprotocol

### Resource Hub (full, from the handbook root, verbatim link targets)

**Getting Started/General:**
- Sui | Founder Starter Pack — https://www.sui.io/founder-starter-pack
- Sui Documentation — https://docs.sui.io/
- Mysten Labs TypeScript SDK Docs — https://sdk.mystenlabs.com/
- awesome-sui — https://github.com/sui-foundation/awesome-sui
- sui-move-bootcamp — https://github.com/MystenLabs/sui-move-bootcamp
- sui-pilot — https://github.com/contract-hero/sui-pilot
- "OpenZeppelin's audited Move Libraries and Tools" (text listed; link target not separately captured — likely OZ site)

**Walrus** (same as track list above) plus one extra item present only in the Resource Hub:
- "MemWal (Walrus Memory) workshop and the associated walkthrough doc" — workshop video https://youtu.be/GncjVUEJw9Y?si=tzWeNi_3gAIkVT6f ; walkthrough doc https://mystenlabs.notion.site/p/3666d9dcb4e9801dadb0e67ad368235e

**DeepBook:**
- DeepBook Predict (protocol, current testnet deployment, integration model) — https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict
- Deepbook sandbox (1-line local deployment) — https://github.com/MystenLabs/deepbook-sandbox
- Deepbook v3 — https://docs.sui.io/onchain-finance/deepbookv3/deepbook
- Deepbook margin — https://docs.sui.io/onchain-finance/deepbook-margin
- DeepBook Telegram — https://go.sui.io/ofw-deepbook-tg

**Workshops** (embedded, all marked "(Completed)"): Walrus Memory; How to Trade on DeepBook Predict; Walrus Harbor Workshop; OpenZeppelin Workshop - Secure Move Patterns on Sui.

**Other links:** Register (DeepSurge) — https://www.deepsurge.xyz/hackathons/b587dc0c-4cb8-4e63-ada5-519df38103bf ; Overflow Telegram — https://go.sui.io/suioverflow2026-tg ; X @suidevelopers — https://x.com/suidevelopers ; Code of Conduct — https://mystenlabs.notion.site/Hackathon-Code-of-Conduct-3586d9dcb4e9806bbd32d3dc06615dd3 ; DeepSurge Terms — Google Doc `1Fit4X12MrmyXcmMoKb_EgRycXlNBa84cLOaAqOOof0A`.

### Tracks + prizes (handbook root, verbatim)

Core Tracks:
- **Agentic Web** — $30,000 / $15,000 / $10,000 / $7,500 (problem statement: https://mystenlabs.notion.site/agentic-web-problem-statement)
- **DeFi & Payments** — $30,000 / $15,000 / $10,000 / $7,500 (problem statement: https://mystenlabs.notion.site/defi-payments-problem-statement)

Specialized Tracks:
- **Walrus** — 1st $35,000 / 2nd $15,000 / 3rd $7,500 / 4th $5,000. NB (verbatim): "A total of $7,500 in additional funds will be distributed among notable honorable mentions or as special awards."
- **DeepBook** — 1st $35,000 / 2nd $15,000 / 3rd $7,500 / 4th $5,000. Same $7,500 honorable-mentions NB.

Special Rewards:
- **University Award** — "10 winners of $2,500 USD (eligible teams must have at least 50% student participation)"
- **Post-Hackathon** — "$250,000+ in additional value available for winning projects, including audit credits, ecosystem support, mentorship, and other resources..."

### Award structure / mainnet rules (verbatim)

> "50% of the prize will be awarded upon announcement of winners"
> "50% of the prize will be awarded after successful mainnet deployment"
> "If a winning team has already deployed their project to mainnet by the time winners are announced in August, they will receive 100% of the prize upfront."

Notes: "Mainnet deployment must meet the minimum functional requirements as defined by the Sui team and/or track sponsors." Also FAQ-confirmed: "Winning teams receive 50% of the total prize amount after results are announced. The remaining portion ... is released once the project has been successfully deployed to Sui Mainnet and meets the post-award requirements."

### Timeline (Pacific Time, verbatim)

- May 7 — Official Launch (track reveal + prize pool announced during Sui Live in Miami)
- May 7–June 21 — Building Period
- **June 21, 6:00 PM (Pacific Time)** — Submission Deadline. "After the deadline, you can continue to make changes to your project but it may not be reflected in the shortlisting process."
- July 8 — Shortlisted Teams Announcement
- July 20–21 — Demo Day (shortlisted teams present live, virtually). Demo Day schedule: **July 20 = Agentic Web + Walrus**; **July 21 = DeFi & Payments + DeepBook**.
- August 27 — Winners Announcement (may be invited to pitch at Sui Basecamp 2026)

### Judging criteria (verbatim weights)

- **Real-World Application — 50%** — "Meaningful problem-solving, market relevance, and long-term value."
- **Product & UX — 20%** — "Quality, usability, polish, and overall user experience."
- **Technical Implementation — 20%** — "Technical quality, reliability, and meaningful integration with Sui."
- **Presentation & Vision — 10%** — "Clarity of presentation, storytelling, and long-term vision."

"What Makes a Strong Overflow Project?" — solve meaningful problems; polished UX; leverage Sui meaningfully; strong product thinking; long-term potential. "Overflow is focused on meaningful products and ecosystem impact, not just technical demos."

### Submission checklist (verbatim table, appears in both handbook and submission guide)

| Field | Requirement |
|---|---|
| Project Name | Clear + simple |
| Description | What it does, why it matters |
| Project Logo | 1:1 ratio (JPG/PNG) |
| Public GitHub Repo | Required to be public during judging period |
| Demo Video | Required (YouTube preferred, ≤ 5 min) |
| Website | Optional, highly recommended |
| Deployment | Testnet or Mainnet |
| Package ID | If deployed on-chain |

Submission process (Detailed Submission Guide): (1) prepare materials; (2) go to DeepSurge Hackathons (https://www.deepsurge.xyz/hackathons); (3) find Overflow 2026; (4) "Click Submit Project, fill in all required details, and submit your project for review."

### Eligibility (handbook FAQ, verbatim)

- "The project must be deployed to Sui mainnet or testnet by the time of shortlisting and demo day."
- Submission must either "be a completely new project built between May 7th to June 21st, 2026, or introduce substantial new functionality, features, or integrations to an existing Sui project developed during the same period."
- "The project team must be available to participate in the virtual Demo Day session."
- "At least one member of the project team must pass KYC in order to receive prizes."
- "Participants residing in OFAC-sanctioned regions are not eligible to participate and win."

### FAQ — other authoritative answers (verbatim, abridged where noted)

- **Multiple tracks:** "each submission may only be submitted under one primary track." (Submission-guide FAQ: "You may only choose ONE track per project. However, if you have a different project, you may submit a different project under a different or same track.")
- **Subtracks:** "subtracks are intended only as guides or inspiration... Projects will still compete within the main track itself, and winners will be selected across the overall track regardless of subtrack category."
- **"Core Track" checkbox:** "applies to submissions under the Agentic Web and DeFi & Payments tracks. If you are submitting under Walrus or DeepBook, you do not need to select it. There are no separate bounty categories associated with this checkbox."
- **Solo builder:** allowed ("You can register, build, and submit a project on your own").
- **Minimum team size:** "Teams must have at least 2 members." (NOTE: this directly conflicts with the solo-builder answer above and with the local capture — see Inferences.)
- **Multiple teams:** "participants may contribute to multiple projects or teams, provided the projects are meaningfully different and are not simply replicas or slight variations of each other."
- **Code reuse:** allowed "if you have the legal rights to the code... such as frontend frameworks, UI libraries, boilerplate infrastructure, or tooling. However, projects should still demonstrate substantial new development completed during the hackathon period... If significant portions of the project were pre-existing, teams should clearly disclose this..."
- **Open source:** "Projects should be accessible for review during judging. If you prefer to keep your repository private during development, we recommend making it accessible during the shortlisting and judging period..." (handbook). Submission-guide FAQ is stronger: "During judging period, we require your repository to be public."
- **AI tools:** "Yes, AI-assisted development tools are allowed and expected. Projects will not be judged based on the amount of manually written code, but rather on product quality, technical execution, creativity, usability, and real-world value."
- **Updating after submission:** "You may continue updating your repo after submitting... However, any changes, features, or improvements added after the submission deadline will not be considered during judging."
- **KYC:** "KYC is generally only required if your project wins a prize or award. At least one member of the winning team must successfully complete KYC..."
- **Mainnet requirement (submission-guide FAQ):** "The project either needs to be deployed on testnet or mainnet."
- **Demo Day format:** virtual; 5 minutes presentation per team + up to 2 minutes Q&A; "Timing is strictly enforced"; at least one team member must attend; absence → called again at end of session, second no-show "may result in forfeiture." Streamed live on YouTube. Present on: problem, solution, technical implementation, why Sui, future roadmap.

### Office Hours hosts (verbatim, with booking links)

Daniel (OpenZeppelin) https://calendar.app.google/s96qH4jPqsMXvRR69 · Kose (OpenZeppelin) Google appointment schedule · Kris (Scallop) https://calendar.app.google/jgeoDM2TTSkdpaGn7 · Michał (OtterSec) https://calendly.com/embe221ed-osec/30min · Jianyi (Mysten Labs) https://calendly.com/jianyi-shi-mystenlabs/30min · Tony (Mysten Labs, DeepBook) https://calendar.app.google/jo9uQWULuVEjLY2D6 · **Abner (Walrus) — "Idea validation and project discussions relating to Walrus"** https://calendar.app.google/bUkFydDYhHb2rQxAA · plus Builder Growth Team APAC/EMEA hours.

### Sponsors (verbatim)

- **Headline Partner and Track Sponsor: Walrus** — "The Verifiable Data Platform in AI and onchain finance. Built by the team behind Sui." (https://www.walrus.xyz/)
- **Track Sponsor: DeepBook** — "Sui's onchain liquidity layer powering institutional-grade spot, margin, and prediction markets." (https://www.deepbook.tech/)
- **Prize Sponsor: OpenZeppelin** — "The security standard onchain finance is built on. Powering $35 trillion in onchain value." (https://www.openzeppelin.com/)
- **Prize Sponsor: OtterSec** — "OtterSec uncovers critical blockchain vulnerabilities and helps teams secure their systems." (https://osec.io/)
- **Award Sponsor: Scallop** — "Next-Generation Money Market for the Sui ecosystem." (https://scallop.io/)

## Inferences

- **MemWal Playground vs docs URL:** The local memory note records that the Playground gives "account + delegate key." On the live page the link text says exactly that ("create an account and a delegate key for your agent"), but the href resolves to `https://docs.memwal.ai/`. Inference: the docs site is the entry point to the Playground (or the Playground lives under the docs domain). The handbook does not expose a distinct `playground.memwal.ai`-style URL. Treat the actual Playground URL as an Unknown to confirm from the MemWal docs themselves.
- The Walrus track text's "persistent, verifiable memory for agents" hyperlink targets `https://memwal.ai/` (marketing/product domain), distinct from the docs domain `https://docs.memwal.ai/`. Inference: `memwal.ai` is the product landing page; `docs.memwal.ai` is documentation/Playground.

## Unknowns And Questions

- **Minimum team size contradiction (material):** The live handbook FAQ now says "Teams must have at least 2 members," yet the same FAQ also says solo builders are "absolutely welcome." The locally captured copy (2026-05-25) does not contain the "at least 2 members" line. This is a live-vs-captured discrepancy and an internal contradiction on the live page itself — needs a definitive answer (e.g., from the Telegram/organizers) before relying on either. Flagging per the "specs may be wrong/incomplete" memory.
- The actual MemWal Playground URL (where the account + delegate key are issued) is not directly exposed in the handbook; needs confirmation from https://docs.memwal.ai/.
- Three other track problem statements (Agentic Web, DeFi & Payments, DeepBook Predict) and the Code of Conduct were not opened live this session; the local file `SUI_OVERFLOW_2026_HANDBOOK.md` contains verbatim copies of all three track statements but I did not line-by-line re-verify them against the live pages today.
- The "OpenZeppelin's audited Move Libraries and Tools" Resource Hub link target was not separately captured (text only).
- DeepBook Predict doc link (`https://docs.sui.io/onchain-finance/deepbook-predict/`) appears in the local file but was not among the links extracted from the live Resource Hub today (live list showed DeepBook v3 and DeepBook margin docs only) — minor possible drift, unverified.