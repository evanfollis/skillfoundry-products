"""ASGI app and MCP server entrypoint for Bottleneck Radar."""

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

from .analysis import analyze_sources, draft_brief_from_cluster
from .models import AnalyzeSignalsResult, DraftBriefResult, SignalSource


class AgenticMarketSecretMiddleware(BaseHTTPMiddleware):
    """Require AgenticMarket proxy secret for MCP requests when configured."""

    async def dispatch(self, request: Request, call_next):
        if not request.url.path.startswith("/mcp"):
            return await call_next(request)
        expected_secret = os.getenv("AGENTICMARKET_SECRET")
        if not expected_secret:
            return await call_next(request)
        provided_secret = request.headers.get("x-agenticmarket-secret")
        if provided_secret != expected_secret:
            return JSONResponse(status_code=401, content={"error": "Unauthorized"})
        return await call_next(request)


async def homepage(_: Request) -> PlainTextResponse:
    """Minimal landing route."""

    return PlainTextResponse("Bottleneck Radar MCP server is running.\n")


async def health(_: Request) -> JSONResponse:
    """Health check route for marketplace review and hosting probes."""

    return JSONResponse({"status": "ok", "service": "bottleneck-radar"})


def build_mcp_server() -> FastMCP:
    """Create and register one fresh FastMCP server instance."""

    mcp = FastMCP(
        name="bottleneck-radar",
        stateless_http=True,
        json_response=True,
        streamable_http_path="/",
    )

    @mcp.tool(
        name="analyze_signals",
        description="Cluster URLs or pasted signal text into ranked bottlenecks with evidence-backed summaries.",
    )
    def analyze_signals(
        sources: list[SignalSource],
        target_user: str = "",
        max_clusters: int = 5,
    ) -> AnalyzeSignalsResult:
        return analyze_sources(sources=sources, target_user=target_user, max_clusters=max_clusters)

    @mcp.tool(
        name="draft_brief",
        description="Turn one selected bottleneck cluster into a concise builder-oriented product brief.",
    )
    def draft_brief(
        cluster_title: str,
        pain_summary: str,
        evidence_snippets: list[str],
        target_user: str,
        distribution_surface: str = "AgenticMarket",
    ) -> DraftBriefResult:
        return draft_brief_from_cluster(
            cluster_title=cluster_title,
            pain_summary=pain_summary,
            evidence_snippets=evidence_snippets,
            target_user=target_user,
            distribution_surface=distribution_surface,
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
        middleware=[Middleware(AgenticMarketSecretMiddleware)],
        lifespan=lifespan,
    )


app = create_app()


def run() -> None:
    """Local CLI entrypoint."""

    import uvicorn

    uvicorn.run("bottleneck_radar_server.app:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
