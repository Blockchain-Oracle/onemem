I have everything needed. Here is the inventory.

## Scope

Inventory of `/Users/abu/dev/hackathon/sui-overflow/onemem/.thoughts/` — the Context Engineering artifact tree. 357 files, 4.8 MB across 13 subdirectories. Goal: document what exists, give a one-line purpose per file/group, and flag uniquely valuable, non-reconstructable info NOT in code (deployed addresses, credential/funding refs, decisions with no code trace). Reality only.

## Sources Checked

- `ls -la .thoughts` and full `find .thoughts -type f` with sizes/dates (command output, above).
- `du -sh .thoughts` → 4.8M; file count → 357.
- Whole-tree greps for `0x` addresses, base58 tx digests, `packageId/published-at/UpgradeCap/AdminCap`, and credential/key/funding terms (command output, above).
- Cross-check of every `0x` address and tx digest against the repo OUTSIDE `.thoughts` (`grep -rl ... --exclude-dir=.thoughts/node_modules/.git`).
- Repo deploy config: `contracts/onemem/Published.toml`, `config/networks.json`, `packages/sdk-ts/src/generated/addresses.ts` (lines cited below).
- `~/.onemem/` directory listing (real creds, outside repo).
- Read in full or in header: `verification/2026-06-18-testnet-live-upgrade.md`, headers of `wiki/index.md`, `prototype-discovery/...`, `raw/...`, `quality/...`, `design/.../00-TARGET-ARCHITECTURE.md`, `research/2026-06-19-grounding/00-GROUNDING-SYNTHESIS.md`, root `CLAUDE.md` (system context).

## Verified Facts

### Directory tree (subdir → file count, byte totals, date span)

```
.thoughts/
├── design/                 8 files  (4 md briefs + target-architecture/)   Jun 18–19
│   └── 2026-06-19-target-architecture/  7 md + 4 png   ~3.0 MB (PNGs dominate)
├── goals/                  1 file   7,959 B            Jun 19
├── handoffs/               3 files  ~21 KB             Jun 19
├── plans/                  ~70 files                   Jun 17–19
├── prototype-discovery/    1 file   10,644 B           Jun 17
├── quality/                1 file   4,222 B            Jun 18 (mtime), Jun 17 (name)
├── raw/                    1 file   1,433 B            Jun 17
├── research/               ~75 files (incl. grounding/ + grounding/v1/)  Jun 17–19
├── specs/                  ~53 files                    Jun 17–18
├── stories/                ~52 files                    Jun 17–18
├── verification/           ~74 files                    Jun 17–19
└── wiki/                   4 files  (index, log, project-map, context-engineering-status)  Jun 18–19
```
Total 357 files, 4.8 MB. (Exact per-file sizes/dates in the `find` output above.)

### What each group is (one-liner per category)

- **`plans/`, `research/`, `specs/`, `stories/`, `verification/`** — the Context Engineering pipeline. One file per feature "slug" per stage (research → spec → story → plan → verification), filenames matched across stages (e.g. `*-hosted-cli-delegate-minting.md` appears in all five). ~50–75 small markdown files each; most 1.5–8 KB. Topics span the whole product: CLI credentials/command surface, delegate-key lifecycle, hosted auth/Enoki/sponsored provisioning, share/revoke capabilities, memory provenance, runtime controls, npm/python/plugin release readiness, testnet upgrade, Walrus Sites deploy, brand/video assets, executable demos.
- **`research/2026-06-19-grounding/`** (8 large files + `v1/` earlier draft of 7) — the "execution location determines product surface" grounding reset; `00-GROUNDING-SYNTHESIS.md` is the founder-facing synthesis, 01–08 are the investigation threads (problem/judge, claude-mem blueprint, claude-code/codex/MCP/frameworks runtimes, dashboard purpose/POV/UI reality).
- **`design/2026-06-19-target-architecture/`** — authoritative end-state architecture (`00-TARGET-ARCHITECTURE.md`) plus 6 surface threads (local dashboard, MCP server, hosted dashboard, local worker, vercel-ai demo, trace-led narrative) and **4 PNG screenshots** (`landing-after.png` 1.67 MB, `hosted-namespace-view.png`, `trace-content-1/2.png`) — the only binary assets in `.thoughts`.
- **`design/` (top-level 4 md)** — campaign/designer briefs, emotional/launch video specs, social brand-kit prompt, 30s reel brief + sound libraries.
- **`goals/2026-06-19-onemem-build-goal.md`** — current build objective (the active Codex/agent goal).
- **`plans/2026-06-19-build-roadmap.md`** — current checkbox roadmap with `[x]/[ ]` build state and embedded proof evidence.
- **`handoffs/`** (3) — session handoffs to Claude Code / Codex (Jun 19), incl. a launch-sound handoff.
- **`prototype-discovery/2026-06-17-one-mem-2.md`** + **`raw/2026-06-17-one-mem-2-source.md`** — inventory of the static HTML/CSS prototype at `/Users/abu/Downloads/One Mem 2` (design-system export source). The Downloads source is external to the repo.
- **`quality/2026-06-17-project-quality-profile.md`** — detected stack + current quality gates (referenced by root `CLAUDE.md`).
- **`wiki/`** — persistent project wiki: `index.md`, `project-map.md`, `log.md` (chronological build log), `context-engineering-status.md` (53 KB — the largest single text file, narrates every slice with embedded on-chain evidence IDs).

