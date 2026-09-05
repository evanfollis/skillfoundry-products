#!/usr/bin/env bash
# Preflight usage summary from systemd journal.
# Usage: ./scripts/usage.sh [since]  (default: "24 hours ago")

set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=traffic-classification.sh
source "$SCRIPT_DIR/traffic-classification.sh"
SINCE="${1:-24 hours ago}"

echo "=== Preflight usage since: $SINCE ==="
echo

# Grab only JSON lines (telemetry), drop systemd prefix
LOG=$(journalctl -u preflight --since "$SINCE" --no-pager -o cat | grep -E '^\{' || true)

if [[ -z "$LOG" ]]; then
  echo "No telemetry events in window."
  exit 0
fi

RAW_LINES=$(printf '%s\n' "$LOG" | wc -l)
CLASSIFIED=$(printf '%s\n' "$LOG" | classify_preflight_telemetry_stream)
TOTAL=$(echo "$CLASSIFIED" | jq -s 'length')
MALFORMED=$((RAW_LINES - TOTAL))
STARTED=$(echo "$CLASSIFIED" | jq -s '[.[] | select(.type=="session_started")] | length')
TOOLS_CALL=$(echo "$CLASSIFIED" | jq -s '[.[] | select(.toolName=="tools/call")] | length')
DISTINCT_UA=$(echo "$CLASSIFIED" | jq -r 'select(.userAgent) | .userAgent' | sort -u)
DISTINCT_UA_COUNT=$(echo "$DISTINCT_UA" | grep -c . || echo 0)

AUTOMATED_SESSIONS=$(echo "$CLASSIFIED" | jq -s '[.[] | select(.type=="session_started" and .trafficClass=="known_automation")] | length')
INTERNAL_SESSIONS=$(echo "$CLASSIFIED" | jq -s '[.[] | select(.type=="session_started" and .trafficClass=="internal")] | length')
UNATTRIBUTED_SESSIONS=$(echo "$CLASSIFIED" | jq -s '[.[] | select(.type=="session_started" and .trafficClass=="unattributed")] | length')
AUTOMATED_CALLS=$(echo "$CLASSIFIED" | jq -s '[.[] | select(.toolName=="tools/call" and .trafficClass=="known_automation")] | length')
INTERNAL_CALLS=$(echo "$CLASSIFIED" | jq -s '[.[] | select(.toolName=="tools/call" and .trafficClass=="internal")] | length')
UNATTRIBUTED_CALLS=$(echo "$CLASSIFIED" | jq -s '[.[] | select(.toolName=="tools/call" and .trafficClass=="unattributed")] | length')

echo "Total events:           $TOTAL"
echo "Malformed JSON lines:   $MALFORMED"
echo "Sessions started:       $STARTED"
echo "tools/call invocations: $TOOLS_CALL"
echo "Distinct user-agents:   $DISTINCT_UA_COUNT"
echo

echo "--- Conservative traffic classification ---"
echo "Known automated sessions: $AUTOMATED_SESSIONS"
echo "Internal sessions:        $INTERNAL_SESSIONS"
echo "Unattributed sessions:    $UNATTRIBUTED_SESSIONS"
echo "Known automated calls:    $AUTOMATED_CALLS"
echo "Internal calls:           $INTERNAL_CALLS"
echo "Unattributed calls:       $UNATTRIBUTED_CALLS"
echo
echo "Unattributed means evidence review is required; it does not mean human, buyer, or revenue."
echo "This telemetry contains no payment evidence."
echo

echo "--- User-Agents ---"
echo "$CLASSIFIED" | jq -r 'select(.type=="session_started") | .userAgent // "(none)"' | sort | uniq -c | sort -rn
echo

echo "--- Verdicts from all tools/call events (includes automation) ---"
echo "$CLASSIFIED" | jq -r 'select(.toolName=="tools/call" and .verdict) | .verdict' | sort | uniq -c | sort -rn
echo

echo "--- Target directories requested ---"
echo "$CLASSIFIED" | jq -r 'select(.toolName=="tools/call" and .targetDirectories) | .targetDirectories[]' | sort | uniq -c | sort -rn
echo

echo "--- Recent tools/call events (last 10; classify before interpreting) ---"
echo "$CLASSIFIED" | jq -r 'select(.toolName=="tools/call") | "\(.startedAt) class=\(.trafficClass) sourceType=\(.sourceType // "?") ua=\(.userAgent // "?") verdict=\(.verdict // "?") dirs=\(.targetDirectories // [] | join(","))"' | tail -10
