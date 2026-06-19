# OneMem — 30-Second Launch Reel · Designer Brief

**Status:** Ready to hand to a designer / AI design agent.
**Date:** 2026-06-19
**Audience:** X (Twitter) launch post.
**Author note:** This brief deliberately contains **no visual / UI direction**. The designer owns the visual language. The brief locks the product truth, the copy, the duration, the safety rails, and the audio guidance.

---

## 1. What OneMem is (in OneMem's own words — verbatim from the codebase)

> **One memory layer for every agent.**
> _packages/brand/briefs/one-mem-full-brand-and-asset-brief.md_

> **Decentralized persistent memory for AI agents.**
> _packages/brand/media-kit/onemem-media-kit.generated.md_

> **OneMem gives them a shared memory layer.**
> _.thoughts/design/2026-06-18-onemem-emotional-video-brief.md_

> **Portable memory across Claude Code, Codex, OpenClaw, Hermes, MCP, and AI frameworks.**
> _.thoughts/design/2026-06-18-onemem-emotional-video-brief.md_

> **Memory is trapped. Every app keeps its own silo. Switch tools and your agent forgets everything — there's no portable, shared memory.**
> _apps/landing/app/landing-content.ts:3-5_

> **The headline is memory ownership, portability, persistence, sharing, and cross-runtime context.**
> _packages/brand/briefs/one-mem-full-brand-and-asset-brief.md_

> **Keep memory as the headline and proof as the confidence layer.**
> _packages/brand/designer-campaign/README.md_

**One sentence the designer can hold in their head:** OneMem is **one memory layer for every agent** — decentralized persistent memory that makes context **portable across every runtime**, and traces **verifiable on Sui**.

---

## 2. Who it is for

- **Primary:** developers building with AI agents (Claude Code, Codex, OpenClaw, Hermes, MCP, Vercel AI SDK, LangChain, CrewAI).
- **Secondary:** the agents themselves — they are the literal user. When the reel shows "memory," it's *their* memory.

The reel is a launch tease on X. The viewer is mostly developers scrolling on mobile. They give it 2-3 seconds before deciding to watch or scroll. The first beat has to land.

---

## 3. Hard locks (do not change)

| Lock | Value |
|---|---|
| **Duration** | **Exactly 30.0 seconds.** Not 29, not 31. Both min and max. |
| **Resolution** | 1920 × 1080 (16:9), 30 fps. A 1:1 (1080×1080) cut may follow later; ignore for now. |
| **Voiceover** | **None.** No narration. Music + sound only. |
| **Domain shown** | **onemem.xyz** (not .ai, not .com, not .dev) |
| **On-screen copy** | The 7 lines in §5 must appear exactly. No paraphrasing. |
| **Final wordmark** | **OneMem** (single token, capital O, capital M) |

---

## 4. Palette + typography

These are guides, not orders. The designer can deviate if a stronger system emerges, **but**: do not introduce off-brand colors (no purple-magenta, no pure green, no orange). If a deeper choice is needed, push toward darker indigo / more restrained Sui-blue accent — never brighter or louder.

**Palette (current brand system):**
- Void / background — `#05060A`
- Deep / surface — `#0B0D12`
- Indigo primary — `#4F46E5` _(memory is indigo)_
- Indigo secondary — `#6366F1`
- Sui-blue accent — `#2BB7FF` _(chain affordance only — used sparingly to mean "this is on Sui")_
- Lime verify — `#C6FF4D` _(verification only — used sparingly, smaller than recall)_
- Cream type — `#F0EEE6`

**Typography (current brand system):**
- Display — Bricolage Grotesque, very tight tracking (-0.02em)
- Body — Hanken Grotesk
- Wordmark — Bricolage Grotesque, custom-kerned

---

## 5. The 30-second arc (text + intent)

Each beat is locked: the copy must appear exactly, in this order, at roughly these timings. The designer chooses how it appears. The intent column is the feeling — not a how-to.

| Beat | Time | On-screen (exact) | Intent |
|---|---|---|---|
| 1 | 0.0 – 4.0s | **Every agent learns.** | Open quiet. Establish a single agent absorbing context. No music swell yet. |
| 2 | 4.0 – 8.0s | **Most agents forget alone.** | Loneliness. The agent's context is stranded. Visual feeling: isolation, decay. |
| 3 | 8.0 – 13.0s | **Memory is trapped. Switch tools and your agent forgets everything.** | The wall. Why the problem is unsolved today: silos. Tools change, memory dies. |
| 4 | 13.0 – 18.0s | **OneMem gives them a shared memory layer.** | **Pivot moment.** First introduction of the product. Memory becomes shared. Indigo dominant. |
| 5 | 18.0 – 23.0s | **Portable across Claude Code, Codex, OpenClaw, Hermes, MCP.** | Proof of breadth. Show the runtime names. These are real integrations. |
| 6 | 23.0 – 27.0s | **Owned. Encrypted. Anchored on Sui.** | Trust + chain. Sui-blue enters here. One small lime verification accent — quieter than the recall accent. |
| 7 | 27.0 – 30.0s | **OneMem — one memory layer for every agent.   onemem.xyz** | Wordmark lockup. Domain. End on rest. No outro sting. |

**Total runtime: 30.0 seconds exactly.**

---

## 6. Tone

