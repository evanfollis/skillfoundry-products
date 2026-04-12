#!/usr/bin/env bash
# Preflight usage summary from systemd journal.
# Usage: ./scripts/usage.sh [since]  (default: "24 hours ago")

set -euo pipefail
SINCE="${1:-24 hours ago}"

echo "=== Preflight usage since: $SINCE ==="
echo

# Grab only JSON lines (telemetry), drop systemd prefix
LOG=$(journalctl -u preflight --since "$SINCE" --no-pager -o cat | grep -E '^\{' || true)

if [[ -z "$LOG" ]]; then
  echo "No telemetry events in window."
  exit 0
fi

TOTAL=$(echo "$LOG" | jq -s 'length')
STARTED=$(echo "$LOG" | jq -s '[.[] | select(.type=="session_started")] | length')
TOOLS_CALL=$(echo "$LOG" | jq -s '[.[] | select(.toolName=="tools/call")] | length')
DISTINCT_UA=$(echo "$LOG" | jq -r 'select(.userAgent) | .userAgent' | sort -u)
DISTINCT_UA_COUNT=$(echo "$DISTINCT_UA" | grep -c . || echo 0)

echo "Total events:           $TOTAL"
echo "Sessions started:       $STARTED"
echo "tools/call invocations: $TOOLS_CALL"
echo "Distinct user-agents:   $DISTINCT_UA_COUNT"
echo

echo "--- User-Agents ---"
echo "$LOG" | jq -r 'select(.type=="session_started") | .userAgent // "(none)"' | sort | uniq -c | sort -rn
echo

echo "--- Verdicts from real tools/call ---"
echo "$LOG" | jq -r 'select(.toolName=="tools/call" and .verdict) | .verdict' | sort | uniq -c | sort -rn
echo

echo "--- Target directories requested ---"
echo "$LOG" | jq -r 'select(.toolName=="tools/call" and .targetDirectories) | .targetDirectories[]' | sort | uniq -c | sort -rn
echo

echo "--- Recent real calls (last 10) ---"
echo "$LOG" | jq -r 'select(.toolName=="tools/call") | "\(.startedAt) ua=\(.userAgent // "?") verdict=\(.verdict // "?") dirs=\(.targetDirectories // [] | join(","))"' | tail -10
