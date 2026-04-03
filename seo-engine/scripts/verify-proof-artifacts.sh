#!/usr/bin/env bash
# Verify that proof artifacts exist and are current for a task.
# Usage: ./scripts/verify-proof-artifacts.sh TASK-ID
#
# Exits 0 if all required proofs are present and current.
# Exits 1 if any proof is missing or stale (wrong commit hash).

set -euo pipefail

TASK_ID="${1:?Usage: verify-proof-artifacts.sh TASK-ID}"
RESULTS_DIR="test-results"
MANIFEST="$RESULTS_DIR/$TASK_ID-manifest.json"
CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")

echo "Verifying proof artifacts for task: $TASK_ID"
echo "Expected commit: $CURRENT_COMMIT"
echo "─────────────────────────────────────"

ERRORS=0

# ── Check manifest exists ──────────────────────────────────────────────────
if [ ! -f "$MANIFEST" ]; then
  echo "FAIL: Manifest not found at $MANIFEST"
  echo "      Run: ./scripts/collect-test-proofs.sh $TASK_ID"
  exit 1
fi

# ── Check commit matches ──────────────────────────────────────────────────
MANIFEST_COMMIT=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$MANIFEST','utf8')).commit)" 2>/dev/null || echo "unknown")

if [ "$MANIFEST_COMMIT" != "$CURRENT_COMMIT" ]; then
  echo "STALE: Manifest commit ($MANIFEST_COMMIT) != current HEAD ($CURRENT_COMMIT)"
  echo "       Re-run: ./scripts/collect-test-proofs.sh $TASK_ID"
  ERRORS=$((ERRORS + 1))
fi

# ── Check required artifacts exist ─────────────────────────────────────────
check_artifact() {
  local name="$1"
  local path="$2"
  if [ -f "$path" ] && [ -s "$path" ]; then
    echo "  OK: $name ($path)"
  else
    echo "  MISSING: $name ($path)"
    ERRORS=$((ERRORS + 1))
  fi
}

echo ""
echo "Checking artifacts:"
check_artifact "Unit tests" "$RESULTS_DIR/unit/$TASK_ID/output.tap"
check_artifact "Smoke tests" "$RESULTS_DIR/smoke/$TASK_ID/output.tap"
check_artifact "Security tests" "$RESULTS_DIR/security/$TASK_ID/output.tap"

# Contract tests are optional (only if bridge is running)
if [ -f "$RESULTS_DIR/integration/$TASK_ID/contracts.tap" ]; then
  check_artifact "Contract tests" "$RESULTS_DIR/integration/$TASK_ID/contracts.tap"
fi

# ── Summary ────────────────────────────────────────────────────────────────
echo ""
if [ $ERRORS -eq 0 ]; then
  echo "PASS: All proof artifacts present and current."
  exit 0
else
  echo "FAIL: $ERRORS issue(s) found. Fix before committing."
  exit 1
fi
