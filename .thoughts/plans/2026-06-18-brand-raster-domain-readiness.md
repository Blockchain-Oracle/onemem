# Plan: Brand Raster And Domain Readiness

## Inputs

- Reality research:
  `.thoughts/research/2026-06-18-brand-raster-domain-readiness.md`
- Previous brand plan:
  `.thoughts/plans/2026-06-18-brand-assets-package-readiness.md`
- Previous brand verification:
  `.thoughts/verification/2026-06-18-brand-assets-package-readiness.md`
- Brand package:
  `packages/brand/package.json`, `packages/brand/README.md`,
  `packages/brand/logo/`, `packages/brand/og-images/`
- Guardrail:
  `tests/structure/brand-assets.test.ts`

## Assumptions

- The SVG files remain the source of truth.
- PNG exports are committed platform deliverables, not manually edited design
  sources.
- `onememe.xyz` is the correct public campaign identity, but it is not live
  until DNS resolves.

## Open Questions

- Final submission-specific image/video requirements remain unknown.
- DNS ownership and hosting provider for `onememe.xyz` are not known from this
  checkout.

## Phase 1: Raster Exports

### Goal

Add platform-ready PNG files corresponding to the existing social/OG SVG source
assets.

### Work

- Render PNG exports from the five SVG files under `packages/brand/og-images/`.
- Keep filenames parallel: `x-banner.png`, `discord-banner.png`,
  `github-og.png`, `product-card.png`, `demo-video-cover.png`.

### Checks

- `file packages/brand/og-images/*.png`
- `sips -g pixelWidth -g pixelHeight packages/brand/og-images/*.png`
- Structure test reads PNG headers for dimensions.

### Acceptance Criteria Covered

- Brand package contains source SVGs and platform-ready PNG exports.
- PNG dimensions match the SVG source checklist.

### Stop Condition

- PNG files exist, render, and are covered by CI-friendly tests.

## Phase 2: Package And Docs Boundary

### Goal

Make the package and docs honest about source SVGs, PNG exports, and DNS state.

### Work

- Update `packages/brand/README.md` with PNG inventory.
- Update current marketing/docs or Context Engineering status to say
  `onememe.xyz` currently does not resolve.

### Checks

- Structure test confirms README lists PNG exports.
- `curl`/`dig` evidence is captured in verification.

### Acceptance Criteria Covered

- Future agents do not confuse campaign identity with deployed domain state.

### Stop Condition

- Docs match current package inventory and domain reality.

## Phase 3: Guardrail

### Goal

Prevent raster assets from disappearing or drifting silently.

### Work

- Extend `tests/structure/brand-assets.test.ts` to assert PNG files exist,
  have valid PNG signatures, and match expected dimensions.

### Checks

- `mise exec -- pnpm exec tsx --test tests/structure/brand-assets.test.ts`
- `mise exec -- pnpm test:structure`
- `mise exec -- pnpm --filter @onemem/brand pack --dry-run`
- `git diff --check`

### Acceptance Criteria Covered

- CI protects both source and platform-ready brand assets.

### Stop Condition

- Local and remote checks pass.

## Verification Checkpoint

Write a verification audit after implementation and before claiming the slice is
complete.

## Handoff Notes

This slice does not configure DNS, deploy the landing page, create social
accounts, or render video. It only makes the brand package upload-ready for
static image assets and records the domain truth.
