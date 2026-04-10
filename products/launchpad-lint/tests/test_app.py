from __future__ import annotations

import os
import unittest

from starlette.testclient import TestClient

from launchpad_lint.app import create_app


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
