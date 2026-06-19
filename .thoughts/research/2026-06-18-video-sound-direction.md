# Research: OneMem Video Sound Direction

## Decision

Use a restrained warm-technology bed for the 30-second demo and the HyperFrames
intro:

- Ambient/electronic base, not cinematic trailer music.
- Subtle pulse to keep motion alive without fighting future narration.
- Small scene-change chimes around the timeline cuts.
- No vocals, no lyrics, no harsh EDM, no famous/reference-artist styling.

## Research Notes

- Vidyard's background-music guidance frames demo/explainer music as subtle
  support for attention, with ambient/electronic tones fitting business and
  technical content. It also calls out short bookends as useful branding cues.
  Source: https://www.vidyard.com/blog/background-music-for-video/
- Material Design's UI sound guidance treats audio cues as tied to interactions
  or state changes. For OneMem, that maps to lightweight chimes on scene changes
  instead of a busy constant sound-effects track.
  Source: https://m2.material.io/design/sound/applying-sound-to-ui.html
- Pixabay's product-music catalog confirms the common search language for this
  category: product demo, product launch, product presentation, and background.
  Source: https://pixabay.com/music/search/product/
- Good Design Australia's UX sound overview frames sound design as a palette of
  edited/mixed stimuli that shapes action, emotion, and understanding. For this
  demo, the palette should make memory persistence feel calm and credible.
  Source: https://good-design.org/sound-design-immersive-ux/

## Implementation

Tried ElevenLabs music generation first because `ELEVENLABS_API_KEY` is present,
but the request returned HTTP 402. To avoid leaving the weak old bed in place,
I added a deterministic local generator:

- `packages/brand/video/scripts/generate-product-bed.mjs`
- `packages/brand/video/onemem-demo/public/audio/onemem-demo-bed.wav`
- `packages/brand/video/onemem-intro/assets/audio/onemem-intro-bed.wav`

The generated beds measure around `-23 dB` mean / `-2.6 dB` max before video
mixing. The rendered 30-second Remotion demo measures around `-25 dB` mean /
`-4.4 dB` max, leaving room for later voiceover.
