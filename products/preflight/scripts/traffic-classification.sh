#!/usr/bin/env bash
# Conservative traffic classification shared by the watcher and usage report.
# "unattributed" is deliberately not called "user": an unknown user-agent is
# only a candidate signal until its behavior and provenance are reviewed.

AUTOMATION_UA_RE='bot|crawler|probe|scanner|audit|census|research|observatory|witness|scoring|verifymcp|verify|registry|mcpbeat|sentineloracle|chiark|python-httpx|go-http-client|^node$|^undici$|mozilla.*linux|reliability-bureau|agentindex|endpointaudit|measure-mcp|agent-evidence|agent-tools\.cloud|proofbench|mcpscan|mcpwatch|mcpgrade|mcp-stats|mcpqueen|mcp-history|fetchgate|agenticresourcesearch|golemreach|hultra|enerlio|^six/|^ruby$|guzzlehttp|^bun/|osz-cognitiveos|money-ai-discovery|catalog-health|mcp-checker|same-mcp|same-census'

classify_preflight_traffic() {
  local source_type="${1:-user}"
  local user_agent="${2:-(none)}"

  case "$source_type" in
    smoke|system|cron)
      printf '%s\n' internal
      ;;
    *)
      if printf '%s\n' "$user_agent" | grep -qiE "$AUTOMATION_UA_RE"; then
        printf '%s\n' known_automation
      else
        printf '%s\n' unattributed
      fi
      ;;
  esac
}

classify_preflight_telemetry_stream() {
  jq -Rc --arg automation_re "$AUTOMATION_UA_RE" '
    fromjson?
    | select(.)
    | . + {trafficClass: (
        if ((.sourceType // "user") | test("^(smoke|system|cron)$")) then "internal"
        elif ((.userAgent // "(none)") | test($automation_re; "i")) then "known_automation"
        else "unattributed"
        end
      )}'
}
