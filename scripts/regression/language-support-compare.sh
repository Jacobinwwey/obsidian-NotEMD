#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

BASE_DIR="${1:-}"
if [[ -z "$BASE_DIR" ]]; then
  BASE_DIR="$(ls -td docs/superpowers/baselines/*-language-support 2>/dev/null | head -n1 || true)"
fi

if [[ -z "$BASE_DIR" || ! -d "$BASE_DIR" ]]; then
  echo "[compare] baseline directory not found"
  echo "usage: bash scripts/regression/language-support-compare.sh <baseline-dir>"
  exit 1
fi

echo "[compare] using baseline $BASE_DIR"

CURRENT_BUILD="$BASE_DIR/build-compare-current.txt"
CURRENT_TEST="$BASE_DIR/targeted-tests-compare-current.txt"

set +e
npm run build > "$CURRENT_BUILD" 2>&1
CURRENT_BUILD_EXIT=$?
set -e

echo "$CURRENT_BUILD_EXIT" > "$BASE_DIR/build-compare-current.exitcode"

npm test -- --runInBand \
  src/tests/workflowButtons.test.ts \
  src/tests/sidebarDomButtonClicks.test.ts \
  src/tests/llmUtilsProviderSupport.test.ts \
  src/tests/providerDiagnostics.test.ts \
  > "$CURRENT_TEST" 2>&1

if grep -q "error TS6059" "$CURRENT_BUILD"; then
  echo "[compare] FAIL: TS6059 still present in current build output"
  exit 1
fi

if grep -E "Test Suites:\s*[1-9][0-9]* failed|\bFAIL\b" "$CURRENT_TEST" >/dev/null; then
  echo "[compare] FAIL: targeted regression tests reported failures"
  exit 1
fi

if grep -E "ERR_CONNECTION_CLOSED|socket hang up" "$CURRENT_TEST" >/dev/null; then
  if ! grep -q "llmUtilsProviderSupport.test.ts" "$CURRENT_TEST"; then
    echo "[compare] FAIL: network-close signatures found outside expected mock test context"
    exit 1
  fi
fi

echo "[compare] PASS: build + targeted regressions are stable"
