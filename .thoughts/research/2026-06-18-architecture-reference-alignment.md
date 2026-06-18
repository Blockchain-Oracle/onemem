# Reality Research: Architecture Reference Alignment

## Scope

Current reality for references that summarize the `docs/05-our-architecture/`
tree after the architecture status refresh landed in commit `95c2243`.

## Sources Checked

- `docs/05-our-architecture/README.md`
- `docs/05-our-architecture/01-protocol/README.md`
- `docs/05-our-architecture/02-sdks/README.md`
- `docs/06-references/CANONICAL_URLS.md`
- `.thoughts/wiki/project-map.md`
- `.thoughts/wiki/context-engineering-status.md`
- `tests/structure/architecture-status.test.ts`

## Verified Facts

- The architecture overview now has a `Current Status Orientation` table.
- The protocol README now marks core Move pieces and testnet deployment as
  built/current, while preserving mainnet deployment as pending.
- The SDK README now separates the published TypeScript SDK from the
  source-built but unpublished Python SDK.
- `docs/06-references/CANONICAL_URLS.md` still describes
  `../05-our-architecture/*` as `design phase (not yet started)`.
- `.thoughts/wiki/project-map.md` still says older architecture docs contain
  design-phase pending status tables and should be treated as stale.

## Inferences

- The canonical URL map and project map are now stale for the current entry
  points because the architecture status refresh already replaced the most
  visible pending rows and added regression tests.
- A small structure guard can prevent those reference docs from drifting back to
  the old "not started" framing.

## Unknowns And Questions

- Some deep historical architecture or marketing pages may still contain valid
  future-work pending rows. This slice should not erase those unless they are
  proven stale against current code.

## Not Included

- No implementation changes.
- No registry publishing.
- No mainnet deployment.
