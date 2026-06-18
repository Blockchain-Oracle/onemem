# Plan: Walrus Static Verifier Shell

## Inputs

- Reality research:
  `.thoughts/research/2026-06-18-walrus-static-verifier-shell.md`
- Prior Walrus deploy readiness plan and verification:
  `.thoughts/plans/2026-06-18-walrus-sites-deploy-readiness.md`
  `.thoughts/verification/2026-06-18-walrus-sites-deploy-readiness.md`
- Current docs:
  `apps/hosted-dashboard/walrus-sites/README.md`
  `docs/05-our-architecture/06-dashboard/walrus-sites-mirror.md`
- Current verifier implementation:
  `apps/hosted-dashboard/lib/public-verify.ts`
  `packages/sdk-ts/src/traces.ts`
  `packages/sdk-ts/src/fetchers/trace.ts`
- Network manifest: `config/networks.json`

## Assumptions

- The first Walrus Sites mirror artifact should optimize for the public verify
  route, not the full hosted dashboard.
- The shell should be dependency-free static HTML/CSS/JS so Walrus Sites can
  deploy it directly.
- Testnet is the only enabled network until mainnet addresses exist.

## Open Questions

- Live deployment requires funded Walrus/Sui environment and is not covered by
  this source slice.
- Browser CORS behavior against public Sui fullnodes should be manually checked
  after the static shell is served.

## Phase 1: Static Artifact

### Goal

Create a checked-in static verifier artifact with `index.html`.

### Work

- Add `apps/hosted-dashboard/walrus-sites/verifier/index.html`.
- Add local CSS and JavaScript assets.
- Add a `ws-resources.json` file with content-type headers and a `/verify`
  route pointing to the shell.

### Checks

- Artifact directory contains `index.html`.
- No external runtime dependencies are needed.
- The shell contains no fake success state.

### Acceptance Criteria Covered

- There is a real static artifact directory for Walrus Sites.

### Stop Condition

- `scripts/deploy-walrus-sites.sh --check` succeeds against the default
  artifact.

## Phase 2: Client Verifier

### Goal

Run real chain-integrity verification from the static shell.

### Work

- Implement raw Sui JSON-RPC calls to `sui_getObject` and `suix_queryEvents`.
- Parse TraceSession fields and ActionCall emitted events.
- Recompute the Merkle root using browser SHA-256.
- Render expected root, computed root, call count, evidence count, and proof
  boundary copy.

### Checks

- Static structure tests assert use of JSON-RPC, `crypto.subtle.digest`, package
  ID, and proof-boundary copy.
- Local server smoke loads the artifact.

### Acceptance Criteria Covered

- The shell performs a real client-side verification attempt, not a redirect.

### Stop Condition

- Static artifact tests pass and local smoke confirms files are served.

## Phase 3: Deploy Defaults And Docs

### Goal

Make the checked-in verifier shell the default Walrus Sites artifact.

### Work

- Update `scripts/deploy-walrus-sites.sh` default `DIST`.
- Update `.github/workflows/deploy-walrus-sites.yml` default `dist` and remove
  the obsolete hosted-dashboard build dependency from the default path.
- Update Walrus Sites docs and status artifacts.

### Checks

- `bash scripts/deploy-walrus-sites.sh --check` succeeds by default.
- `mise exec -- pnpm test:structure` passes.
- `git diff --check` passes.

### Acceptance Criteria Covered

- Manual workflow and local deploy script point at a real artifact by default.

### Stop Condition

- Verification audit records local, structural, and remote evidence.

## Verification Checkpoint

Write a verification audit before completion. Do not claim live Walrus
deployment until `site-builder` returns a real site object and URL.

## Handoff Notes

The full hosted dashboard static export remains a future architecture slice.
This plan intentionally ships the smaller public verifier shell first because
it is the proof-critical route and can be static today.
