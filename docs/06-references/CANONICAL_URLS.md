# Canonical URLs — OneMem Build Reference

Fast-lookup index of every URL that matters during architecture + build. Grouped by topic.

---

## Sui ecosystem

### Core
- Sui docs: https://docs.sui.io
- Sui repo (docs source): https://github.com/MystenLabs/sui
- Move book: https://github.com/MystenLabs/move-book
- Awesome Sui: https://github.com/sui-foundation/awesome-sui

### SDKs
- Sui TS SDK: https://sdk.mystenlabs.com/typescript (npm: `@mysten/sui`)
- Sui dApp Kit: https://sdk.mystenlabs.com/dapp-kit (npm: `@mysten/dapp-kit-react`)
- Sui Rust SDK: https://github.com/MystenLabs/sui-rust-sdk
- Sui Python SDK (pysui): https://github.com/FrankC01/pysui

### Tooling
- suiup (installer): https://github.com/MystenLabs/suiup
- Sui Pilot (Claude Code plugin for Sui dev): https://github.com/contract-hero/sui-pilot
- Founder Starter Pack: https://www.sui.io/founder-starter-pack
- create-dapp scaffolder: `pnpm create @mysten/dapp` (templates: react-client-dapp, react-e2e-counter)

---

## Walrus

- Docs: https://docs.wal.app
- Repo: https://github.com/MystenLabs/walrus
- TS SDK: https://sdk.mystenlabs.com/walrus (npm: `@mysten/walrus`)
- CLI (`walrus`): via suiup or https://storage.googleapis.com/mysten-walrus-binaries/
- HTTP API: https://docs.wal.app/usage/web-api
- Public aggregators+publishers: https://docs.wal.app/docs/system-overview/public-aggregators-and-publishers
- Walrus Sites docs: https://docs.wal.app/walrus-sites/
- Walrus Sites repo: https://github.com/MystenLabs/walrus-sites
- Awesome Walrus: https://github.com/MystenLabs/awesome-walrus

### Walrus community SDKs
- Go: https://github.com/namihq/walrus-go
- Python: https://github.com/standard-crypto/walrus-python
- iOS: https://github.com/akhtarshahnawaz/iWalrusSDK
- Flutter: https://github.com/keem-hyun/walrus_dart

---

## MemWal

- GitHub: https://github.com/MystenLabs/MemWal
- Docs: https://docs.memwal.ai
- LLM-friendly spec: https://docs.memwal.ai/llms.txt
- npm SDK: https://www.npmjs.com/package/@mysten-incubation/memwal
- npm OC plugin: https://www.npmjs.com/package/@mysten-incubation/oc-memwal
- npm MCP server: https://www.npmjs.com/package/@mysten-incubation/memwal-mcp
- Mainnet relayer: `https://relayer.memwal.ai`
- Staging relayer: `https://relayer.staging.memwal.ai`
- Dashboard: `https://memwal.ai`

---

## Seal

- Docs: https://seal-docs.wal.app
- Repo: https://github.com/MystenLabs/seal
- npm SDK: `@mysten/seal`
- Awesome Seal (Seal-integrated apps): https://github.com/MystenLabs/awesome-seal
  - Article Garden (encrypted Substack), Zeroleaks (ZK whistleblowing), Passman, SuiShare, Mandy, Epoch One

---

## Nautilus (TEE)

- Repo: https://github.com/MystenLabs/nautilus
- Blog (Sui Stack Verifiable AI): https://blog.sui.io/verifiable-ai-data-sui-stack/
- Blog (Nautilus offchain security/privacy): https://blog.sui.io/nautilus-offchain-security-privacy-web3/

---

## Enoki (zkLogin + sponsored tx)

- Docs: https://docs.enoki.mystenlabs.com
- npm: `@mysten/enoki`

---

## Sui Stack Messaging (E2EE messaging)

- Repo: https://github.com/MystenLabs/sui-stack-messaging
- Live demo: https://chatty.wal.app
- npm: `@mysten/sui-stack-messaging` + `@mysten/sui-groups`

---

## DeepBook (not blocking OneMem but referenced in the broader ecosystem)

- DeepBook v3: https://docs.sui.io/onchain-finance/deepbookv3/deepbook
- DeepBook Predict (testnet): https://docs.sui.io/onchain-finance/deepbook-predict/
- DeepBookv3 repo: https://github.com/MystenLabs/deepbookv3
- DeepBook sandbox (1-line local deploy): https://github.com/MystenLabs/deepbook-sandbox

---

## Reference apps (clone targets)

