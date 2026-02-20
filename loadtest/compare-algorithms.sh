#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RESULTS_DIR="$SCRIPT_DIR/results"
BASE_URL="${BASE_URL:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$RESULTS_DIR"

echo "================================================"
echo "  Rate Limiter Algorithm Comparison — k6"
echo "  $(date)"
echo "================================================"
echo ""

for algo in tokenBucket slidingWindow fixedWindow; do
  echo "▶ Testing: $algo"
  echo "────────────────────────────────────"

  k6 run \
    --env BASE_URL="$BASE_URL" \
    --env ALGORITHM="$algo" \
    --summary-export="$RESULTS_DIR/${algo}_${TIMESTAMP}.json" \
    "$SCRIPT_DIR/load.js" \
    2>&1 | tee "$RESULTS_DIR/${algo}_${TIMESTAMP}.log"

  echo ""
  echo "✓ $algo complete — results saved to $RESULTS_DIR/"
  echo ""
  sleep 2
done

echo "================================================"
echo "  All tests complete!"
echo "  Results: $RESULTS_DIR/"
echo "================================================"
