# Handoff: OneMem Launch Sound For Claude

## Objective

Find and prepare the right sound direction for the OneMem 30-second launch
video. Abu rejected the previous audio attempts. The current launch export is
intentionally silent until a better researched source/direction is approved.

## Current State

OneMem is a decentralized persistent memory layer for AI agents. It is not a
generic "verify agents" product and not a Mem0 clone. The product angle is:
decentralize the memory layer that agent runtimes depend on, using Sui for
verifiable namespaces/capabilities/traces, Walrus/blob storage, Seal/encryption
paths, SDKs, CLI, MCP, and runtime integrations.

Current public identity:

- Domain: `onemem.xyz`
- Docs: `docs.onemem.xyz`
- X: `x.com/OneMemAI`
- Motto: `One memory layer for every agent.`
- Social line: `Decentralized persistent memory for AI agents.`
- Required spelling: `OpenClaw`.

The launch video currently lives at
`packages/brand/designer-campaign/exports/video/onemem-launch-30s.mp4`.
It is a 1920 x 1080, 30 fps, 30-second render from the designer campaign HTML.
It currently has silent placeholder audio.

The source audio target is
`packages/brand/designer-campaign/audio/onemem-launch-bed.wav`. It is currently
30 seconds of stereo 48 kHz digital silence. Replace this file only after the
sound source/license/direction is documented.

## Key Decisions

- Remove the current disliked sound from the public launch video now.
- Keep a silent WAV placeholder instead of deleting the file so existing export
  tooling and media-kit indexing continue to work.
- Do not use ElevenLabs for this pass.
- Do not restore the generated mechanical pulse/click bed.
- Do not restore the CC0 BigSoundBank wind ambience attempt without explicit
  approval.
- Reference videos inside the raw zip are visual/pacing references only. Do not
  sample, remix, or recreate their audio.

## Rejected Audio History

1. Generated technology score with mechanical pulse, memory-write clicks, and
   repeated beat-like transient movement. Abu described it as a repetitive
   "chew-chew" beat and rejected it.
2. CC0 BigSoundBank `Wind in Tall Grass` ambience. It removed the beat, but Abu
   still disliked the sound and asked for it to be removed.

## Artifacts

- `packages/brand/designer-campaign/SOUND_RESEARCH.md` - current sound brief,
  rejected history, source notes, platform constraints, and Claude research
  brief.
- `packages/brand/designer-campaign/AUDIO_PROVENANCE.generated.md` - current
  audio/video hashes, loudness, and rejected-sound boundary.
- `packages/brand/designer-campaign/audio-provenance.generated.json` -
  machine-readable provenance.
- `packages/brand/designer-campaign/REFERENCE_BENCHMARK.generated.md` -
  measured reference video benchmark.
- `packages/brand/designer-campaign/raw/one-mem-campaign-source.zip` - designer
  source package. It contains the three reference videos and runnable HTML.
- `packages/brand/media-kit/onemem-media-kit.generated.md` - generated public
  asset index.
- `packages/brand/ASSET_CLEANUP.md` - canonical/stale asset boundary.

Useful external research links already noted:

- BigSoundBank rejected source:
  <https://bigsoundbank.com/wind-in-tall-grass-s0908.html>
- 99Sounds drone/no-rhythm reference:
  <https://99sounds.org/drones/>
- Google sound/haptics restraint:
  <https://design.google/library/ux-sound-haptic-material-design>
- X Media Studio specs:
  <https://help.x.com/en/using-x/media-studio-faqs>
- Pixabay license/FAQ:
  <https://pixabay.com/service/license-summary/> and
  <https://pixabay.com/service/faq/>

## Files Changed

- `packages/brand/designer-campaign/audio/onemem-launch-bed.wav` is now silent.
- `packages/brand/designer-campaign/exports/video/onemem-launch-30s.mp4` was
  regenerated with silent placeholder audio.
- `packages/brand/designer-campaign/SOUND_RESEARCH.md` records rejected sound
  directions and the new Claude research brief.
- `packages/brand/designer-campaign/scripts/generate-audio-provenance.mjs`
  records silent placeholder provenance and rejected sound notes.
- `packages/brand/designer-campaign/scripts/generate-reference-benchmark.mjs`
  records the launch export as silent pending replacement.
- `packages/brand/designer-campaign/README.md`,
  `packages/brand/ASSET_CLEANUP.md`, and
  `packages/brand/media-kit/generate-media-kit.mjs` describe the current audio
  as a silent placeholder.

## Commands And Results

Use these commands after changing audio:

```sh
cd packages/brand
npm run designer-campaign:export -- --all
npm run designer-campaign:audio-provenance
npm run designer-campaign:benchmark
npm run media-kit:generate
```

Then refresh hashes in `packages/brand/designer-campaign/manifest.json` if any
tracked files changed.

Verification command:

```sh
npx --yes pnpm@10.33.0 test:structure
```

Latest pre-handoff verification before this handoff: full structure suite had
passed before the silent placeholder change. Re-run it after the generated docs
and tests are refreshed.

## Open Questions

- Should the final sound be pure atmosphere, a very low drone, room tone, or a
  sparse designed soundscape?
- Does Abu want any audible cue at the recall/success moment, or should the
  whole bed stay non-event-based?
- Should the final candidate be a licensed stock source, a composer-like custom
  generation prompt, or manually designed from public-domain/CC0 textures?

## Risks Or Blockers

- "Ambient technology" searches often return corporate beats, pulsing synths,
  or percussion. Avoid those.
- Many "royalty-free" sites require attribution, subscriptions, or platform
  claim handling. Record license details before using anything.
- The product is serious infrastructure, not a cyberpunk trailer. Avoid loud
  risers, glitch packs, dramatic impacts, and generic crypto hype.
- Natural field recordings can feel unrelated to the visual brand if they are
  too literal. The rejected wind attempt is the warning.

## Next Steps

1. Research 5-10 examples of non-rhythmic product-launch ambience or restrained
   technical sound design.
2. Shortlist 2-3 candidate sources with clear commercial usage/license terms.
3. Explain why each candidate fits OneMem and why it avoids the rejected beat
   problem.
4. Only after source approval, replace
   `packages/brand/designer-campaign/audio/onemem-launch-bed.wav`.
5. Re-render the launch video and regenerate provenance, benchmark, media kit,
   and manifest hashes.
6. Run the focused brand tests and full structure suite.

## Resume Prompt

Claude, continue OneMem launch-sound research from `.thoughts/handoffs/2026-06-19-onemem-launch-sound-claude.md`. The launch video is intentionally silent because Abu rejected both the generated pulse/click bed and the CC0 wind ambience attempt. Research better non-rhythmic, commercially usable sound sources for a 30-second OneMem launch video, avoid any beat/pulse/click-loop/corporate-tech track, present 2-3 licensed candidates with rationale first, then replace `packages/brand/designer-campaign/audio/onemem-launch-bed.wav` only after the direction is clear and regenerate the video/provenance/media kit/tests.
