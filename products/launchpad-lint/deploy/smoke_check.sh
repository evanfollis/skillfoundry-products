#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-}"

if [[ -z "${BASE_URL}" ]]; then
  echo "usage: deploy/smoke_check.sh <base-url>" >&2
  exit 1
fi

BASE_URL="${BASE_URL%/}"

echo "checking ${BASE_URL}/health"
curl -fsS "${BASE_URL}/health"
echo

echo "checking ${BASE_URL}/feedback/summary"
curl -fsS "${BASE_URL}/feedback/summary"
echo

echo "checking ${BASE_URL}/telemetry/summary"
curl -fsS "${BASE_URL}/telemetry/summary"
echo
