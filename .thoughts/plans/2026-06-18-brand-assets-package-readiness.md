# Plan: Brand Assets Package Readiness

## Inputs

- Reality research: `.thoughts/research/2026-06-18-sui-overflow-brand-presence.md`
- Design prompt: `.thoughts/design/2026-06-18-social-brand-kit-prompt.md`
- Existing brand contract: `packages/brand/package.json`, `packages/brand/tokens.css`, `docs/02-inspirations/BRAND_AND_SURFACES.md`
- Existing app marks: `packages/dashboard/public/favicon.svg`, `apps/hosted-dashboard/app/icon.svg`, `packages/dashboard/components/AppShell.tsx`
- External Sui reference dropped by Abu: `contract-hero/sui-pilot`

## Assumptions

- This slice should make the repo honest and publishable, not create a final agency-grade identity system.
- Deterministic SVG source assets are better than opaque generated rasters for this package pass.
- The active public social identity is `onememe.xyz` and `@OneMemAI`.

## Open Questions

- Whether `onememe.xyz` is already DNS-hosted.
- Whether final submission requires raster PNG uploads in fixed dimensions.
- Whether the inline dashboard lockbox mark should be replaced by the cube mark in a later UI consistency pass.

## Phase 1: Canonical Assets

### Goal

Populate the empty brand export directories with reviewable OneMem logo and social image source assets.

### Work

- Add logo SVGs under `packages/brand/logo/`.
- Add social/OG SVG templates under `packages/brand/og-images/`.
- Keep lime reserved for verification moments and Sui blue reserved for chain links.

### Checks

- SVG files exist, are non-empty, and contain valid root `<svg>` tags.
- Logo assets include the existing cube memory/chain mark.
- Social assets include `onememe.xyz`, `@OneMemAI`, and the verification motto.

### Acceptance Criteria Covered

- `@onemem/brand` no longer advertises empty `logo/*` and `og-images/*` exports.
- Assets are deterministic, source-controlled, and usable by landing/docs/social surfaces.

### Stop Condition

- Required files exist and structure tests enforce the inventory.

## Phase 2: Documentation Contract

### Goal

Make the current package boundary and public identity clear.

### Work

- Update `packages/brand/README.md` with inventory and usage rules.
- Update marketing/docs status to distinguish implemented source assets from pending live social/DNS work.

### Checks

- Docs mention current source assets and do not claim final published social accounts or deployed domains.

### Acceptance Criteria Covered

- Future agents can tell what exists, what is pending, and which files are canonical.

### Stop Condition

- Documentation matches file inventory and current reality.

## Phase 3: Guardrail

### Goal

Prevent this package from regressing back to empty advertised exports.

### Work

- Add a structure test for brand asset inventory, dimensions, and public identity strings.

### Checks

- `pnpm exec tsx --test tests/structure/brand-assets.test.ts`
- `pnpm test:structure`
- `git diff --check`

### Acceptance Criteria Covered

- CI catches missing or placeholder brand assets before publishing.

### Stop Condition

- Local structure gates pass.

## Verification Checkpoint

Run a verification audit after implementation using the plan, changed files, and test output.

## Handoff Notes

This slice does not generate final PNG exports, deploy DNS, create social accounts, or replace app UI marks. Those remain separate slices.