| Repo | What we borrow |
|---|---|
| https://github.com/MystenLabs/onlyfins-example-app | **Flagship** — Walrus + Seal + Enoki + zkLogin full Web3 social ref. `ViewerToken` capability pattern, `seal_approve_access` Move function. |
| https://github.com/MystenLabs/ticketing-poc | NFT + Enoki + Google OAuth + stage transitions |
| https://github.com/MystenLabs/sui-stack-hello-world | Pre-configured testnet scaffold for day-0 |
| https://github.com/MystenLabs/CTF | Security challenge patterns (OZ/OtterSec scoring) |
| MystenLabs/MemWal → `apps/researcher` | Long-running research agent with persistent memory |
| MystenLabs/MemWal → `apps/chatbot` | Next.js + Vercel AI SDK + withMemWal middleware |
| MystenLabs/MemWal → `apps/noter` | zkLogin-authenticated AI assistant |
| MystenLabs/MemWal → `apps/app` | Dashboard reference (credentials focus; we extend for memory content) |
| MystenLabs/sui → `examples/trading/` | DeepBook frontend reference (if we ever add) |
| MystenLabs/sui → `dapps/sponsored-transactions/` | Vite + TS sponsored-tx UI |
| MystenLabs/sui → `examples/custom-indexer/` | Custom indexer pattern (relevant if we build our own indexer beyond MemWal's) |

---

## Inspiration products (memory layer)

- Mem0: https://github.com/mem0ai/mem0 + https://docs.mem0.ai
- claude-mem: https://github.com/thedotmack/claude-mem
- Zep: https://github.com/getzep/zep + https://www.getzep.com
- Letta (MemGPT lineage): https://github.com/letta-ai/letta + https://www.letta.com
- Honcho (Nous): TBD via research agent
- Supermemory: https://supermemory.ai
- Memori: TBD via research agent
- OMEGA: TBD via research agent
- Mem.ai: https://mem.ai

## Inspiration products (trace viewer)

- LangSmith: https://www.langchain.com/langsmith + https://docs.smith.langchain.com
- Langfuse: https://github.com/langfuse/langfuse + https://langfuse.com
- Arize Phoenix: https://github.com/Arize-ai/phoenix + https://docs.arize.com/phoenix
- (Helicone: in maintenance mode since March 2026 — skip)

## Inspiration products (verifiable AI on Web3)

- Talus: https://talus.network
- elizaOS: https://github.com/elizaOS/eliza
- Theoriq: https://www.theoriq.ai
- Olas / Autonolas: https://olas.network
- ERC-8004 (EVM agent registry): https://eips.ethereum.org/EIPS/eip-8004
- Shade Agents (NEAR): TBD via research agent
- Eigen Cloud: https://eigencloud.xyz

---

## Runtime plugin docs

- Claude Code plugins: https://docs.claude.com/en/docs/claude-code/plugins
- Codex CLI hooks: https://developers.openai.com/codex/hooks
- Gemini CLI hooks: https://geminicli.com/docs/hooks/
- Gemini CLI → Antigravity transition: https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/
- OpenClaw plugin docs: TBD (live config at `~/.openclaw/openclaw.json`)
- Hermes Agent repo (ABC + plugin discovery): https://github.com/NousResearch/hermes-agent
- Hermes example plugins: https://github.com/NousResearch/hermes-example-plugins

---

## Sui Overflow 2026 (target hackathon)

- Official site: https://overflow.sui.io
- Registration (DeepSurge): https://www.deepsurge.xyz/hackathons/b587dc0c-4cb8-4e63-ada5-519df38103bf
- Handbook: https://mystenlabs.notion.site/overflow-2026-handbook
- Telegram: https://go.sui.io/suioverflow2026-tg
- Walrus track handbook (problem statement): https://mystenlabs.notion.site/walrus-track-problem-statement
- Blog (announcement video): https://www.youtube.com/watch?v=RqRjwW0e6EQ
- Walrus track Discord: https://discord.com/invite/walrusprotocol (#developers)

---

## Sponsor channels

- @suidevelopers (Twitter)
- @WalrusProtocol (Twitter)
- devrel@sui.io (email)
- Walrus office hours: Abner — https://calendar.app.google/ZUomx3CSLkne4igK7
- Mysten office hours: Jianyi Shi — https://calendly.com/jianyi-shi-mystenlabs/30min

---

## Other research files in this folder

- `../00-goal/GOAL.md` — OneMem vision
- `../01-sui-ecosystem/SUI_DOC_TREE.md` — Sui repo doc map (in flight)
- `../02-inspirations/*` — per-product deep dives (mix of written + in-flight)
- `../03-target-runtimes/README.md` — plugin surface matrix
- `../04-framework-providers/README.md` — provider integration matrix
- `../05-our-architecture/*` — design phase (not yet started)
- Parent folder: `WEDGE_V2.md`, `TRACE_AND_PROVIDERS.md`, `MEM0_DEEP_DIVE.md`, `DEEP_DIVE.md`, `WEDGE_REFINEMENT.md`, `FINAL_WEDGE.md`, `scores.json`, `idea.md`
