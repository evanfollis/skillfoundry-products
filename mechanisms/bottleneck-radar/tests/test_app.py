from __future__ import annotations

import os
import unittest

from starlette.testclient import TestClient

from bottleneck_radar_server.app import create_app


class AppTests(unittest.TestCase):
    def test_health_route(self) -> None:
        with TestClient(create_app()) as client:
            response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["service"], "bottleneck-radar")

    def test_shared_secret_middleware(self) -> None:
        previous = os.environ.get("SKILLFOUNDRY_SHARED_SECRET")
        os.environ["SKILLFOUNDRY_SHARED_SECRET"] = "secret"
        try:
            with TestClient(create_app()) as client:
                unauthorized = client.post("/mcp", json={})
                authorized = client.post("/mcp", json={}, headers={"x-skillfoundry-secret": "secret"})
            self.assertEqual(unauthorized.status_code, 401)
            self.assertNotEqual(authorized.status_code, 401)
        finally:
            if previous is None:
                os.environ.pop("SKILLFOUNDRY_SHARED_SECRET", None)
            else:
                os.environ["SKILLFOUNDRY_SHARED_SECRET"] = previous


if __name__ == "__main__":
    unittest.main()
