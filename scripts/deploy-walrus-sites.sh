#!/usr/bin/env bash
# Deploy apps/hosted-dashboard to Walrus Sites as a decentralized mirror.
#
# Pre-req: apps/hosted-dashboard has been built (`pnpm build` + `next export -o out`).
# Pre-req: `site-builder` CLI installed (Walrus Sites). See apps/hosted-dashboard/walrus-sites/README.md.
#
# Usage: bash scripts/deploy-walrus-sites.sh
# Env: WALRUS_EPOCHS (default 26)
# Spec: docs/05-our-architecture/06-dashboard/walrus-sites-mirror.md
#
# Skeleton — implemented in Pillar 6.

set -euo pipefail

EPOCHS="${WALRUS_EPOCHS:-26}"
echo "deploy-walrus-sites: skeleton (epochs=$EPOCHS) — implemented in Pillar 6"
exit 0
