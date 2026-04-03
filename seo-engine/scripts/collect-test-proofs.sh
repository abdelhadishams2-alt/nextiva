#!/usr/bin/env bash
# Collect test proof artifacts for a task.
# Usage: ./scripts/collect-test-proofs.sh TASK-ID
#
# Gathers test outputs from all active test types into test-results/.
# Stamps each artifact with git commit hash and ISO timestamp.
# Creates a proof manifest at test-results/TASK-ID-manifest.json.

set -euo pipefail

TASK_ID="${1:?Usage: collect-test-proofs.sh TASK-ID}"
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RESULTS_DIR="test-results"

echo "Collecting test proofs for task: $TASK_ID"
echo "Commit: $COMMIT | Time: $TIMESTAMP"
echo "─────────────────────────────────────"

# Create task-specific directories
mkdir -p "$RESULTS_DIR/unit/$TASK_ID"
mkdir -p "$RESULTS_DIR/integration/$TASK_ID"
mkdir -p "$RESULTS_DIR/smoke/$TASK_ID"
mkdir -p "$RESULTS_DIR/security/$TASK_ID"

# ── Unit Tests ──────────────────────────────────────────────────────────────
echo "[1/4] Running unit tests..."
node --test --test-reporter=tap tests/*.test.js > "$RESULTS_DIR/unit/$TASK_ID/output.tap" 2>&1 || true
UNIT_EXIT=$?

# ── Smoke Tests ─────────────────────────────────────────────────────────────
echo "[2/4] Running smoke tests..."
if [ -f tests/smoke/smoke.test.js ]; then
  node --test tests/smoke/smoke.test.js > "$RESULTS_DIR/smoke/$TASK_ID/output.tap" 2>&1 || true
fi

# ── Contract Tests ──────────────────────────────────────────────────────────
echo "[3/4] Running contract tests..."
if [ -f tests/contracts/contract-validator.test.js ]; then
  node --test tests/contracts/contract-validator.test.js > "$RESULTS_DIR/integration/$TASK_ID/contracts.tap" 2>&1 || true
fi

# ── Security-specific Tests ─────────────────────────────────────────────────
echo "[4/4] Running security tests..."
for f in tests/auth-middleware.test.js tests/path-traversal.test.js tests/prompt-guard.test.js tests/rate-limiter.test.js; do
  if [ -f "$f" ]; then
    node --test "$f" >> "$RESULTS_DIR/security/$TASK_ID/output.tap" 2>&1 || true
  fi
done

# ── Generate Manifest ──────────────────────────────────────────────────────
echo ""
echo "Generating proof manifest..."

cat > "$RESULTS_DIR/$TASK_ID-manifest.json" << MANIFEST
{
  "task_id": "$TASK_ID",
  "commit": "$COMMIT",
  "timestamp": "$TIMESTAMP",
  "artifacts": {
    "unit_tests": "$RESULTS_DIR/unit/$TASK_ID/output.tap",
    "smoke_tests": "$RESULTS_DIR/smoke/$TASK_ID/output.tap",
    "contract_tests": "$RESULTS_DIR/integration/$TASK_ID/contracts.tap",
    "security_tests": "$RESULTS_DIR/security/$TASK_ID/output.tap"
  },
  "collected_by": "collect-test-proofs.sh"
}
MANIFEST

echo ""
echo "✓ Proof artifacts collected at: $RESULTS_DIR/"
echo "✓ Manifest: $RESULTS_DIR/$TASK_ID-manifest.json"
echo "✓ Commit: $COMMIT"
