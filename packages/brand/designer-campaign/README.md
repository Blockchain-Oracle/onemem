# OneMem Designer Campaign Package

This folder contains the downloaded campaign package from
`/Users/abu/Downloads/One Mem (1).zip`.

It supersedes the old agent-generated `campaign/`, `og-images/`, and rendered
video outputs that were removed during cleanup. Use this package as the current
designer-provided campaign direction.

## What Is Here

- `raw/one-mem-campaign-source.zip` - exact downloaded source archive. It keeps
  the original runnable HTML package, including `kit/*.jsx`,
  `video/scenes.jsx`, `video/audio.jsx`, `animations.jsx`, uploads, logos, and
  design-system files.
- `html/Brand Kit.html` - browser canvas for the static campaign boards.
- `html/Launch Video.html` - silent 30-second launch animatic.
- `html/Sound Design.html` - visual audio beat-map.
- `html/OneMem Handoff Guide.html` - original package handoff.
- `video/OneMem Launch Video - Audio Spec.md` - plain-text audio beat map.
- `audio/onemem-launch-bed.wav` - intentionally silent 30-second placeholder
  used by the generated landscape MP4 after Abu rejected the prior sound beds.
- `AUDIO_PROVENANCE.generated.md` and `audio-provenance.generated.json` -
  hashes, loudness, and reference-only boundary for the kept audio bed.
- `SOUND_RESEARCH.md` - rejected sound history, online sourcing notes,
  platform constraints, and the next sound-research brief.
- `REFERENCE_BENCHMARK.generated.md` - measured benchmark notes for the three
  reference videos inside the raw zip plus the current OneMem launch MP4.
- `reference-benchmark.generated.json` - machine-readable benchmark metrics.
- `screenshots/*.png` - preview snapshots from the downloaded package. These
  are 924 x 540 previews, not final 1:1 export-resolution campaign assets.
- `exports/static/*.png` - exact-size generated exports from the Brand Kit HTML.
- `exports/video/onemem-launch-30s.mp4` - 1920 x 1080, 30fps launch video
  rendered from the Launch Video HTML and currently paired with silent
  placeholder audio.
- `exports/manifest.json` - generated export hashes, dimensions, source patch
  notes, and video/audio metadata.
- `scripts/export-designer-campaign.mjs` - reproducible browser/ffmpeg export
  script.
- `scripts/generate-audio-provenance.mjs` - probes the kept source WAV and
  launch MP4, then rewrites the audio provenance notes.
- `scripts/generate-reference-benchmark.mjs` - extracts reference MP4s to a
  temporary directory, measures them, and writes benchmark notes without
  checking third-party videos into the repo.

## Static Board Targets

The source archive defines these final board sizes inside the brand kit:

- README hero: 1280 x 420
- X header: 1500 x 500
- Link card: 1200 x 630
- Tools poster: 1600 x 900
- Architecture: 1920 x 1080

The checked-in generated exports are in `exports/static/`. Regenerate them
from the raw zip with:

```sh
cd packages/brand
npm run designer-campaign:export
```

Do not restore the old deleted `packages/brand/campaign/` images.

## Video Target

The source archive defines a 1920 x 1080, 30-second, six-beat launch animatic:

1. Agents forget
2. One namespace
3. Decentralized stack
4. Runtime proof
5. Runtime surface
6. Close

The raw HTML cut is silent. The checked-in generated landscape MP4 in
`exports/video/onemem-launch-30s.mp4` is also intentionally silent for now.
`audio/onemem-launch-bed.wav` is a silent placeholder that should be replaced
only after a researched sound source is approved.

Regenerate the full landscape MP4 from the raw zip with:

```sh
cd packages/brand
npm run designer-campaign:export -- --all
```

Create future square/vertical reframes from this designer campaign source,
not from the removed old video workspaces.

## Sound Boundary

The downloaded sound spec asks for an original score with a low mechanical
pulse, memory-write clicks, encrypted sweep, one success tone at recall, no
loud trailer impacts, and no voiceover in the first cut. That pulse/click
direction is not approved for the current OneMem public export.

Two sound passes were rejected:

- a generated technology bed with repetitive beat-like pulse/click movement;
- a CC0 wind ambience pass that still did not fit.

The current MP4 is silent pending deeper research. The next sound pass should
start from `SOUND_RESEARCH.md` and the Claude handoff in
`.thoughts/handoffs/2026-06-19-onemem-launch-sound-claude.md`.

Reference videos are benchmark inputs only. Do not ship or sample their audio.
Run `npm run designer-campaign:benchmark` after changing the raw zip or launch
export to refresh the measured comparison.

Run `npm run designer-campaign:audio-provenance` after replacing the source
WAV or launch MP4.

## How To Run The Exact Package

To run the original package with filenames intact, extract the zip outside the
repo or into a temporary ignored directory:

```sh
mkdir -p /tmp/onemem-campaign-source
unzip -o packages/brand/designer-campaign/raw/one-mem-campaign-source.zip -d /tmp/onemem-campaign-source
cd /tmp/onemem-campaign-source
python3 -m http.server 4177
```

Then open:

- `http://127.0.0.1:4177/Brand%20Kit.html`
- `http://127.0.0.1:4177/Launch%20Video.html`
- `http://127.0.0.1:4177/Sound%20Design.html`
- `http://127.0.0.1:4177/OneMem%20Handoff%20Guide.html`

The exact `.jsx` files stay inside the zip so the monorepo source-file line cap
does not treat downloaded vendor/source material as native code.

## Copy Rules

- Use `onemem.xyz`, `docs.onemem.xyz`, and `x.com/OneMemAI`.
- Use OpenClaw spelling.
- Keep memory as the headline and proof as the confidence layer.
- Do not claim shipped WASI, Nautilus, or TEE behavior without implementation
  evidence.
