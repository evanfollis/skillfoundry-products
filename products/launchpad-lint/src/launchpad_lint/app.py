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
from pydantic import ValidationError
from starlette.applications import Starlette
from starlette.exceptions import HTTPException
from starlette.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import HTMLResponse, JSONResponse
from starlette.routing import Mount, Route

from .analysis import audit_launch_readiness, draft_launch_package
from .feedback_store import record_feedback, summarize_feedback
from .metadata import registry_manifest, server_card
from .models import LaunchPackageDraft, LaunchReadinessResult
from .models import LaunchFeedbackSubmission
from .telemetry import emit_tool_event, summarize_telemetry

ToolReturn = TypeVar("ToolReturn")
SERVER_VERSION = "0.1.0"
MAX_JSON_BODY_BYTES = 500_000


class SharedSecretMiddleware(BaseHTTPMiddleware):
    """Require the appropriate secret for MCP requests when configured."""

    async def dispatch(self, request: Request, call_next):
        protects_mcp = request.url.path.startswith("/mcp")
        protects_feedback_write = request.url.path == "/feedback" and request.method == "POST"
        if not protects_mcp and not protects_feedback_write:
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


async def homepage(_: Request) -> HTMLResponse:
    """Explain the product and expose an immediately usable REST example."""

    return HTMLResponse(
        """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Audit an MCP server launch package for metadata gaps and marketplace-readiness issues.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://skillfoundry.synaplex.ai/products/launchpad-lint/">
  <title>Launchpad Lint — MCP Marketplace Launch Auditor</title>
  <style>
    :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
    body { max-width: 760px; margin: 0 auto; padding: 3rem 1.25rem; line-height: 1.6; }
    h1 { line-height: 1.1; margin-bottom: .5rem; }
    h2 { margin-top: 2.5rem; }
    .eyebrow { color: #16a34a; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .lead { font-size: 1.15rem; }
    code, pre { background: color-mix(in srgb, CanvasText 8%, Canvas); border-radius: .35rem; }
    code { padding: .1rem .25rem; }
    pre { overflow-x: auto; padding: 1rem; }
    a { color: #16803c; }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">Skillfoundry</p>
    <h1>Launchpad Lint</h1>
    <p class="lead">Audit whether an MCP server package is ready for a credible marketplace launch, then draft the minimum launch package.</p>

    <h2>What it checks</h2>
    <ul>
      <li>server identity, tool names, and tool descriptions</li>
      <li>README and marketplace-listing completeness</li>
      <li>endpoint and launch-package readiness</li>
    </ul>

    <h2>Try the open REST audit</h2>
    <pre><code>curl -X POST https://skillfoundry.synaplex.ai/products/launchpad-lint/api/audit \\
  -H 'content-type: application/json' \\
  -d '{"server_name":"my-server","tool_names":["search"],"tool_descriptions":["Search product documentation"]}'</code></pre>

    <p>Agent clients can use the protected <a href="./mcp/">MCP endpoint</a> through an authorized distribution channel. Registry metadata is available as <a href="./server.json">server.json</a>.</p>
    <p><a href="/products/preflight/">Need to check registry manifests and publish metadata instead? Use Preflight.</a></p>
  </main>
</body>
</html>
"""
    )


# --- REST API endpoints (for RapidAPI, direct integrations, etc.) ---


async def api_audit(request: Request) -> JSONResponse:
    """REST API: audit launch readiness for an MCP server package."""

    payload = await _read_json_object(request)
    result = instrument_tool_call(
        tool_name="audit_launch_readiness",
        inputs=payload,
        run=lambda: audit_launch_readiness(
            server_name=payload.get("server_name", ""),
            tool_names=payload.get("tool_names", []),
            tool_descriptions=payload.get("tool_descriptions", []),
            readme_text=payload.get("readme_text", ""),
            listing_draft=payload.get("listing_draft", ""),
            endpoint_url=payload.get("endpoint_url", ""),
        ),
    )
    return JSONResponse(result.model_dump(mode="json"))


async def api_draft(request: Request) -> JSONResponse:
    """REST API: draft a launch package for an MCP server."""

    payload = await _read_json_object(request)
    result = instrument_tool_call(
        tool_name="draft_launch_package",
        inputs=payload,
        run=lambda: draft_launch_package(
            server_name=payload.get("server_name", ""),
            target_user=payload.get("target_user", ""),
            tool_names=payload.get("tool_names", []),
            tool_descriptions=payload.get("tool_descriptions", []),
            positioning_hints=payload.get("positioning_hints"),
            constraints=payload.get("constraints"),
        ),
    )
    return JSONResponse(result.model_dump(mode="json"))


async def health(_: Request) -> JSONResponse:
    """Health check route for hosting probes."""

    return JSONResponse({"status": "ok", "service": "launchpad-lint"})


async def record_feedback_endpoint(request: Request) -> JSONResponse:
    """Capture one durable reviewer feedback record."""

    payload = await _read_json_object(request)
    try:
        submission = LaunchFeedbackSubmission.model_validate(payload)
    except ValidationError as exc:
        return JSONResponse(status_code=422, content={"error": "Invalid feedback", "details": exc.errors()})
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


async def _read_json_object(request: Request) -> dict[str, Any]:
    """Read one bounded JSON object or fail with a client error."""

    body = await request.body()
    if len(body) > MAX_JSON_BODY_BYTES:
        raise HTTPException(status_code=413, detail="Request body is too large")
    try:
        payload = json.loads(body)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Request body must be valid JSON") from exc
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Request body must be a JSON object")
    return payload


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
            Route("/api/audit", api_audit, methods=["POST"]),
            Route("/api/draft", api_draft, methods=["POST"]),
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
