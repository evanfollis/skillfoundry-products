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

echo "checking ${BASE_URL}/server.json"
server_json="$(curl -fsS "${BASE_URL}/server.json")"
echo "${server_json}"
if [[ "${server_json}" != *'"url":"'"${BASE_URL}"'/mcp/"'* ]]; then
  echo "server.json does not advertise ${BASE_URL}/mcp/" >&2
  exit 1
fi
echo

echo "checking ${BASE_URL}/.well-known/mcp/server-card.json"
curl -fsS "${BASE_URL}/.well-known/mcp/server-card.json"
echo

echo "checking ${BASE_URL}/mcp/ returns 401 without auth"
status_code="$(curl -o /dev/null -sS -w '%{http_code}' "${BASE_URL}/mcp/")"
if [[ "${status_code}" != "401" ]]; then
  echo "expected 401 from ${BASE_URL}/mcp/ without auth, got ${status_code}" >&2
  exit 1
fi
echo "${status_code}"
