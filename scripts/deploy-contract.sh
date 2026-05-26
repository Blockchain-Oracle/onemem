#!/usr/bin/env bash
# Initial publish of contracts/onemem to a target Sui network.
#
# Usage: bash scripts/deploy-contract.sh [testnet|mainnet]
#   default network: testnet
#
# Side effects:
#   - Switches the active Sui CLI env to the target network
#   - Runs `sui client publish` (consumes SUI gas)
#   - Writes the new package ID + bootstrap object IDs to
#     docs/05-our-architecture/01-protocol/MAINNET_DEPLOY.md
#     under the matching network block
#
# Requires: sui CLI, jq, an active Sui keystore with gas. For testnet,
# you can fund the active address via `sui client faucet`. For mainnet,
# the active address must hold real SUI.
#
# Per docs/05-our-architecture/01-protocol/upgrade-strategy.md, the
# UpgradeCap from this publish is what later upgrades will use; record
# it carefully.

set -euo pipefail

NETWORK="${1:-testnet}"
case "$NETWORK" in
  testnet|mainnet|devnet) ;;
  *) echo "Usage: $0 [testnet|mainnet|devnet]"; exit 2 ;;
esac

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACT_DIR="$REPO_ROOT/contracts/onemem"
DEPLOY_DOC="$REPO_ROOT/docs/05-our-architecture/01-protocol/MAINNET_DEPLOY.md"

GAS_BUDGET="${GAS_BUDGET:-200000000}"   # 0.2 SUI default

echo "==> Switching Sui CLI to $NETWORK"
sui client switch --env "$NETWORK" >/dev/null

ACTIVE_ADDRESS="$(sui client active-address)"
echo "==> Active address: $ACTIVE_ADDRESS"

# Make sure there's at least one gas coin before publish (the next call would fail otherwise).
if ! sui client gas --json 2>/dev/null | jq -e '. | length > 0' >/dev/null; then
  if [ "$NETWORK" != "mainnet" ]; then
    echo "==> No gas coins. Requesting faucet for $NETWORK..."
    sui client faucet || { echo "Faucet failed. Try again or fund the address manually."; exit 1; }
    sleep 5
  else
    echo "ERROR: No gas coins on mainnet. Fund $ACTIVE_ADDRESS with SUI before deploying."
    exit 1
  fi
fi

echo "==> Publishing onemem package ($NETWORK)..."
PUBLISH_OUT="$(cd "$CONTRACT_DIR" && sui client publish --gas-budget "$GAS_BUDGET" --json)"

# Extract: the immutable package ID (created object with type ending in "0x2::package::UpgradeCap" identifies the package via packageId field).
# Sui CLI's JSON output puts the published package under .objectChanges[] | select(.type=="published").
PACKAGE_ID="$(echo "$PUBLISH_OUT" | jq -r '.objectChanges[] | select(.type=="published") | .packageId')"
UPGRADE_CAP_ID="$(echo "$PUBLISH_OUT" | jq -r '.objectChanges[] | select(.type=="created" and (.objectType|tostring|endswith("::package::UpgradeCap"))) | .objectId')"
REGISTRY_ID="$(echo "$PUBLISH_OUT" | jq -r --arg pkg "$PACKAGE_ID" '.objectChanges[] | select(.type=="created" and (.objectType==($pkg+"::registry::OneMemRegistry"))) | .objectId')"
ADMIN_CAP_ID="$(echo "$PUBLISH_OUT" | jq -r --arg pkg "$PACKAGE_ID" '.objectChanges[] | select(.type=="created" and (.objectType==($pkg+"::registry::RegistryAdminCap"))) | .objectId')"
TX_DIGEST="$(echo "$PUBLISH_OUT" | jq -r '.digest')"

if [ -z "$PACKAGE_ID" ] || [ "$PACKAGE_ID" = "null" ]; then
  echo "ERROR: Could not parse package ID from publish output. Full JSON:"
  echo "$PUBLISH_OUT" | jq .
  exit 1
fi

echo ""
echo "✓ Published successfully on $NETWORK"
echo "  Package ID:      $PACKAGE_ID"
echo "  Registry:        $REGISTRY_ID"
echo "  RegistryAdmin:   $ADMIN_CAP_ID"
echo "  UpgradeCap:      $UPGRADE_CAP_ID"
echo "  Tx digest:       $TX_DIGEST"
echo "  Deployer:        $ACTIVE_ADDRESS"

# Append to MAINNET_DEPLOY.md (create if missing) under the network block.
mkdir -p "$(dirname "$DEPLOY_DOC")"
if [ ! -f "$DEPLOY_DOC" ]; then
  cat > "$DEPLOY_DOC" <<EOF
# OneMem Deployments

On-chain IDs captured by \`scripts/deploy-contract.sh\` runs. Update only by
re-running the script — do not hand-edit. Each network has its own block.

EOF
fi

cat >> "$DEPLOY_DOC" <<EOF

## ${NETWORK} — $(date -u '+%Y-%m-%d %H:%M:%S UTC')

| Field | Value |
|---|---|
| Network | \`$NETWORK\` |
| Package ID | \`$PACKAGE_ID\` |
| OneMemRegistry (shared) | \`$REGISTRY_ID\` |
| RegistryAdminCap (owned) | \`$ADMIN_CAP_ID\` |
| UpgradeCap (owned) | \`$UPGRADE_CAP_ID\` |
| Deployer address | \`$ACTIVE_ADDRESS\` |
| Tx digest | \`$TX_DIGEST\` |
| Gas budget | $GAS_BUDGET |
EOF

echo ""
echo "==> Wrote deployment record to $DEPLOY_DOC"
echo ""
echo "Next steps:"
echo "  1. Run \`bash scripts/verify-mainnet.sh $NETWORK\` to smoke-test the deployed package"
echo "  2. Commit MAINNET_DEPLOY.md so the IDs are checked in"
