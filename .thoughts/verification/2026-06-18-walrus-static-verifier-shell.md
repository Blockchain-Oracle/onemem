# Verification Audit: Walrus Static Verifier Shell

## Verdict

Conditional pass.

The repo now has a checked-in static public verifier artifact that the Walrus
Sites deploy wrapper can validate by default. No live Walrus Sites deployment
was performed, so no hosted Walrus URL is claimed.

## Artifacts Checked

- Research:
  `.thoughts/research/2026-06-18-walrus-static-verifier-shell.md`
- Plan:
  `.thoughts/plans/2026-06-18-walrus-static-verifier-shell.md`
- Static artifact:
  `apps/hosted-dashboard/walrus-sites/verifier/index.html`
  `apps/hosted-dashboard/walrus-sites/verifier/styles.css`
  `apps/hosted-dashboard/walrus-sites/verifier/app.js`
  `apps/hosted-dashboard/walrus-sites/verifier/ws-resources.json`
- Deploy path:
  `scripts/deploy-walrus-sites.sh`
  `.github/workflows/deploy-walrus-sites.yml`
  `apps/hosted-dashboard/walrus-sites/sites-config.yaml`
- Docs:
  `apps/hosted-dashboard/walrus-sites/README.md`
  `docs/05-our-architecture/06-dashboard/walrus-sites-mirror.md`
  `docs/05-our-architecture/06-dashboard/README.md`
  `docs/05-our-architecture/06-dashboard/purpose-local-vs-hosted.md`
- Structure gate:
  `tests/structure/walrus-static-verifier.test.ts`

## Requirement Traceability

| Requirement | Evidence |
|---|---|
| Static artifact exists | `verifier/` contains `index.html`, `styles.css`, `app.js`, and `ws-resources.json`. |
| Default deploy path points at a real artifact | `scripts/deploy-walrus-sites.sh` defaults `WALRUS_DIST` to `apps/hosted-dashboard/walrus-sites/verifier`. |
| Workflow no longer depends on hosted Next build output | `.github/workflows/deploy-walrus-sites.yml` defaults `dist` to the verifier directory and no longer runs the hosted-dashboard build step. |
| Verifier uses Sui JSON-RPC | `app.js` calls `sui_getObject` and `suix_queryEvents`. |
| Verifier supports upgraded package history | `app.js` derives the event package ID from the TraceSession object type before querying events. |
| Verifier recomputes trace chain | `app.js` checks `prevHash`, folds `crypto.subtle.digest("SHA-256", running || content)`, and compares root and count. |
| Walrus resource metadata supports verifier routes | `ws-resources.json` routes `/verify` and `/verify/*` to `/index.html`. |
| Docs keep proof boundary honest | Walrus docs say the full dashboard mirror and live Walrus URL remain pending. |

## Acceptance Criteria Coverage

| Acceptance Criterion | Evidence |
|---|---|
| `--check` succeeds with default artifact | `bash scripts/deploy-walrus-sites.sh --check` passed. |
| Explicit testnet preflight succeeds | `bash scripts/deploy-walrus-sites.sh --check --dist apps/hosted-dashboard/walrus-sites/verifier --epochs 2 --context testnet` passed. |
| Structure guard exists | `tests/structure/walrus-static-verifier.test.ts` passed, 5/5. |
| Full structure suite passes | `mise exec -- pnpm test:structure` passed, 425/425. |
| Static files serve locally | Temporary `python3 -m http.server` served `index.html`, `app.js`, and `ws-resources.json`; curl found the verifier title, JSON-RPC code, SHA-256 call, and `/verify/*` route. |
| File-size guard remains clean | `app.js` is 300 lines, `styles.css` is 300 lines, and the new structure test is 90 lines. |

## Quality Gates

Executed:

```bash
bash scripts/deploy-walrus-sites.sh --check
bash scripts/deploy-walrus-sites.sh --check --dist apps/hosted-dashboard/walrus-sites/verifier --epochs 2 --context testnet
mise exec -- pnpm exec tsx --test tests/structure/walrus-static-verifier.test.ts
mise exec -- pnpm test:structure
git diff --check
wc -l tests/structure/walrus-static-verifier.test.ts apps/hosted-dashboard/walrus-sites/verifier/app.js apps/hosted-dashboard/walrus-sites/verifier/styles.css
python3 -m http.server 4177 --directory apps/hosted-dashboard/walrus-sites/verifier
curl http://127.0.0.1:4177/index.html
curl http://127.0.0.1:4177/app.js
curl http://127.0.0.1:4177/ws-resources.json
```

Results:

- Default Walrus deploy check: passed.
- Explicit testnet Walrus deploy check: passed.
- Focused structure test: passed, 5/5.
- Full structure suite: passed, 425/425.
- Whitespace check: passed.
- Static smoke: passed.
- Chrome plugin browser proof: passed after the extension became available. The
  local verifier loaded a historical testnet TraceSession, returned `Verified`,
  showed four calls, and displayed matching expected/computed Merkle roots.

## Deviations From Plan

- The first Chrome connection attempt failed because the extension backend was
  unavailable; after the user restored it, the Chrome proof passed.
- No live `site-builder deploy` was run; only preflight checks were run.

## Gaps And Risks

- Live Walrus Sites deployment URL remains unclaimed.
- Current disposable trace demo environment still references an old namespace
  capability package boundary after the testnet upgrade, so the demo script did
  not mint a fresh current-package verified trace in this slice. The static
  verifier handles this package-history case by deriving the event package from
  the TraceSession object type.
- Mainnet verification remains disabled until `config/networks.json` contains a
  real mainnet package ID.

## Follow-ups

- Run `site-builder deploy` in a funded Walrus/Sui environment and record the
  returned site object and URL.
- Align disposable demo credentials with the upgraded testnet package before
  relying on that demo for fresh post-upgrade trace generation.

## Evidence Log

- Default artifact:
  `apps/hosted-dashboard/walrus-sites/verifier`
- Default command printed:
  `site-builder --context=mainnet deploy --epochs 26 <verifier-dir>`
- Testnet preflight command printed:
  `site-builder --context=testnet deploy --epochs 2 <verifier-dir>`
- Chrome proof session:
  `0xc173d0abc33f51bef8f489c9e928e2d956a290419edc7e3924b79a39bec56d59`
  verified with 4 calls and matching root
  `0x6c963d157122b69ee57ec6c082867e16d0df6ed4ccc74cbad1c58c04f7f7b42e`.
