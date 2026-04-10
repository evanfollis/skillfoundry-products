from __future__ import annotations

import json
import os
import tempfile
import unittest
from unittest.mock import patch

from launchpad_lint.app import instrument_tool_call
from launchpad_lint.telemetry import summarize_telemetry


class TelemetryTests(unittest.TestCase):
    def test_instrument_tool_call_emits_success_events(self) -> None:
        with patch("launchpad_lint.app.emit_tool_event") as emit:
            result = instrument_tool_call(
                tool_name="demo_tool",
                inputs={"alpha": 1},
                run=lambda: {"ok": True},
            )

        self.assertEqual(result, {"ok": True})
        self.assertEqual(emit.call_count, 2)
        self.assertEqual(emit.call_args_list[0].kwargs["type"], "tool_called")
        self.assertEqual(emit.call_args_list[1].kwargs["type"], "tool_completed")
        self.assertTrue(emit.call_args_list[1].kwargs["success"])

    def test_instrument_tool_call_emits_failure_events(self) -> None:
        with patch("launchpad_lint.app.emit_tool_event") as emit:
            with self.assertRaisesRegex(ValueError, "boom"):
                instrument_tool_call(
                    tool_name="demo_tool",
                    inputs={"alpha": 1},
                    run=lambda: (_ for _ in ()).throw(ValueError("boom")),
                )

        self.assertEqual(emit.call_count, 2)
        self.assertEqual(emit.call_args_list[1].kwargs["type"], "tool_completed")
        self.assertFalse(emit.call_args_list[1].kwargs["success"])
        self.assertEqual(emit.call_args_list[1].kwargs["error_code"], "ValueError")

    def test_summarize_telemetry_returns_latency_and_success_rates(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "telemetry.ndjson")
            previous = os.environ.get("LAUNCHPAD_LINT_TELEMETRY_PATH")
            os.environ["LAUNCHPAD_LINT_TELEMETRY_PATH"] = path
            try:
                with open(path, "w", encoding="utf-8") as handle:
                    for payload in (
                        {
                            "latency_ms": 120,
                            "success": True,
                            "tool_name": "audit_launch_readiness",
                            "type": "tool_completed",
                        },
                        {
                            "latency_ms": 400,
                            "success": False,
                            "tool_name": "audit_launch_readiness",
                            "type": "tool_completed",
                        },
                        {
                            "latency_ms": 200,
                            "success": True,
                            "tool_name": "draft_launch_package",
                            "type": "tool_completed",
                        },
                    ):
                        handle.write(json.dumps(payload) + "\n")

                summary = summarize_telemetry()
                self.assertEqual(summary.total_completed_calls, 3)
                self.assertEqual(summary.call_success_rate, 0.667)
                self.assertEqual(summary.p50_latency_ms, 200.0)
                self.assertEqual(summary.p95_latency_ms, 400.0)
                self.assertEqual(summary.tool_breakdown["audit_launch_readiness"]["completed_calls"], 2)
                self.assertEqual(summary.tool_breakdown["draft_launch_package"]["success_rate"], 1.0)
            finally:
                if previous is None:
                    os.environ.pop("LAUNCHPAD_LINT_TELEMETRY_PATH", None)
                else:
                    os.environ["LAUNCHPAD_LINT_TELEMETRY_PATH"] = previous


if __name__ == "__main__":
    unittest.main()