| ✅ Tone we want | ❌ Tone we do not want |
|---|---|
| Quiet, confident, computational | Trailer / hype / "the future is here" |
| Apple product-film restraint, Linear launch, Vercel AI SDK reveal | Crypto bro, NFT mint, web3 explainer |
| Substrate-first — let motion carry meaning | Slide-after-slide of stock typography |
| Indigo dominant, Sui-blue restrained, lime smaller still | Rainbow gradients, neon glow walls |
| Cinematic, breathable, finite | Loud, dense, exhausting |

---

## 7. What the reel must NOT claim _(critical — these are false today)_

Every item below was flagged by a verbatim-citation audit of the codebase. The reel must not imply or show any of these:

- **No "Etherscan for AI agents" framing.** OneMem is memory-first. Verification is the confidence layer, never the headline.
- **No "verify your agent" / "stop trusting agents" framing.** The product is about giving agents shared memory, not auditing them.
- **No claim of real MemWal semantic recall.** Mocked in v0.2 demos.
- **No claim of real Seal decryption in-line in the reel.** Mocked in v0.2 demos.
- **No claim of real Walrus plaintext retrieval.** Mocked.
- **No claim of real payment execution, real model honesty, or real tool-execution fidelity.** Out of scope for OneMem; out of scope for this reel.
- **No claim of full TS / Python SDK parity.** Python is a read-only verifier in v0.2. Write-path is TS-only.
- **No claim of mainnet deployment.** Currently testnet. If a chain affordance is shown, do not put "mainnet" on screen.
- **No claim that all 9+ framework providers are production-ready.** The 5 names in beat 5 are the only ones to show.
- **No `.ai` domain.** It's **onemem.xyz**.
- **No brain, no coin, no chatbot bubble, no faceless mascot, no generic "AI" iconography.** OneMem is infrastructure, not a chatbot.
- **No voiceover, no big risers, no white-noise crashes, no trailer impacts.** Audio direction in §8.

---

## 8. Audio direction (the designer won't author this — see Sound Libraries doc)

We need music + light sound design only. **No voiceover.** Pull from one of the libraries in `2026-06-19-onemem-30s-reel-sound-libraries.md`.

**What we want — describe to a sound library search:**

| Field | Value |
|---|---|
| Mood | Quiet, modern, restrained, cinematic, arp-driven |
| Tempo | 90 – 95 BPM (92 BPM ideal) |
| Key / mode | A minor, ideally resolving to a C major lift around 27s. (Or any minor key with a major-key resolution at the end.) |
| Length | Exactly 30 seconds, or trimmable to 30 with a clean fade-out on the last note |
| Instrumentation | Soft analog-style arpeggio (Prophet / Juno pad), muted felt piano, subtle sub bass pulse, light granular texture |
| Drums | **None** after the first 8 seconds, except a low heartbeat kick if it stays under everything |
| What we do NOT want | Drums in the first 8s · risers · white-noise crashes · trailer impacts · vocal chops · EDM drops · "epic" |

**Reference aesthetic** (this is the lineage — these are the names to search for or aim *near*):

- Jon Hopkins — ambient interludes
- Nils Frahm — felt piano
- Tycho — restrained arps
- Apple — Vision Pro reveal underscore
- Linear — app launch reels
- Pilotpriest — cinematic synth
- Hans Zimmer — restrained, not big

**Sound-design accents (optional, only if they don't clutter):**

- One soft click / detent when the product name first appears (beat 4)
- One quiet verification chime around 24.5s. **Important:** this verification accent must be *quieter* than any recall accent — memory is the hero, proof is the confidence layer.

---

## 9. Hand-off package the designer should produce

When the designer hands the reel back, they should provide:

1. **Final master MP4** — 1920×1080, 30 fps, H.264, ≤ 40 MB (X-friendly).
2. **Bare picture (no audio) MP4** — in case we want to swap the audio.
3. **1:1 (1080×1080) cut** — same picture, square reflow, same audio. Used for some X clients + Instagram.
4. **Source file** — After Effects / Motion / Figma Make / whatever they used. Includes the audio track they licensed.
5. **Audio source + license** — file + a note saying what library it came from + the license terms.

---

## 10. What the designer should read on the way in

To understand the product without us paraphrasing:

1. `onemem/.thoughts/design/2026-06-18-onemem-emotional-video-brief.md` — the emotional read of what the product is. Read this first.
2. `onemem/packages/brand/briefs/one-mem-full-brand-and-asset-brief.md` — official brand + asset brief.
3. `onemem/packages/brand/designer-campaign/README.md` — the campaign-team README; ground truth for tone.
4. `onemem/apps/landing/app/landing-content.ts` — the landing-page copy, lines 1–80; voice and word choice.
5. `onemem/README.md` — the project README; what we say publicly.

If they want the technical underpinnings (so they can avoid making something that contradicts the product):

- `onemem/contracts/onemem/README.md` — what's on-chain.
- `onemem/packages/sdk-ts/README.md` — what a developer wraps.
- `onemem/demos/README.md` — what we actually demo today on testnet.

---

## 11. Acceptance checklist

Before we ship, the reel must pass every line:

- [ ] Exactly 30.0 seconds.
- [ ] All 7 on-screen text lines appear in order, verbatim, with no extra lines.
- [ ] Domain shown is **onemem.xyz**.
- [ ] No voiceover.
- [ ] Music is licensed; license terms attached.
- [ ] No item in §7 ("must NOT claim") is present.
- [ ] Audio peaks below −1 dBTP, integrated loudness around −14 LUFS (X spec).
- [ ] H.264, 1080p, ≤ 40 MB master.
- [ ] 1:1 alternate cut delivered.
- [ ] Source file delivered.

---

_End of brief._
