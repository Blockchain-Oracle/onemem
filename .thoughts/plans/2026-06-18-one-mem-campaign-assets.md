# Plan: OneMem Campaign Brand Assets

## Inputs

- Approved creative direction: Memory Infrastructure / Vault Grid as the main system, Runtime Constellation for tools, Proof Receipt for motion/demo emphasis.
- Product research: `.thoughts/research/2026-06-18-onemem-product-code-audit.md`.
- Existing brand prompt: `.thoughts/design/2026-06-18-social-brand-kit-prompt.md`.
- Vendor logo inventory: `packages/brand/vendor-logos/manifest.json`.
- Brand tokens: `packages/brand/tokens.css`.
- Dashboard palette: `packages/dashboard/tailwind.config.ts`.
- Existing brand package and tests: `packages/brand/` and `tests/structure/brand-assets.test.ts`.

## Assumptions

- Campaign assets should be additive and live under `packages/brand/campaign/`.
- Existing `packages/brand/og-images/` assets should not be overwritten in this pass.
- SVG should be the source of truth; PNG is a platform-ready export generated from SVG.
- Link-card copy can include the campaign domain and target docs URL, but README notes must keep deployment status honest.
- Confirmed public packages at planning time:
  - npm: `@onemem/sdk-ts`, `@onemem/mcp`.
  - PyPI: `hermes-onemem`, `onemem-crewai`, `onemem-livekit`, `onemem-elevenlabs`.
- `@onemem/cli` and `onemem-sdk-python` should not be presented as already public unless a later registry check confirms publication.

## Open Questions

- Whether `docs.onemem.ai` is the final public docs domain or only the target domain.
- Whether `onememe.xyz` is already live by the time assets are published.
- Whether a Discord-specific campaign banner is needed beyond the existing brand `discord-banner` asset.

## Phase 1: Campaign Source Layer

### Goal

Create a maintainable campaign asset source so designers and agents can regenerate the visuals consistently.

### Work

- Add `packages/brand/campaign/generate-campaign-assets.mjs`.
- Define shared palette, typography, logo mark, grid, chip, and flow helpers.
- Read vendor logo SVGs from `packages/brand/vendor-logos/`.
- Generate source SVGs:
  - `readme-hero.svg`
  - `x-header.svg`
  - `link-card.svg`
  - `tools-grid.svg`
  - `architecture.svg`
  - `motion-storyboard.svg`

### Checks

- Run the generator.
- Confirm every SVG exists, has fixed dimensions, closes the root SVG, and contains OneMem identity.

### Acceptance Criteria Covered

- README banner exists.
- X/social header exists.
- Link card exists.
- Tools/integration visual exists.
- Designed architecture SVG exists.
- Motion-ready storyboard exists.

### Stop Condition

All generated SVGs are present and renderable.

## Phase 2: Package Integration

### Goal

Make campaign assets discoverable through the brand package.

### Work

- Add `packages/brand/campaign/README.md`.
- Export `./campaign/*` from `packages/brand/package.json`.
- Include `campaign` in the brand package files list.
- Update `packages/brand/README.md` with the new asset inventory and usage boundary.

### Checks

- Read package JSON to confirm export shape.
- Run structure tests.

### Acceptance Criteria Covered

- Future agents and designers can find assets without asking.
- Assets are included in package publication.

### Stop Condition

Brand README and package metadata point at the campaign folder.

## Phase 3: Raster Exports

### Goal

Create platform-ready PNGs beside each SVG.

### Work

- Use `rsvg-convert` to export each SVG at its source dimensions.
- Keep SVGs as source of truth.

### Checks

- Validate PNG signatures and dimensions through structure tests.

### Acceptance Criteria Covered

- Assets can be uploaded directly to social/platform surfaces.

### Stop Condition

Every campaign PNG exists with matching dimensions.

## Phase 4: Verification

### Goal

Prove the campaign layer is not broken and does not regress the existing brand package.

### Work

- Extend `tests/structure/brand-assets.test.ts` for campaign exports/assets.
- Run `npx --yes pnpm@10.33.0 test:structure`.
- Inspect generated SVGs or PNGs visually if needed.

### Checks

- Structure tests pass.
- Generated assets include corrected product framing.
- No generated copy says OpenClaude or leads with verify-only positioning.

### Acceptance Criteria Covered

- The campaign asset system is verifiable and maintainable.

### Stop Condition

Tests pass and the final file list is ready to hand to Abu/designer agents.

## Verification Checkpoint

Before completion:

- Re-run the generator once.
- Re-export PNGs.
- Run structure tests.
- Confirm `git diff --stat` shows only scoped brand/docs/test changes plus existing unrelated dirty files.

## Handoff Notes

Future motion work should start from `motion-storyboard.svg`, then use HyperFrames for a fast GSAP/HTML launch bumper or Remotion for a parameterized React video if a longer demo intro is needed.
