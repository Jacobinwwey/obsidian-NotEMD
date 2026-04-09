#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

STAMP="${1:-$(date +%F)}"
BASE_DIR="docs/superpowers/baselines/${STAMP}-language-support"
mkdir -p "$BASE_DIR"

echo "[baseline] writing into $BASE_DIR"

{
  echo "=== DATE ==="
  date -Is
  echo
  echo "=== NODE/NPM ==="
  node -v
  npm -v
  echo
  echo "=== OBSIDIAN CLI ==="
  obsidian help || true
  echo
  obsidian-cli help || true
} > "$BASE_DIR/environment-baseline.txt"

set +e
npm run build > "$BASE_DIR/build-baseline.txt" 2>&1
BUILD_EXIT=$?
set -e

echo "$BUILD_EXIT" > "$BASE_DIR/build-baseline.exitcode"

npm test -- --runInBand \
  src/tests/workflowButtons.test.ts \
  src/tests/sidebarDomButtonClicks.test.ts \
  src/tests/llmUtilsProviderSupport.test.ts \
  src/tests/providerDiagnostics.test.ts \
  > "$BASE_DIR/targeted-tests-baseline.txt" 2>&1

echo "[baseline] done"
echo "BASE_DIR=$BASE_DIR"
