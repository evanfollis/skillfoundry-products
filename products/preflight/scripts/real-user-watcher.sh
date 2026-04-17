#!/usr/bin/env bash
# Tail Preflight telemetry and flag first real user conversions.
# A "real" call = method=tools/call AND UA is not a known crawler/tester
#   AND sourceType is not smoke/system/cron.
# Writes flagged lines to /opt/workspace/runtime/.alerts/preflight-real-user.log.
#
# IMPORTANT — latencyMs field:
#   latencyMs measures server-side processing time, NOT network round-trip.
#   A value of 0-1ms means the operation (e.g. initialize, tools/list) completed
#   fast server-side; it does NOT indicate a loopback/localhost origin.
#   Do NOT use latencyMs as a proxy for "is this from localhost?" — it isn't.
#
# DISCRIMINATION STRATEGY (ADR-0019):
#   1. Primary: sourceType field. Events with sourceType=smoke|system|cron are
#      excluded. When the service is deployed with sourceType support, automated
#      callers MUST set X-Source-Type header. This is the correct long-term fix.
#      Status: code_landed as of 4907d26, NOT yet deployed as of 2026-04-17.
#   2. Proxy (until sourceType is deployed): Mozilla/Linux UA is excluded.
#      Investigation (2026-04-17): 11,358 Mozilla/Linux events in 24h, all
#      initialize/tools/list auto-reconnects from Claude.ai MCP client or
#      operator self-testing. Zero confirmed external-user tools/call events
#      from this UA. Proxy rule is conservative — it excludes any genuine
#      external user on Linux/Chrome until sourceType discrimination is live.
#   3. sourceType gate: after deployment, remove the Mozilla proxy rule and
#      rely solely on sourceType != user.

set -euo pipefail

ALERTS_DIR="/opt/workspace/runtime/.alerts"
ALERT_LOG="$ALERTS_DIR/preflight-real-user.log"
mkdir -p "$ALERTS_DIR"

# Known non-user UA substrings to ignore.
# Mozilla/Linux is a proxy for operator/Claude.ai self-traffic until sourceType
# is deployed — see comment block above before removing it.
IGNORE_RE='Chiark|ad-mcp-probe|python-httpx|test-verify|smithery|node$|Mozilla.*Linux'

# Excluded sourceType values (self-generated or automated)
IGNORE_SOURCE_RE='^(smoke|system|cron)$'

journalctl -u preflight -f -o cat --no-pager | while IFS= read -r line; do
  [[ "$line" != \{* ]] && continue
  method=$(echo "$line" | jq -r '.toolName // empty' 2>/dev/null) || continue
  [[ "$method" != "tools/call" ]] && continue
  ua=$(echo "$line" | jq -r '.userAgent // "(none)"' 2>/dev/null)
  if echo "$ua" | grep -qE "$IGNORE_RE"; then continue; fi
  # sourceType gate: skip automated/smoke events once sourceType is deployed
  source_type=$(echo "$line" | jq -r '.sourceType // "user"' 2>/dev/null)
  if echo "$source_type" | grep -qE "$IGNORE_SOURCE_RE"; then continue; fi
  ts=$(date -Iseconds)
  echo "[$ts] REAL-USER ua=$ua sourceType=$source_type line=$line" >> "$ALERT_LOG"
done
