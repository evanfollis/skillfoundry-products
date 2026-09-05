#!/usr/bin/env bash
# Tail Preflight telemetry and flag calls that deserve evidence review.
# A candidate call = method=tools/call AND UA is not known automation
#   AND sourceType is not smoke/system/cron. A candidate is not proof of a
#   human user, buyer, or commercial conversion.
# Writes candidates to /opt/workspace/runtime/.alerts/preflight-real-user.log.
#
# IMPORTANT — latencyMs field:
#   latencyMs measures server-side processing time, NOT network round-trip.
#   A value of 0-1ms means the operation (e.g. initialize, tools/list) completed
#   fast server-side; it does NOT indicate a loopback/localhost origin.
#   Do NOT use latencyMs as a proxy for "is this from localhost?" — it isn't.
#
# DISCRIMINATION STRATEGY (ADR-0019):
#   1. sourceType excludes callers that truthfully self-identify as
#      smoke/system/cron. It is caller-controlled and cannot prove human use.
#   2. A conservative user-agent classifier excludes known crawlers, indexers,
#      audit systems, generic HTTP clients seen in automated scans, and the
#      historical Mozilla/Linux operator traffic.
#   3. Everything else is "unattributed" and enters a review queue. It is never
#      promoted automatically to external conversation/commitment/transaction.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=traffic-classification.sh
source "$SCRIPT_DIR/traffic-classification.sh"

ALERTS_DIR="/opt/workspace/runtime/.alerts"
ALERT_LOG="$ALERTS_DIR/preflight-real-user.log"
mkdir -p "$ALERTS_DIR"

journalctl -u preflight -f -o cat --no-pager | while IFS= read -r line; do
  [[ "$line" != \{* ]] && continue
  method=$(echo "$line" | jq -r '.toolName // empty' 2>/dev/null) || continue
  [[ "$method" != "tools/call" ]] && continue
  ua=$(echo "$line" | jq -r '.userAgent // "(none)"' 2>/dev/null)
  source_type=$(echo "$line" | jq -r '.sourceType // "user"' 2>/dev/null)
  classification=$(classify_preflight_traffic "$source_type" "$ua")
  [[ "$classification" != "unattributed" ]] && continue
  ts=$(date -Iseconds)
  echo "[$ts] CANDIDATE-EXTERNAL-TOOL-CALL ua=$ua sourceType=$source_type classification=$classification line=$line" >> "$ALERT_LOG"
done