### Deployed on-chain addresses — which are ALSO in code (reconstructable) vs `.thoughts`-only

The persistent deployed identifiers appear in repo code and are therefore reconstructable WITHOUT `.thoughts`:
- `Published.toml:7-12` and `config/networks.json:9-14` and `packages/sdk-ts/src/generated/addresses.ts:31-35` all carry: package `0xc2e839…cf138`, original-id `0x64c14f…4ceafc`, registry `0x3c78a1…ae16e0`, registry-admin-cap `0x37cc50…2f3d68`, upgrade-cap `0x2834843d…8151a9`, deployer address `0x633dbf…0c235a`.

`.thoughts`-only identifiers (cross-check `in_repo=0`) — NOT in code, NON-reconstructable:
- **Keystone `vercel-ai` TraceSession `0x2571e27b…44117a6`** — the flagship proof object; cited in `goals/2026-06-19-onemem-build-goal.md:24` and `plans/2026-06-19-build-roadmap.md:17`.
- **Demo / smoke session + namespace + cap object IDs**, e.g. live share/revoke namespace `0x362495a8…b254fd` and ReadOnly cap `0xcf95dbe4…24ef90b` (`wiki/log.md:46-48`, `verification/2026-06-17-share-capability-readiness.md`, `verification/2026-06-17-holder-self-revoke.md`); demo trace `0xc173d0ab…56d59`; public-verify demo session `0x6ceaab0f…3ec080`; Codex trusted-hook session `0x0c883176…04e330`; MCP attestation session `0x00770b3a…23f3` + callId `0x6449943b…`; multi-agent / switch-laptops / verifiable-research demo session IDs (one per executable-demo verification file). ~30+ distinct such IDs, each living in exactly one or two `.thoughts` files.
- **Testnet tx digests (base58)** — e.g. live-upgrade digest `6aARmWJadHzwCf6iF3PooZKVSypHTL7jREsWUZEwqrhP` (also appears in 3 code files), plus digests `2LKuUyke…`, `VxQsgGzo…` and ~10 others that are `.thoughts`-only.

### Live-deployment evidence — `.thoughts`-only (not in code)

In `verification/2026-06-18-vercel-public-deployment.md` and `verification/2026-06-18-production-user-flow-audit.md`:
- Live domains `https://onemem.xyz` and `https://app.onemem.xyz` are confirmed deployed (HTTP 200, Cloudflare+Vercel), CTAs verified.
- Specific **Vercel deployment IDs / inspect URLs**, e.g. `dpl_7QVMXfRcGiH4nTus31KWUBCYNbHK` (→ onemem.xyz) and `dpl_BtEdipDexSrxYPgYniqWiJ7ZGvU7` (→ app.onemem.xyz), under Vercel org/project path `blockchain-oracles-projects/onemem-landing` and `/onemem-hosted-dashboard`. These deployment hashes and the public verify URL `https://app.onemem.xyz/verify/0x6ceaab0f…3ec080` are recorded only here.
- `verification/2026-06-18-walrus-sites-deploy-readiness.md:108` notes a `<hash>.wal.app` URL pattern; live Walrus URL evidence is recorded as still pending (no concrete blob URL captured).

