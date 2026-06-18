#!/usr/bin/env bash
# Deploy a prebuilt static OneMem dashboard artifact to Walrus Sites.
#
# Official Walrus shape:
#   site-builder --context=<network> deploy --epochs <N> <DIST>
#
# This script intentionally does not run Next.js export. The hosted dashboard is
# partly server-backed today, so callers must provide a real static artifact.

set -euo pipefail

MODE="deploy"
DIST="${WALRUS_DIST:-apps/hosted-dashboard/out}"
EPOCHS="${WALRUS_EPOCHS:-26}"
CONTEXT="${WALRUS_CONTEXT:-mainnet}"
SITE_BUILDER="${SITE_BUILDER_BIN:-site-builder}"
OBJECT_ID="${WALRUS_SITE_OBJECT_ID:-}"

usage() {
  cat <<'EOF'
Usage: bash scripts/deploy-walrus-sites.sh [options]

Options:
  --check              Validate the static artifact and print the deploy command.
  --dry-run            Validate and print the deploy command without executing it.
  --dist <path>        Static site directory to deploy. Default: apps/hosted-dashboard/out
  --epochs <number>    Walrus storage epochs to fund. Default: 26
  --context <name>     site-builder context/network. Default: mainnet
  --object-id <id>     Existing Walrus Site object ID to update.
  -h, --help           Show this help.

Environment:
  WALRUS_DIST, WALRUS_EPOCHS, WALRUS_CONTEXT, WALRUS_SITE_OBJECT_ID,
  SITE_BUILDER_BIN
EOF
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --check)
      MODE="check"
      shift
      ;;
    --dry-run)
      MODE="dry-run"
      shift
      ;;
    --dist)
      [ "$#" -ge 2 ] || die "--dist requires a path"
      DIST="$2"
      shift 2
      ;;
    --epochs)
      [ "$#" -ge 2 ] || die "--epochs requires a number"
      EPOCHS="$2"
      shift 2
      ;;
    --context)
      [ "$#" -ge 2 ] || die "--context requires a name"
      CONTEXT="$2"
      shift 2
      ;;
    --object-id)
      [ "$#" -ge 2 ] || die "--object-id requires a Sui object ID"
      OBJECT_ID="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown option: $1"
      ;;
  esac
done

case "$EPOCHS" in
  ''|*[!0-9]*)
    die "--epochs must be a positive integer"
    ;;
  0)
    die "--epochs must be greater than 0"
    ;;
esac

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
case "$DIST" in
  /*) DIST_ABS="$DIST" ;;
  *) DIST_ABS="$ROOT/$DIST" ;;
esac

[ "$DIST_ABS" != "$ROOT" ] || die "refusing to deploy the repository root"
[ -d "$DIST_ABS" ] || die "static artifact directory not found: $DIST_ABS"
[ -f "$DIST_ABS/index.html" ] || die "static artifact must contain index.html: $DIST_ABS"

CMD=("$SITE_BUILDER" "--context=$CONTEXT" "deploy" "--epochs" "$EPOCHS")
if [ -n "$OBJECT_ID" ]; then
  CMD+=("--object-id" "$OBJECT_ID")
fi
CMD+=("$DIST_ABS")

echo "Walrus Sites artifact: $DIST_ABS"
echo "Walrus Sites context: $CONTEXT"
echo "Walrus Sites epochs: $EPOCHS"
if [ -n "$OBJECT_ID" ]; then
  echo "Walrus Sites object: $OBJECT_ID"
fi
printf "Walrus Sites command:"
printf " %q" "${CMD[@]}"
printf "\n"

case "$MODE" in
  check|dry-run)
    exit 0
    ;;
esac

command -v "$SITE_BUILDER" >/dev/null 2>&1 || die "site-builder CLI not found in PATH"
exec "${CMD[@]}"
