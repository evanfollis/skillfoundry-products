"""ASGI app and MCP server entrypoint for Launchpad Lint."""

from __future__ import annotations

import contextlib
import json
import os
import time
import uuid
from datetime import UTC, datetime
from typing import Any, Callable, TypeVar

from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from starlette.applications import Starlette
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, PlainTextResponse
from starlette.routing import Mount, Route

from .analysis import audit_launch_readiness, draft_launch_package
from .feedback_store import record_feedback, summarize_feedback
from .metadata import registry_manifest, server_card
from .models import LaunchPackageDraft, LaunchReadinessResult
from .models import LaunchFeedbackSubmission
from .telemetry import emit_tool_event, summarize_telemetry

ToolReturn = TypeVar("ToolReturn")
SERVER_VERSION = "0.1.0"


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


async def record_feedback_endpoint(request: Request) -> JSONResponse:
    """Capture one durable reviewer feedback record."""

    payload = await request.json()
    submission = LaunchFeedbackSubmission.model_validate(payload)
    receipt = record_feedback(submission)
    emit_tool_event(
        type="user_feedback_recorded",
        request_id=str(uuid.uuid4()),
        tool_name="feedback",
        started_at=receipt.recorded_at,
        finished_at=receipt.recorded_at,
        success=True,
        input_size_bytes=_payload_size_bytes(payload),
        output_size_bytes=_payload_size_bytes(receipt),
    )
    return JSONResponse(receipt.model_dump(mode="json"), status_code=201)


async def feedback_summary(_: Request) -> JSONResponse:
    """Return a compact summary of current feedback records."""

    summary = summarize_feedback()
    return JSONResponse(summary.model_dump(mode="json"))


async def telemetry_summary(_: Request) -> JSONResponse:
    """Return aggregate telemetry metrics for completed tool calls."""

    summary = summarize_telemetry()
    return JSONResponse(summary.model_dump(mode="json"))


async def static_server_card(_: Request) -> JSONResponse:
    """Expose a static server card for registry and gateway fallback scans."""

    return JSONResponse(server_card())


async def registry_server_json(_: Request) -> JSONResponse:
    """Expose a remote-server manifest for the MCP Registry."""

    return JSONResponse(registry_manifest())


def _iso_utc_now() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def _payload_size_bytes(payload: Any) -> int:
    if hasattr(payload, "model_dump"):
        payload = payload.model_dump(mode="json")
    return len(json.dumps(payload, sort_keys=True).encode("utf-8"))


def instrument_tool_call(
    *,
    tool_name: str,
    inputs: dict[str, Any],
    run: Callable[[], ToolReturn],
) -> ToolReturn:
    """Run a tool with one structured telemetry envelope."""

    request_id = str(uuid.uuid4())
    started_at = _iso_utc_now()
    started_perf = time.perf_counter()
    input_size_bytes = _payload_size_bytes(inputs)

    emit_tool_event(
        type="tool_called",
        request_id=request_id,
        tool_name=tool_name,
        started_at=started_at,
        input_size_bytes=input_size_bytes,
    )

    try:
        result = run()
    except Exception as exc:
        emit_tool_event(
            type="tool_completed",
            request_id=request_id,
            tool_name=tool_name,
            started_at=started_at,
            finished_at=_iso_utc_now(),
            latency_ms=int((time.perf_counter() - started_perf) * 1000),
            success=False,
            error_code=type(exc).__name__,
            input_size_bytes=input_size_bytes,
        )
        raise

    emit_tool_event(
        type="tool_completed",
        request_id=request_id,
        tool_name=tool_name,
        started_at=started_at,
        finished_at=_iso_utc_now(),
        latency_ms=int((time.perf_counter() - started_perf) * 1000),
        success=True,
        input_size_bytes=input_size_bytes,
        output_size_bytes=_payload_size_bytes(result),
    )
    return result


def build_mcp_server() -> FastMCP:
    """Create and register one fresh FastMCP server instance."""

    transport_security = TransportSecuritySettings(
        enable_dns_rebinding_protection=True,
        allowed_hosts=[
            "127.0.0.1:*",
            "localhost:*",
            "[::1]:*",
            "skillfoundry.synaplex.ai",
            "skillfoundry.synaplex.ai:*",
        ],
        allowed_origins=[
            "http://127.0.0.1:*",
            "http://localhost:*",
            "http://[::1]:*",
            "https://skillfoundry.synaplex.ai",
            "http://skillfoundry.synaplex.ai",
        ],
    )

    mcp = FastMCP(
        name="launchpad-lint",
        stateless_http=True,
        json_response=True,
        streamable_http_path="/",
        transport_security=transport_security,
    )
    mcp._mcp_server.version = SERVER_VERSION

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
        return instrument_tool_call(
            tool_name="audit_launch_readiness",
            inputs={
                "server_name": server_name,
                "tool_names": tool_names,
                "tool_descriptions": tool_descriptions,
                "readme_text": readme_text,
                "listing_draft": listing_draft,
                "endpoint_url": endpoint_url,
            },
            run=lambda: audit_launch_readiness(
                server_name=server_name,
                tool_names=tool_names,
                tool_descriptions=tool_descriptions,
                readme_text=readme_text,
                listing_draft=listing_draft,
                endpoint_url=endpoint_url,
            ),
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
        return instrument_tool_call(
            tool_name="draft_launch_package",
            inputs={
                "server_name": server_name,
                "target_user": target_user,
                "tool_names": tool_names,
                "tool_descriptions": tool_descriptions,
                "positioning_hints": positioning_hints,
                "constraints": constraints,
            },
            run=lambda: draft_launch_package(
                server_name=server_name,
                target_user=target_user,
                tool_names=tool_names,
                tool_descriptions=tool_descriptions,
                positioning_hints=positioning_hints,
                constraints=constraints,
            ),
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
            Route("/server.json", registry_server_json),
            Route("/feedback", record_feedback_endpoint, methods=["POST"]),
            Route("/feedback/summary", feedback_summary),
            Route("/telemetry/summary", telemetry_summary),
            Route("/.well-known/mcp/server-card.json", static_server_card),
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
