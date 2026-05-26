# Sui Overflow 2026 — Canonical Handbook (Verbatim)

**Source:** Pasted by Abu 2026-05-25 from the official Notion handbook + all four track problem statements.
**Status:** Source of truth. Any contradiction between this file and other research artifacts → trust this file.

Key URLs:
- Official site: https://overflow.sui.io
- Registration (DeepSurge): https://www.deepsurge.xyz/hackathons/b587dc0c-4cb8-4e63-ada5-519df38103bf
- Telegram: https://go.sui.io/suioverflow2026-tg
- MemWal repo: https://github.com/MystenLabs/MemWal
- Awesome Sui: https://github.com/sui-foundation/awesome-sui

---

## Walrus Track Problem Statement

> AI agents today are powerful, but still fundamentally stateless and fragmented. They complete tasks in isolation, lose context across sessions, and struggle to share knowledge across tools, teams, or workflows. Memory is often tied to a single app, model, or device — making agent systems brittle, hard to scale, and difficult to trust.

> As agents evolve from simple assistants to autonomous, long-running systems, they need a more durable foundation:
> - the ability to store and retrieve memory across sessions
> - share context across agents and workflows
> - and access data that is portable, persistent, and not locked into a single platform

> This track challenges you to rethink how agentic systems are built by using Walrus as a Verifiable Data Platform for AI.

### What you'll build

