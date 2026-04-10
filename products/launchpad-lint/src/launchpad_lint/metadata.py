"""Public metadata surfaces for registries and aggregators."""

from __future__ import annotations

import os
from typing import Any


def public_base_url() -> str:
    """Return the canonical public base URL for this deployment."""

    configured = os.getenv("LAUNCHPAD_LINT_PUBLIC_BASE_URL", "").strip().rstrip("/")
    if configured:
        return configured
    return "https://skillfoundry.synaplex.ai/products/launchpad-lint"


def server_card() -> dict[str, Any]:
    """Return a Smithery-compatible static server card."""

    auth_required = bool(
        os.getenv("AGENTICMARKET_SECRET") or os.getenv("LAUNCHPAD_LINT_SHARED_SECRET")
    )
    return {
        "serverInfo": {
            "name": "launchpad-lint",
            "version": "0.1.0",
        },
        "authentication": {
            "required": auth_required,
            "schemes": ["header"] if auth_required else [],
        },
        "tools": [
            {
                "name": "audit_launch_readiness",
                "description": "Audit whether an MCP server package is ready for a credible first marketplace launch.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "server_name": {"type": "string"},
                        "tool_names": {"type": "array", "items": {"type": "string"}},
                        "tool_descriptions": {"type": "array", "items": {"type": "string"}},
                        "readme_text": {"type": "string"},
                        "listing_draft": {"type": "string"},
                        "endpoint_url": {"type": "string"},
                    },
                    "required": ["server_name", "tool_names", "tool_descriptions"],
                },
            },
            {
                "name": "draft_launch_package",
                "description": "Draft the minimum marketplace launch package for a narrow MCP product.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "server_name": {"type": "string"},
                        "target_user": {"type": "string"},
                        "tool_names": {"type": "array", "items": {"type": "string"}},
                        "tool_descriptions": {"type": "array", "items": {"type": "string"}},
                        "positioning_hints": {"type": "array", "items": {"type": "string"}},
                        "constraints": {"type": "array", "items": {"type": "string"}},
                    },
                    "required": ["server_name", "target_user", "tool_names", "tool_descriptions"],
                },
            },
        ],
        "resources": [],
        "prompts": [],
    }


def registry_manifest() -> dict[str, Any]:
    """Return an MCP Registry-style remote server manifest."""

    base_url = public_base_url()
    return {
        "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
        "name": "io.github.evanfollis/launchpad-lint",
        "title": "Launchpad Lint",
        "description": "Audit MCP launch readiness and draft a marketplace-ready package for technical builders.",
        "version": "0.1.0",
        "homepage": base_url,
        "repository": {
            "source": "github",
            "url": "https://github.com/evanfollis/skillfoundry-products",
        },
        "remotes": [
            {
                "type": "streamable-http",
                "url": f"{base_url}/mcp",
            }
        ],
    }
