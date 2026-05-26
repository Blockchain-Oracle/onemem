#!/usr/bin/env bash
# Move package UPGRADE flow (vs initial publish). Publishes new package version + calls
# per-object migrate(...) entry functions to swap the version dynamic field on long-lived objects.
#
# Usage: bash scripts/migrate-contract.sh [testnet|mainnet]
# Spec: docs/05-our-architecture/01-protocol/upgrade-pattern.md
# Pattern source: MemWal's account.move version-as-dynamic-field upgrade flow.
#
# Skeleton — implemented in Pillar 1 (or first upgrade).

set -euo pipefail

NETWORK="${1:-testnet}"
echo "migrate-contract: skeleton (network=$NETWORK) — implemented at first upgrade"
exit 0