Functional AI agents or agentic workflows (single or multi-agent) in any domain — finance, productivity, gaming — that demonstrate:
- Long-term memory using persistent, verifiable memory for agents (https://memwal.ai/)
- Persistent data and file access using Walrus (directly or via a file management interface)
- Integrations and tooling that make it easier for developers to adopt Walrus or MemWal (Walrus Memory) in agentic systems

### Especially interested in
- Long-running workflows where agents track state over time (research agents, trading agents, monitoring systems)
- Multi-agent coordination — negotiation, task delegation, step-by-step execution across agents
- Artifact-driven workflows — agents generate, store, reuse files (datasets, logs, reports, intermediate outputs)

### Integration / tooling angles
- Adding persistent memory to existing agent frameworks or tools (plugins/adapters for Walrus directly OR MemWal as Walrus Memory layer)
- Workflow orchestration layers combining memory + messaging + execution across agents with Walrus as storage foundation
- Cross-tool / cross-agent memory sharing where different systems read/write the same context stored on Walrus
- Interfaces / developer tools to inspect, debug, manage agent memory and data stored on Walrus

### Project can be
- User-facing agent or multi-agent system
- Developer tool or framework integration
- New interface for interacting with persistent AI memory and data

### What they're looking for

> We're not just looking for demos — we're looking for working systems that show:
> - how agents become more useful when they can remember and build over time
> - how workflows improve when data is shared, durable, and portable
> - how developers can move beyond fragile, siloed memory setups

> The goal is to push toward a future where AI agents are not just reactive tools, but persistent, collaborative systems powered by a reliable data layer.

### Walrus track references
- Walrus docs: https://docs.wal.app/ (Getting started, CLI/HTTP API/TypeScript SDK, public aggregators+publishers)
- Walrus Sites docs: https://docs.wal.app/docs/sites (install site-builder CLI, publish a site)
- MemWal docs: https://docs.memwal.ai/ (Playground + GitHub repo with sample apps + skills)
- Seal docs: https://seal-docs.wal.app/
- Sui Stack Messaging: https://github.com/MystenLabs/sui-stack-messaging
- Walrus Telegram: https://go.sui.io/ofw-walrus-tg
- Walrus Discord #developers: https://discord.com/invite/walrusprotocol

---

## Agentic Web Problem Statement

> The Agentic Web track rewards projects that use Sui as a meaningful part of the AI stack — not as a payment rail bolted on at the end. Every submission must show why Sui specifically (Move objects, zkLogin, PTBs, Deepbook, Walrus, or Seal) makes the AI component better, safer, or more composable. **Generic LLM wrappers that happen to hold SUI will not place.**

### Sub-track 1: Autonomous Risk Guardian

> DeFi protocols run on static risk parameters. A de-peg or flash crash makes them dangerously stale within seconds. Build a live risk monitor for a Sui lending or perpetuals protocol that ingests oracle price feeds, runs an AI risk model, and autonomously executes a parameter adjustment or market pause via a Move policy object — with every action logged on-chain and reversible by a DAO override.

**Must have:** live price feed, visible AI risk score, at least one autonomous on-chain action, human override mechanism.

### Sub-track 2: Autonomous Agent Wallet

> AI agents are stuck at the "approve" wall — every action needs a human signature. Build an agent wallet on Sui using zkLogin or a Move policy object that grants an AI agent a capped budget and protocol scope (e.g. "max 500 USDC, Deepbook only, expires 24h"). The agent must autonomously execute a strategy, enforce its own ceiling, and produce an on-chain activity log. Owner revocation must be demonstrable.

**Must have:** real Deepbook orders, self-enforced budget ceiling, on-chain activity log, owner revocation demo.

### Sub-track 3: Intent Engine

> Users shouldn't need to know what a liquidity pool is. Build an intent engine that parses a plain-English financial goal, compiles it into a Sui PTB, and before signing, runs a guardian check that surfaces risks (high slippage, concentration, stale pools) in plain language. The user must explicitly confirm before execution. **A swap chatbot with no guardian layer is not an intent engine.**

**Must have:** text → PTB → execution flow, human-readable PTB preview, guardian catching at least 2 risk classes, explicit confirmation step.

---

## DeFi & Payments Problem Statement

**Title:** *Programmable Money, Payments & Financial Systems on Sui*

### Problem

> Payments and DeFi today are disconnected:
> - Payments are static transfers
> - DeFi is complex and siloed
> - Users must manually orchestrate everything

> On Sui, this changes: **Payments can become programmable financial actions.**

Examples:
- A payment that automatically invests
- A salary that streams and earns yield
- A wallet that intelligently routes funds

### Overview

> Sui introduces a fundamentally different model for building financial systems:
> - Assets are objects, not just balances
> - Transactions can bundle complex logic atomically (Programmable Transaction Blocks)
> - Smart contracts (Move) enforce ownership and composability at the type level

> This enables something beyond traditional DeFi:
> **Programmable money — where assets, logic, and flows are natively composable.**

### What you're building

Systems that move, manage, and transform money programmatically:
- Payment flows
- Wallets and financial interfaces
- Vaults and capital allocators
- Automation systems
- Financial abstractions for real users

### Core building blocks
- **Sui Move (Core Layer):** object-based assets, strong ownership model, type-safe financial logic
- **Programmable Transaction Blocks (PTBs):** bundle multiple actions into one transaction, atomic execution → multi-step payments, complex flows (e.g. pay → swap → deposit)
- **Tokens & Assets:** fungible tokens, NFTs / object-based assets → payments, receipts, identity-linked finance, tokenized positions
- **DeFi Protocols (Optional):** lending, DEXs / liquidity venues, yield platforms — tools, not requirements

### Idea bank (5 flavors)
- **Trust-Minimized Finance:** programmable loans, milestone-based escrow, payment-linked credit, controlled treasury, novel prediction markets
- **Payments & Consumer Finance:** smart wallets with automation, merchant payment systems, subscription/streaming payments, payroll, privacy-focused consumer rails
- **Vaults & Capital Management:** yield vaults, automated savings strategies, treasury management, portfolio allocators
- **Financial Automation:** auto-investment bots, rebalancing systems, conditional payments, rule-based financial agents
- **Infrastructure & Tooling:** SDKs for payments, tools for building/visualizing tx flows, financial dashboards, Move-contract debugging tools

### What a strong project looks like
- Clear financial use case
- Correct handling of assets and ownership
- Working end-to-end integrations / flows
- Thoughtful abstraction for users

### What a top-tier project looks like
- Novel use of programmable transactions
- Strong composability across components
- Excellent UX for complex financial actions
- Real-world applicability

### Submission types
- Full-stack applications
- Smart contract systems (Move modules)
- Bots or automation services
- Developer tools

---

## DeepBook Predict Problem Statement

Telegram: https://t.me/+bZTS2KvwIBQyOGZl
X: https://x.com/DeepBookonSui
Registration (DeepSurge): https://www.deepsurge.xyz/hackathons/b587dc0c-4cb8-4e63-ada5-519df38103bf

> Prediction markets today are powerful, but still fundamentally fragmented and shallow. Most live venues either run as CLOB-matched event markets (Polymarket, Kalshi) or as off-chain sportsbooks pretending to be markets. They settle slowly, list a narrow set of binary outcomes, can't price strikes or ranges, and have no real notion of an underlying volatility surface — making serious quant strategies, structured products, and on-chain risk transfer nearly impossible.

> As prediction markets evolve from "will X happen" novelty bets into a real piece of crypto market structure, they need a more durable foundation:
> - the ability to price *every* strike and expiry against a live volatility surface, not just hand-listed events
> - short, rolling expiries that work like a real options market — sub-hour cycles, not weekly
> - a vault that takes the other side of every trade so liquidity is always present, with on-chain LP economics anyone can audit and compose against
> - and primitives that are portable across the wider Sui DeFi ecosystem — composable with margin, lending, structured vaults, and bots — not locked inside a single app

### Where Predict is today

- **Live on Sui testnet** with rolling sub-hour BTC oracles, public indexer/API at `predict-server.testnet.mystenlabs.com`, `dUSDC` quote asset
- Mainnet launch planned; projects expected to redeploy day one
- DeFi surface to compose against — DeepBook spot, `deepbook_margin` (margin trading + liquidation), `iron_bank` (permissioned USDsui supply with Slush user vault on top) — **already live on Sui mainnet**

### dUSDC

You need DUSDC for DeepBook Predict on testnet — NOT the official USDC on testnet. Request via https://tally.so/r/Xx102L

### Minimum requirement

- Integrate deepbook predict contract on testnet
- Work end-to-end if building a product (full flow will be tested)
- Have proper simulation result if building a vault strategy

### Idea bank (10 examples)

**Vaults & structured products:**

1. **Range Ladder Vault** — auto-deposits user funds into ranges around ATM strike per expiry; auto-rolls; tokenized share
2. **PLP + Hedge Vault** — `predict::supply` for PLP yield + buy OOM binaries via `predict::mint` to cap left-tail drawdown
3. **BTC-collateral Predict Vault** — accept BTC (xBTC, sBTC), route through DeepBook spot → dUSDC, deposit into PredictManager, return BTC-denominated yield
4. **Three-Protocol Margin Loop** — borrow dUSDC on `deepbook_margin` against `iron_bank` USDsui share token, deploy into Predict ranges, repay from settlement payouts. **"this is what Sui DeFi composability actually looks like"** flagship demo.

**Frontends & consumer apps:**

5. **Telegram Quick-Predict Bot** — `/up 70k 15m 100usdc` → `predict::mint`; group-chat tournaments, copy-trading, leaderboards
6. **Streaks & Leaderboard PWA** — daily binary picks, per-user streaks, weekly prize pools, NFT badges

**Bots, keepers, arbitrage:**

7. **Vol-Arb Bot: Predict ↔ Polymarket** — back-solve Predict's implied vol from `OracleSVI`, compare against Polymarket BTC option smile, trade the spread. Stretch: delta-hedge binary on Hyperliquid perps. **"the single most realistic mainnet-day-one strategy."**
8. **Settled-Redeem Keeper Network** — watches settled oracles, scans indexer for un-redeemed positions/ranges, calls `predict::redeem_permissionless` for tips

**Analytics & developer tooling:**

9. **Predict Surface Studio** — live 3-D vol surface (strike × expiry → IV) streamed from `oracle::OracleSVIUpdated` events, time-travel slider, arbitrage-free checker
10. **PLP Risk Dashboard** — vault utilization, withdrawal-limiter token-bucket state, per-oracle exposure breakdown, what-if scenario simulator

### DeepBook references
- Codebase (use branch **`predict-testnet-4-16`**, NOT `main`): https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict
- DeepBook sandbox (1-line local deploy): https://github.com/MystenLabs/deepbook-sandbox
- DeepBook Predict doc: https://docs.sui.io/onchain-finance/deepbook-predict/
- DeepBook v3 doc: https://docs.sui.io/onchain-finance/deepbookv3/deepbook
- DeepBook margin doc: https://docs.sui.io/onchain-finance/deepbook-margin
- DeepBook Telegram: https://go.sui.io/ofw-deepbook-tg

---

## Hackathon Logistics (verbatim)

### Timeline (Pacific Time)

| Date | Event |
|---|---|
| May 7 | Official Launch — track reveal + prize pool announcement (Sui Live in Miami) |
| May 7 – June 21 | Active building period |
| June 21 | Submission deadline — after deadline, changes can still be made but may not reflect in shortlisting |
| July 8 | Shortlisted teams announced |
| July 20-21 | Demo Day — shortlisted teams present live virtually to judges |
| August 27 | Winners announced; invited to pitch at Sui Basecamp 2026 |

### Prize structure per track

| Track | 1st | 2nd | 3rd | 4th | Bonus |
|---|---|---|---|---|---|
| Agentic Web | $30K | $15K | $10K | $7.5K | — |
| DeFi & Payments | $30K | $15K | $10K | $7.5K | — |
| Walrus | $35K | $15K | $7.5K | $5K | + $7.5K honorable mentions / special awards |
| DeepBook | $35K | $15K | $7.5K | $5K | + $7.5K honorable mentions / special awards |

### University Award
- 10 winners of $2,500 each
- Eligible teams must have at least 50% student participation

### Post-Hackathon support
- $250,000+ in additional value (audit credits, ecosystem support, mentorship, etc.)

### Award split distribution model

- 50% on winner announcement (Aug 27)
- 50% after successful mainnet deployment
- **100% upfront if already deployed to mainnet by Aug 27**

> Mainnet deployment must meet the minimum functional requirements as defined by the Sui team and/or track sponsors.

### Judging criteria
- **Real-World Application — 50%** — meaningful problem-solving, market relevance, long-term value
- **Product & UX — 20%** — quality, usability, polish, overall UX
- **Technical Implementation — 20%** — technical quality, reliability, meaningful integration with Sui
- **Presentation & Vision — 10%** — clarity, storytelling, long-term vision

### Submission checklist

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

### Eligibility (verbatim FAQ)

- Project must be deployed to Sui mainnet or testnet by shortlisting and demo day
- Submission must either: (a) be a completely new project built between May 7 → June 21, 2026, OR (b) introduce substantial new functionality, features, or integrations to an existing Sui project developed during the same period
- Team must be available for the virtual Demo Day session
- At least one team member must pass KYC to receive prizes
- OFAC-sanctioned regions excluded
- AI-assisted dev tools explicitly allowed
- Open-sourcing not required; judges may request temporary repo access
- **Same project → ONE primary track only**
- **Same person CAN be on multiple teams, as long as projects are meaningfully different (not replicas or slight variations)**
- Subtracks within a track are guides/inspiration only — projects compete within the main track regardless of subtrack
- Code reuse from prior work allowed if legal rights are held (frontend frameworks, UI libraries, boilerplate, tooling) — substantial new development still required

### Office Hours hosts (sponsor tastemakers)

| Host | Org | Topic |
|---|---|---|
| Daniel | OpenZeppelin | OZ Move contracts, audit-grade Move |
| Kose | OpenZeppelin | OZ Move security patterns |
| Kris | Scallop | DeFi primitives that compose with money markets |
| Michał | OtterSec | Move auditing, capability discipline |
| Jianyi | Mysten Labs | General technical guidance |
| Tony | Mysten Labs | DeepBook integrations + composability |
| **Abner** | **Walrus** | **Idea validation + project discussions for Walrus** |

General Sui guidance from Builder Growth Team: APAC hours, EMEA hours.

### Sponsors

- **Headline Partner + Walrus Track Sponsor:** Walrus — "The Verifiable Data Platform in AI and onchain finance"
- **DeepBook Track Sponsor:** DeepBook — "Sui's onchain liquidity layer powering institutional-grade spot, margin, and prediction markets"
- **Prize Sponsor:** OpenZeppelin — "The security standard onchain finance is built on. Powering $35 trillion in onchain value"
- **Prize Sponsor:** OtterSec — "uncovers critical blockchain vulnerabilities and helps teams secure their systems"
- **Award Sponsor:** Scallop — "Next-Generation Money Market for the Sui ecosystem"

---

## Resource Hub (full URL list)

### Getting Started
- Founder Starter Pack: https://www.sui.io/founder-starter-pack
- Sui docs: https://docs.sui.io/
- Sui SDKs: https://sdk.mystenlabs.com/
- Awesome Sui: https://github.com/sui-foundation/awesome-sui
- Sui Move Bootcamp: https://github.com/MystenLabs/sui-move-bootcamp
- Sui Pilot (Claude Code plugin): https://github.com/contract-hero/sui-pilot

### Walrus + MemWal + Seal
- Walrus docs: https://docs.wal.app/
- Walrus Sites docs: https://docs.wal.app/docs/sites
- MemWal docs: https://docs.memwal.ai/
- MemWal repo: https://github.com/MystenLabs/MemWal
- Seal docs: https://seal-docs.wal.app/
- Sui Stack Messaging: https://github.com/MystenLabs/sui-stack-messaging
- Walrus Telegram: https://go.sui.io/ofw-walrus-tg
- Walrus Discord #developers: https://discord.com/invite/walrusprotocol

### DeepBook
- DeepBook Predict (testnet branch `predict-testnet-4-16`): https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict
- DeepBook sandbox: https://github.com/MystenLabs/deepbook-sandbox
- DeepBook v3 doc: https://docs.sui.io/onchain-finance/deepbookv3/deepbook
- DeepBook margin doc: https://docs.sui.io/onchain-finance/deepbook-margin
- DeepBook Telegram: https://go.sui.io/ofw-deepbook-tg

### Code of Conduct
- https://docs.google.com/document/d/1Fit4X12MrmyXcmMoKb_EgRycXlNBa84cLOaAqOOof0A/edit?tab=t.0
