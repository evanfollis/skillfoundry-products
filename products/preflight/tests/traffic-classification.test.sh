#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../scripts/traffic-classification.sh
source "$SCRIPT_DIR/../scripts/traffic-classification.sh"

[[ "$(classify_preflight_traffic user 'SentinelOracle/0.1 (liveness-only, never invokes tools)')" == known_automation ]]
[[ "$(classify_preflight_traffic user 'mcpbeat/0.1 (liveness check)')" == known_automation ]]
[[ "$(classify_preflight_traffic user 'SaSame-MCP-Audit/0.1')" == known_automation ]]
[[ "$(classify_preflight_traffic cron 'curl/8.5.0')" == internal ]]
[[ "$(classify_preflight_traffic user 'AcmeBuilderClient/1.0')" == unattributed ]]

classified=$(printf '%s\n' \
  '{"sourceType":"user","userAgent":"SentinelOracle/0.1"}' \
  'not-json' \
  '{"sourceType":"user","userAgent":"AcmeBuilderClient/1.0"}' \
  | classify_preflight_telemetry_stream)
[[ "$(echo "$classified" | jq -s 'length')" == 2 ]]
[[ "$(echo "$classified" | jq -r 'select(.userAgent=="SentinelOracle/0.1") | .trafficClass')" == known_automation ]]
[[ "$(echo "$classified" | jq -r 'select(.userAgent=="AcmeBuilderClient/1.0") | .trafficClass')" == unattributed ]]

printf '%s\n' 'OK preflight traffic classification'
