"""Structured telemetry helpers for Launchpad Lint."""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

from .models import ToolTelemetrySummary

LOGGER = logging.getLogger("launchpad_lint.telemetry")

SKILL_SLUG = "launchpad-lint"
SKILL_VERSION = "0.1.0"


def _default_telemetry_path() -> Path:
    return Path(__file__).resolve().parents[2] / "artifacts" / "telemetry" / "launchpad_lint_telemetry.ndjson"


def _telemetry_path() -> Path:
    configured = os.getenv("LAUNCHPAD_LINT_TELEMETRY_PATH")
    return Path(configured).expanduser() if configured else _default_telemetry_path()


def emit_tool_event(
    *,
    type: str,
    request_id: str,
    tool_name: str,
    started_at: str,
    finished_at: str | None = None,
    latency_ms: int | None = None,
    success: bool | None = None,
    error_code: str | None = None,
    input_size_bytes: int | None = None,
    output_size_bytes: int | None = None,
) -> None:
    """Emit one structured telemetry event to the configured logger."""

    payload: dict[str, Any] = {
        "environment": os.getenv("LAUNCHPAD_LINT_ENVIRONMENT", "development"),
        "request_id": request_id,
        "skill_slug": SKILL_SLUG,
        "skill_version": SKILL_VERSION,
        "started_at": started_at,
        "tool_name": tool_name,
        "type": type,
    }

    optional_fields = {
        "error_code": error_code,
        "finished_at": finished_at,
        "input_size_bytes": input_size_bytes,
        "latency_ms": latency_ms,
        "output_size_bytes": output_size_bytes,
        "success": success,
    }
    payload.update({key: value for key, value in optional_fields.items() if value is not None})

    serialized = json.dumps(payload, sort_keys=True)
    LOGGER.info(serialized)
    _append_event(serialized)


def _append_event(serialized: str) -> None:
    path = _telemetry_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(serialized + "\n")


def summarize_telemetry() -> ToolTelemetrySummary:
    """Summarize completed tool calls from the durable telemetry stream."""

    path = _telemetry_path()
    if not path.exists():
        return ToolTelemetrySummary(
            call_success_rate=0.0,
            p50_latency_ms=0.0,
            p95_latency_ms=0.0,
            tool_breakdown={},
            total_completed_calls=0,
        )

    completed_events: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            payload = json.loads(line)
            if payload.get("type") == "tool_completed":
                completed_events.append(payload)

    if not completed_events:
        return ToolTelemetrySummary(
            call_success_rate=0.0,
            p50_latency_ms=0.0,
            p95_latency_ms=0.0,
            tool_breakdown={},
            total_completed_calls=0,
        )

    latencies = sorted(
        float(event["latency_ms"])
        for event in completed_events
        if event.get("latency_ms") is not None
    )
    successes = [1 for event in completed_events if event.get("success") is True]
    tool_breakdown: dict[str, dict[str, float | int]] = {}
    for event in completed_events:
        tool_name = str(event.get("tool_name", "unknown"))
        bucket = tool_breakdown.setdefault(
            tool_name,
            {"completed_calls": 0, "success_rate": 0.0},
        )
        bucket["completed_calls"] = int(bucket["completed_calls"]) + 1
        if event.get("success") is True:
            bucket["success_rate"] = float(bucket["success_rate"]) + 1.0

    for bucket in tool_breakdown.values():
        bucket["success_rate"] = round(
            float(bucket["success_rate"]) / int(bucket["completed_calls"]),
            3,
        )

    return ToolTelemetrySummary(
        call_success_rate=round(len(successes) / len(completed_events), 3),
        p50_latency_ms=round(_percentile(latencies, 0.50), 2),
        p95_latency_ms=round(_percentile(latencies, 0.95), 2),
        tool_breakdown=tool_breakdown,
        total_completed_calls=len(completed_events),
    )


def _percentile(values: list[float], quantile: float) -> float:
    if not values:
        return 0.0
    index = max(0, min(len(values) - 1, int(round((len(values) - 1) * quantile))))
    return values[index]
