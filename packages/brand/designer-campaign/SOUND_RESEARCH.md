# OneMem Launch Sound Research

Research checked: 2026-06-19.

This note connects the downloaded designer audio spec with current sourcing and
platform constraints. The current launch export is intentionally silent because
two sound directions were rejected.

## Source Direction

Use the downloaded spec at
`video/OneMem Launch Video - Audio Spec.md` as a visual timing reference only.
The original pulse/click language in that spec is not the current audio
direction.

Current direction:

- natural, non-rhythmic ambient texture;
- no drums, beat grid, tempo, looped pulse, repeated click, or "chew-chew"
  pattern;
- no synthetic UI tick track under the animation;
- soft movement from air, wind, room tone, or drone-like texture;
- gentle fades only, with no loud trailer impacts;
- no voiceover in the first cut.

The three reference videos in the raw package are benchmarks only. Do not ship,
sample, or recreate their audio too closely.

The generated benchmark at `REFERENCE_BENCHMARK.generated.md` measures those
three reference videos directly from the raw zip and compares them with the
current OneMem launch MP4. Keep that benchmark as the factual basis for pacing
and loudness decisions.

## Rejected Attempts

- Rejected attempt 1: generated technology score with mechanical pulse,
  memory-write clicks, and beat-like repeated transient movement. Abu rejected
  it because it sounded like a repetitive "chew-chew" beat.
- Rejected attempt 2: CC0 BigSoundBank wind-in-tall-grass ambience. Abu still
  disliked the result, so it was removed from the launch export. Do not restore
  it without explicit approval.
- Current package state: `audio/onemem-launch-bed.wav` is 30 seconds of digital
  silence and `exports/video/onemem-launch-30s.mp4` is rendered with that silent
  placeholder.

## Online Research Notes

- BigSoundBank's "Wind in Tall Grass" recording is published as CC0 / public
  domain equivalent, with no account required, and its FAQ explicitly permits
  editing, remixing, transforming, redistributing, and commercial use. This
  source was tested and rejected for OneMem's launch export:
  <https://bigsoundbank.com/wind-in-tall-grass-s0908.html>
- 99Sounds' Red Fog drone library describes the useful direction for this cut:
  ambient drones and textures with "no beats" and "no rhythm." It is a
  benchmark for restraint only, not a shipped sample source:
  <https://99sounds.org/drones/>
- Material Design frames product audio as sound design, music, and voice, each
  serving a different role in communicating state and identity:
  <https://m2.material.io/design/sound/about-sound.html>
- Google Design's Material sound/haptics retrospective emphasizes that
  micro-interaction sounds should be functional, restrained, and tied to a
  clear user-facing signal. It also frames generated audio as raw material or a
  mood board, not a thing to recreate verbatim:
  <https://design.google/library/ux-sound-haptic-material-design>
- X Media Studio upload specs call for H.264/AVC video and stereo or mono AAC
  LC audio, with 1280 x 720 recommended for landscape and 720 x 720 for square:
  <https://help.x.com/en/using-x/media-studio-faqs>
- Pixabay's content license summary allows free use without required
  attribution and allows modification, while its FAQ warns that music
  distribution and platform claims can carry extra responsibilities:
  <https://pixabay.com/service/license-summary/> and
  <https://pixabay.com/service/faq/>
- ElevenLabs is not used for the current launch bed. The current bed is digital
  silence until a better researched source is approved.

## Recommended Scoring Path

1. Research before sourcing: collect 5-10 strong examples of non-rhythmic
   brand/product ambience and explain why each works.
2. Prefer a clean atmospheric bed, room tone, low drone, airy texture, or
   cinematic non-music ambience over a stock music track.
3. Reject tempo language entirely: no BPM, no pulse, no click loop, no repeated
   transient pattern.
4. Treat the visuals as the information layer; the audio should support the
   mood without trying to narrate each UI event.
5. Master the public social render separately from the source WAV: target about
   `-14` to `-10` LUFS integrated, with true peak below `-1 dBTP`.
6. Export public video as H.264 MP4 with AAC audio for X.

## Prompt Seed

Use this when sourcing or generating another replacement:

```text
Create or source a 30-second natural ambient bed for OneMem, a decentralized
persistent memory layer for AI agents. Mood: calm infrastructure, warm trust,
quiet continuity. No beat, no BPM, no drums, no click loop, no mechanical pulse,
no repeated "chew-chew" transient, no obvious melody, no vocals, no trailer
impact. Use soft air, wind, room tone, or drone-like texture with slow organic
movement. Let the visuals carry the product explanation. Leave headroom for
captions and UI.
```

## Claude Research Brief

Claude should not pick the first royalty-free track that matches "ambient."
The next pass should:

1. Research non-rhythmic product-launch ambience and sound-design references.
2. Prefer downloadable, commercially usable sources with clear license terms.
3. Avoid anything tagged corporate, technology beat, chill beat, lofi, trailer,
   cyberpunk, click, pulse, BPM, or percussion.
4. Produce 2-3 candidate source links with license notes before editing the
   package audio.
5. If no source is suitable, leave the current silent placeholder in place and
   propose a composer/generation prompt instead.

## Production Boundary

Save the final source URL/license, processing notes, file hash, and final render
loudness before treating the audio as public-release ready.
