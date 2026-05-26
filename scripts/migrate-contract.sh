#!/usr/bin/env bash
# Move package UPGRADE flow (vs initial publish). Publishes a new package
# version + calls per-object `migrate_*_v<N>` entry functions to swap the
# version dynamic field on long-lived objects.
#
# Usage: bash scripts/migrate-contract.sh [testnet|mainnet]
#
# v0.1: no upgrades have happened yet — the first call to this script will
# also need to be the FIRST migration so it can be tested end-to-end.
# Until v0.2 ships its first migration, this script just runs `sui client
# upgrade` and records the new package ID; per-object migrate calls land
# in a follow-up. Spec: docs/05-our-architecture/01-protocol/upgrade-strategy.md

set -euo pipefail

NETWORK="${1:-testnet}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACT_DIR="$REPO_ROOT/contracts/onemem"
DEPLOY_DOC="$REPO_ROOT/docs/05-our-architecture/01-protocol/MAINNET_DEPLOY.md"

GAS_BUDGET="${GAS_BUDGET:-200000000}"

if [ ! -f "$DEPLOY_DOC" ]; then
  echo "ERROR: $DEPLOY_DOC does not exist — no prior deployment recorded."
  echo "Run \`bash scripts/deploy-contract.sh $NETWORK\` first for the initial publish."
  exit 1
fi

# Pull the most recent UpgradeCap ID for this network from the deploy doc.
UPGRADE_CAP_ID="$(awk -v net="$NETWORK" '
  /^## / && tolower($0) ~ tolower(net) { in_block = 1; next }
  /^## / && in_block { in_block = 0 }
  in_block && /UpgradeCap/ { match($0, /`(0x[0-9a-fA-F]+)`/, m); if (m[1] != "") print m[1] }
' "$DEPLOY_DOC" | tail -1)"

if [ -z "$UPGRADE_CAP_ID" ]; then
  echo "ERROR: Could not find an UpgradeCap ID for $NETWORK in $DEPLOY_DOC"
  exit 1
fi

echo "==> Switching to $NETWORK"
sui client switch --env "$NETWORK" >/dev/null

echo "==> Upgrading onemem package via UpgradeCap $UPGRADE_CAP_ID"
UPGRADE_OUT="$(cd "$CONTRACT_DIR" && sui client upgrade --upgrade-capability "$UPGRADE_CAP_ID" --gas-budget "$GAS_BUDGET" --json)"

NEW_PACKAGE_ID="$(echo "$UPGRADE_OUT" | jq -r '.objectChanges[] | select(.type=="published") | .packageId')"
TX_DIGEST="$(echo "$UPGRADE_OUT" | jq -r '.digest')"

echo ""
echo "✓ Upgrade published on $NETWORK"
echo "  New package ID: $NEW_PACKAGE_ID"
echo "  Tx digest:      $TX_DIGEST"
echo ""
echo "NEXT: per-object migrate_*_v<N> entry functions must be called for each"
echo "long-lived object (MemoryNamespace, TraceSession). v0.1 has no v2 schema"
echo "yet so no per-object migration is required — this script will be extended"
echo "with that loop when the first schema-breaking change ships in v0.2."
