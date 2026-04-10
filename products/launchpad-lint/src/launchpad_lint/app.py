"""ASGI app and MCP server entrypoint for Launchpad Lint."""

from __future__ import annotations

import contextlib
import os

from mcp.server.fastmcp import FastMCP
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, PlainTextResponse
from starlette.routing import Mount, Route

from .analysis import audit_launch_readiness, draft_launch_package
from .models import LaunchPackageDraft, LaunchReadinessResult


class SharedSecretMiddleware(BaseHTTPMiddleware):
    """Require the appropriate secret for MCP requests when configured."""

    async def dispatch(self, request: Request, call_next):
        if not request.url.path.startswith("/mcp"):
            return await call_next(request)

        # AgenticMarket uses a fixed proxy header after a server is approved.
        agenticmarket_secret = os.getenv("AGENTICMARKET_SECRET")
        if agenticmarket_secret:
            provided_secret = request.headers.get("x-agenticmarket-secret")
            if provided_secret != agenticmarket_secret:
                return JSONResponse(status_code=401, content={"error": "Unauthorized"})
            return await call_next(request)

        # Before approval, allow a local preview secret for controlled public testing.
        preview_secret = os.getenv("LAUNCHPAD_LINT_SHARED_SECRET")
        if preview_secret:
            provided_secret = request.headers.get("x-launchpad-lint-secret")
            if provided_secret != preview_secret:
                return JSONResponse(status_code=401, content={"error": "Unauthorized"})

        return await call_next(request)


async def homepage(_: Request) -> PlainTextResponse:
    """Minimal landing route."""

    return PlainTextResponse("Launchpad Lint MCP product is running.\n")


async def health(_: Request) -> JSONResponse:
    """Health check route for hosting probes."""

    return JSONResponse({"status": "ok", "service": "launchpad-lint"})


def build_mcp_server() -> FastMCP:
    """Create and register one fresh FastMCP server instance."""

    mcp = FastMCP(
        name="launchpad-lint",
        stateless_http=True,
        json_response=True,
        streamable_http_path="/",
    )

    @mcp.tool(
        name="audit_launch_readiness",
        description="Audit whether an MCP server package is ready for a credible first marketplace launch.",
    )
    def audit_launch_readiness_tool(
        server_name: str,
        tool_names: list[str],
        tool_descriptions: list[str],
        readme_text: str = "",
        listing_draft: str = "",
        endpoint_url: str = "",
    ) -> LaunchReadinessResult:
        return audit_launch_readiness(
            server_name=server_name,
            tool_names=tool_names,
            tool_descriptions=tool_descriptions,
            readme_text=readme_text,
            listing_draft=listing_draft,
            endpoint_url=endpoint_url,
        )

    @mcp.tool(
        name="draft_launch_package",
        description="Draft the minimum marketplace launch package for a narrow MCP product.",
    )
    def draft_launch_package_tool(
        server_name: str,
        target_user: str,
        tool_names: list[str],
        tool_descriptions: list[str],
        positioning_hints: list[str] | None = None,
        constraints: list[str] | None = None,
    ) -> LaunchPackageDraft:
        return draft_launch_package(
            server_name=server_name,
            target_user=target_user,
            tool_names=tool_names,
            tool_descriptions=tool_descriptions,
            positioning_hints=positioning_hints,
            constraints=constraints,
        )

    return mcp


def create_app() -> Starlette:
    """Create one fresh ASGI app with its own MCP session manager."""

    mcp = build_mcp_server()

    @contextlib.asynccontextmanager
    async def lifespan(_: Starlette):
        async with mcp.session_manager.run():
            yield

    return Starlette(
        routes=[
            Route("/", homepage),
            Route("/health", health),
            Mount("/mcp", mcp.streamable_http_app()),
        ],
        middleware=[Middleware(SharedSecretMiddleware)],
        lifespan=lifespan,
    )


app = create_app()


def run() -> None:
    """Local CLI entrypoint."""

    import uvicorn

    uvicorn.run("launchpad_lint.app:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
