#!/usr/bin/env bash
# Tail Preflight telemetry and flag first real user conversions.
# A "real" call = method=tools/call AND UA is not a known crawler/tester.
# Writes flagged lines to /opt/projects/.alerts/preflight-real-user.log.

set -euo pipefail

ALERTS_DIR="/opt/projects/.alerts"
ALERT_LOG="$ALERTS_DIR/preflight-real-user.log"
mkdir -p "$ALERTS_DIR"

# Known non-user UA substrings to ignore
IGNORE_RE='Chiark|ad-mcp-probe|python-httpx|test-verify|smithery|node$'

journalctl -u preflight -f -o cat --no-pager | while IFS= read -r line; do
  [[ "$line" != \{* ]] && continue
  method=$(echo "$line" | jq -r '.toolName // empty' 2>/dev/null) || continue
  [[ "$method" != "tools/call" ]] && continue
  ua=$(echo "$line" | jq -r '.userAgent // "(none)"' 2>/dev/null)
  if echo "$ua" | grep -qE "$IGNORE_RE"; then continue; fi
  ts=$(date -Iseconds)
  echo "[$ts] REAL-USER ua=$ua line=$line" >> "$ALERT_LOG"
done
