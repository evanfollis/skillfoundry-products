from __future__ import annotations

import asyncio
import json
import os
import unittest

from starlette.requests import Request
from starlette.responses import Response

from bottleneck_radar_server.app import SharedSecretMiddleware, health


class AppTests(unittest.TestCase):
    def test_health_route(self) -> None:
        response = asyncio.run(health(self._request(path="/health", headers=[])))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.body)["service"], "bottleneck-radar")

    def test_shared_secret_middleware(self) -> None:
        previous = os.environ.get("SKILLFOUNDRY_SHARED_SECRET")
        os.environ["SKILLFOUNDRY_SHARED_SECRET"] = "secret"
        try:
            unauthorized = asyncio.run(self._dispatch_secret_middleware(headers=[]))
            authorized = asyncio.run(
                self._dispatch_secret_middleware(
                    headers=[(b"x-skillfoundry-secret", b"secret")]
                )
            )
            self.assertEqual(unauthorized.status_code, 401)
            self.assertNotEqual(authorized.status_code, 401)
        finally:
            if previous is None:
                os.environ.pop("SKILLFOUNDRY_SHARED_SECRET", None)
            else:
                os.environ["SKILLFOUNDRY_SHARED_SECRET"] = previous

    def _request(self, *, path: str, headers: list[tuple[bytes, bytes]]) -> Request:
        async def receive() -> dict[str, object]:
            return {"body": b"", "more_body": False, "type": "http.request"}

        return Request(
            {
                "type": "http",
                "method": "GET",
                "path": path,
                "headers": headers,
                "query_string": b"",
            },
            receive,
        )

    async def _dispatch_secret_middleware(
        self, *, headers: list[tuple[bytes, bytes]]
    ) -> Response:
        request = self._request(path="/mcp/", headers=headers)
        middleware = SharedSecretMiddleware(app=lambda scope, receive, send: None)

        async def call_next(_: Request) -> Response:
            return Response(status_code=204)

        return await middleware.dispatch(request, call_next)


if __name__ == "__main__":
    unittest.main()
