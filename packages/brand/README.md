# @onemem/brand

Shared OneMem brand assets: CSS variable tokens, logo SVGs, font slots,
and social/OG image source templates.

Consumed by `@onemem/dashboard`, `apps/landing`, `apps/hosted-dashboard`, and the docs site.

See `docs/02-inspirations/BRAND_AND_SURFACES.md` for the canonical brand spec.

## Public Identity

- Product: OneMem
- Public domain for the current social campaign: `onememe.xyz`
- X handle: `@OneMemAI`
- Motto: "Every memory. Every action. Proven."
- Sharper social line: "Stop trusting agents. Verify them."

## Assets

Logo SVGs live in `logo/`:

- `onemem-mark.svg`
- `onemem-mark-mono.svg`
- `onemem-wordmark.svg`
- `onemem-lockup-horizontal.svg`
- `onemem-lockup-dark.svg`
- `onemem-lockup-light.svg`

Social and OG SVG source assets live in `og-images/`:

- `x-banner.svg` - 1500 x 500
- `discord-banner.svg` - 1920 x 480
- `github-og.svg` - 1200 x 630
- `product-card.svg` - 1080 x 1080
- `demo-video-cover.svg` - 1920 x 1080

These are source-controlled SVG source assets. PNG exports should be generated
from these files when a platform requires raster uploads; do not hand-edit raster
copies as the source of truth.

## Usage Rules

- Violet/indigo is the memory and trace identity.
- Lime is reserved for verified/decrypted/proof-passed moments.
- Sui blue is reserved for chain or explorer affordances.
- Keep social assets dark, technical, and proof-oriented; avoid generic AI
  gradients, brains, and abstract blob decoration.
