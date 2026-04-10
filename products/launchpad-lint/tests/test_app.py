from __future__ import annotations

import asyncio
import json
import os
import tempfile
import unittest

from starlette.requests import Request
from starlette.testclient import TestClient

from launchpad_lint.app import (
    create_app,
    feedback_summary,
    record_feedback_endpoint,
    registry_server_json,
    static_server_card,
    telemetry_summary,
)


class AppTests(unittest.TestCase):
    def test_health_route(self) -> None:
        with TestClient(create_app()) as client:
            response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["service"], "launchpad-lint")

    def test_shared_secret_middleware(self) -> None:
        previous = os.environ.get("LAUNCHPAD_LINT_SHARED_SECRET")
        os.environ["LAUNCHPAD_LINT_SHARED_SECRET"] = "secret"
        try:
            with TestClient(create_app()) as client:
                unauthorized = client.post("/mcp", json={})
                authorized = client.post("/mcp", json={}, headers={"x-launchpad-lint-secret": "secret"})
            self.assertEqual(unauthorized.status_code, 401)
            self.assertNotEqual(authorized.status_code, 401)
        finally:
            if previous is None:
                os.environ.pop("LAUNCHPAD_LINT_SHARED_SECRET", None)
            else:
                os.environ["LAUNCHPAD_LINT_SHARED_SECRET"] = previous

    def test_feedback_endpoint_and_summary(self) -> None:
        previous_feedback = os.environ.get("LAUNCHPAD_LINT_FEEDBACK_PATH")
        with tempfile.TemporaryDirectory() as tmpdir:
            os.environ["LAUNCHPAD_LINT_FEEDBACK_PATH"] = os.path.join(tmpdir, "feedback.json")
            try:
                request = self._json_request(
                    path="/feedback",
                    payload={
                        "reviewer_id": "agent-1",
                        "session_id": "session-1",
                        "score": 4,
                        "reduced_launch_ambiguity": True,
                        "required_only_light_editing": True,
                        "would_reuse": True,
                        "notes": "useful first pass",
                    },
                )
                response = asyncio.run(record_feedback_endpoint(request))
                summary = asyncio.run(feedback_summary(request))
            finally:
                if previous_feedback is None:
                    os.environ.pop("LAUNCHPAD_LINT_FEEDBACK_PATH", None)
                else:
                    os.environ["LAUNCHPAD_LINT_FEEDBACK_PATH"] = previous_feedback

        self.assertEqual(response.status_code, 201)
        self.assertEqual(json.loads(response.body)["reviewer_id"], "agent-1")
        self.assertEqual(summary.status_code, 200)
        self.assertGreaterEqual(json.loads(summary.body)["total_reviews"], 1)

    def test_telemetry_summary_endpoint(self) -> None:
        previous_telemetry = os.environ.get("LAUNCHPAD_LINT_TELEMETRY_PATH")
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "telemetry.ndjson")
            os.environ["LAUNCHPAD_LINT_TELEMETRY_PATH"] = path
            try:
                with open(path, "w", encoding="utf-8") as handle:
                    handle.write(
                        json.dumps(
                            {
                                "latency_ms": 180,
                                "success": True,
                                "tool_name": "audit_launch_readiness",
                                "type": "tool_completed",
                            }
                        )
                        + "\n"
                    )
                request = self._json_request(path="/telemetry/summary", payload={})
                summary = asyncio.run(telemetry_summary(request))
            finally:
                if previous_telemetry is None:
                    os.environ.pop("LAUNCHPAD_LINT_TELEMETRY_PATH", None)
                else:
                    os.environ["LAUNCHPAD_LINT_TELEMETRY_PATH"] = previous_telemetry

        self.assertEqual(summary.status_code, 200)
        self.assertEqual(json.loads(summary.body)["total_completed_calls"], 1)

    def test_metadata_endpoints(self) -> None:
        request = self._json_request(path="/server.json", payload={})
        manifest = asyncio.run(registry_server_json(request))
        card = asyncio.run(static_server_card(request))

        self.assertEqual(manifest.status_code, 200)
        self.assertEqual(card.status_code, 200)
        self.assertIn("remotes", json.loads(manifest.body))
        self.assertIn("tools", json.loads(card.body))

    def _json_request(self, *, path: str, payload: dict[str, object]) -> Request:
        body = json.dumps(payload).encode("utf-8")

        async def receive() -> dict[str, object]:
            return {"body": body, "more_body": False, "type": "http.request"}

        return Request(
            {
                "type": "http",
                "method": "POST",
                "path": path,
                "headers": [(b"content-type", b"application/json")],
                "query_string": b"",
            },
            receive,
        )

    def test_agenticmarket_secret_middleware(self) -> None:
        previous_market = os.environ.get("AGENTICMARKET_SECRET")
        previous_preview = os.environ.get("LAUNCHPAD_LINT_SHARED_SECRET")
        os.environ["AGENTICMARKET_SECRET"] = "market-secret"
        os.environ.pop("LAUNCHPAD_LINT_SHARED_SECRET", None)
        try:
            with TestClient(create_app()) as client:
                unauthorized = client.post("/mcp", json={})
                authorized = client.post("/mcp", json={}, headers={"x-agenticmarket-secret": "market-secret"})
            self.assertEqual(unauthorized.status_code, 401)
            self.assertNotEqual(authorized.status_code, 401)
        finally:
            if previous_market is None:
                os.environ.pop("AGENTICMARKET_SECRET", None)
            else:
                os.environ["AGENTICMARKET_SECRET"] = previous_market

            if previous_preview is None:
                os.environ.pop("LAUNCHPAD_LINT_SHARED_SECRET", None)
            else:
                os.environ["LAUNCHPAD_LINT_SHARED_SECRET"] = previous_preview


if __name__ == "__main__":
    unittest.main()
