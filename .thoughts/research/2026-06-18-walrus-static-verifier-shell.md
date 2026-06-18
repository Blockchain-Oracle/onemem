# Reality Research: Walrus Static Verifier Shell

## Scope

Decide whether the Walrus Sites mirror should continue targeting a full hosted
dashboard static export or ship a smaller public verifier shell first, then
record the current evidence.

## Sources Checked

- `apps/hosted-dashboard/walrus-sites/README.md`
- `apps/hosted-dashboard/walrus-sites/sites-config.yaml`
- `docs/05-our-architecture/06-dashboard/walrus-sites-mirror.md`
- `.github/workflows/deploy-walrus-sites.yml`
- `scripts/deploy-walrus-sites.sh`
- `apps/hosted-dashboard/app/verify/[session_id]/page.tsx`
- `apps/hosted-dashboard/lib/public-verify.ts`
- `apps/hosted-dashboard/lib/public-verify.test.ts`
- `packages/sdk-ts/src/traces.ts`
- `packages/sdk-ts/src/fetchers/trace.ts`
- `packages/sdk-python/onemem/_rpc.py`
- `contracts/onemem/sources/events.move`
- `contracts/onemem/sources/trace.move`
- `config/networks.json`
- Context7 docs:
  - `/mystenlabs/walrus`: Walrus Sites `site-builder deploy --epochs <NUMBER> <DIRECTORY>`
  - `/vercel/next.js/v15.1.11`: App Router static export and `generateStaticParams`
  - `/mystenlabs/sui`: `sui_getObject` and `suix_queryEvents` JSON-RPC shapes

## Verified Facts

- `scripts/deploy-walrus-sites.sh` validates a static directory and requires
  `index.html`.
- The script's current default static directory is `apps/hosted-dashboard/out`.
- `apps/hosted-dashboard/out` is not present in the current checkout.
- The manual deploy workflow default also points to `apps/hosted-dashboard/out`.
- The hosted public verifier page is a Next App Router dynamic page with
  `export const dynamic = "force-dynamic"`.
- The hosted app contains server-backed API routes and hosted-only auth/share
  behavior, so it is not currently a complete static export candidate.
- Official Walrus Sites docs support deploying any static directory with
  `site-builder --context=<network> deploy --epochs <N> <DIRECTORY>`.
- Current Next.js docs require dynamic routes to predeclare static params for
  static export. An arbitrary `/verify/[session_id]` route cannot be exported as
  infinitely many static paths.
- The hosted verifier helper already performs a narrow verification flow:
  load TraceSession object, query `ActionCallEmittedEvent` pages, run
  `verifyTraceChain`, compare roots, and display proof boundaries.
- The SDK verifier algorithm is simple enough for a browser-only static shell:
  start from a 32-byte zero hash, sort emitted action events by timestamp,
  check `prev_hash` against the previous content hash, fold
  `SHA-256(running_merkle || content_hash)`, and compare the computed root to
  the TraceSession `merkle_root`.
- The repo's Python RPC helper confirms raw JSON-RPC calls:
  `sui_getObject` and `suix_queryEvents`.
- Current Sui docs show `suix_queryEvents` parameters as filter, cursor, limit,
  and a boolean flag.
- `config/networks.json` currently has a testnet package ID and empty mainnet
  package ID.

## Inferences

- The honest first Walrus artifact should be a small static public verifier
  shell, not a full dashboard mirror. It matches the highest-value mirrored
  route without pretending server-backed dashboard routes are static.
- The verifier shell can be fully static and still perform a real chain
  integrity check in the browser through public Sui JSON-RPC.
- The deploy script and workflow defaults should point at the checked-in static
  verifier artifact so the default preflight succeeds.
- Mainnet should be disabled in the shell until `config/networks.json` has a
  real mainnet package ID.

## Unknowns And Questions

- Whether the public Sui fullnode CORS policy will remain permissive for
  browser-hosted verifier requests.
- Whether a future Sui RPC response shape changes vector fields away from
  number arrays.
- Whether the final Walrus deploy environment has funded WAL/SUI and
  `site-builder` installed.

## Not Included

- No live Walrus Sites deployment was performed.
- No SuiNS name was configured.
- No full Next.js static export was attempted.