### Credential / key / funding references — pointers only, no secret material

- `.thoughts` files reference credential FILE PATHS, never secret values: `~/.onemem/credentials.json` (mode 0600), `~/.onemem/runtime-controls.json`, `~/.onemem/cc-sessions`, and env var NAMES `ENOKI_PRIVATE_KEY`, `NEXT_PUBLIC_ENOKI_API_KEY`/`NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID`, `ONEMEM_EMBEDDING_API_KEY`, `OPENAI_API_KEY`. No private keys, mnemonics, or API-key values are stored in `.thoughts`.
- The real secret material lives OUTSIDE `.thoughts`, in `~/.onemem/*.json` (15 files incl. `credentials.json`, `codex.testnet.json`, `agent-sends-money-demo.testnet.json`, etc.) and `~/.onemem/worker.db`. `goals/...build-goal.md:24` explicitly states "Real testnet creds in `~/.onemem/*.json`."
- Funding/faucet: `goals/...:46` and `plans/2026-06-19-build-roadmap.md:17` record the operational fact that the testnet CLI faucet is dead and the HTTP faucet `POST https://faucet.testnet.sui.io/v2/gas` must be used — an operational decision with no code trace.

### Decisions with no code trace (only in `.thoughts`)

- The **"execution location determines product surface"** principle and the resulting decision to REMOVE framework adapter cards from the local dashboard while keeping adapter packages shipping (`design/.../00-TARGET-ARCHITECTURE.md`, `research/2026-06-19-grounding/00-GROUNDING-SYNTHESIS.md`, `goals/...:28-30`).
- The demo scoping decision: "laptop runtimes + public `/verify` + ONE deployed adapter (Vercel AI)" (`goals/...:30`, `plans/build-roadmap.md:11`).
- The testnet live-upgrade post-mortem deviations (package version landed at 3 vs real on-chain 2; verifier had to switch from package-ID equality to `::registry::OneMemRegistry` suffix check) — `verification/2026-06-18-testnet-live-upgrade.md:110-124`. The fix is in code but the rationale/incident record is only here.

## Inferences

- The `plans / research / specs / stories / verification` quintets are produced by the Abu Context Engineering workflow (one slug per feature); the bulk of the 357 files are reconstructable process artifacts whose value is historical narrative, not unique data. (Inference from the consistent slug-matched filenames across five dirs and the CLAUDE.md "Context Engineering artifacts live under `.thoughts/`".)
- `research/2026-06-19-grounding/v1/` is an earlier draft superseded by the sibling non-`v1` files (same filenames, `v1` has 7 vs 8, identical mtimes suggest a batch copy). Inference from naming + size deltas; not separately diffed.
- The `.thoughts`-only session/namespace/cap object IDs are recoverable in principle by re-querying Sui testnet IF the owning keypair/object survives, but as written records they exist nowhere else in the repo — losing the files loses the human-readable index of which object proves which demo. (Inference: the chain still holds the objects; the mapping does not.)
- The 4 PNGs (≈2.5 MB of the 4.8 MB total) are design reference screenshots; whether they are reproducible depends on the live site state at capture time. (Inference.)

## Unknowns And Questions

- I did not diff `grounding/` vs `grounding/v1/` line-by-line to confirm v1 is strictly superseded (only compared filenames, sizes, mtimes).
- I did not open all ~350 small pipeline files individually; per-file one-liners for the quintets are derived from filenames + the wiki `log.md`/`context-engineering-status.md` narration, not from reading each file. A specific slug's exact content is verifiable on request.
- Whether any of the `.thoughts`-only Sui object IDs / Vercel `dpl_` IDs are duplicated elsewhere on Abu's machine (outside this repo) is unknown — I only checked inside the repo.
- I did not verify the live state of `onemem.xyz` / `app.onemem.xyz` / the recorded Vercel deployments now; the URLs/IDs are as recorded in the Jun 18 verification files.
- The exact count per quintet dir is approximate (~50–75) from the `find` listing; I did not run a precise per-dir `wc`. Counts can be made exact on request.