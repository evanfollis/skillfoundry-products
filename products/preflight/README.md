# Preflight

**Validate whether your MCP server is publishable on real directories.**

Preflight checks your server's actual artifacts — `server.json`, `package.json`, `smithery.yaml` — against the documented requirements of the MCP Registry, Smithery, and npm. Every finding includes the evidence found, the directory rule it maps to, and the exact fix.

## What it checks

| Directory | Hard requirements verified |
|-----------|--------------------------|
| **MCP Registry** | server.json schema, name format, packages/remotes config, transport type, npm mcpName ownership, PyPI README marker |
| **Smithery** | Streamable HTTP transport, public HTTPS endpoint, server-card presence |
| **npm** | name, version, entry point (bin/main) |

Each finding is tagged with:
- **Evidence level**: `verified_from_artifact` (parsed from your file) or `inferred` (absence of expected input)
- **Rule type**: `hard_requirement` (submission will fail), `directory_convention`, or `heuristic`
- **Source URL**: link to the directory documentation the rule comes from

## Use it

### As an MCP tool

Connect to the MCP endpoint:

```
https://skillfoundry.synaplex.ai/products/preflight/mcp/
```

Call `check_publish_readiness` with your artifact contents:

```json
{
  "manifest": "<your server.json content>",
  "package_json": "<your package.json content>",
  "target_directories": ["mcp_registry", "npm"]
}
```

### As a REST API

```bash
curl -X POST https://skillfoundry.synaplex.ai/products/preflight/api/check \
  -H 'Content-Type: application/json' \
  -d '{
    "manifest": "{\"name\":\"io.github.you/your-server\",\"description\":\"...\",\"version\":\"1.0.0\",\"packages\":[{\"registryType\":\"npm\",\"identifier\":\"@you/your-server\",\"transport\":{\"type\":\"stdio\"}}]}"
  }'
```

### Input fields

All optional — provide as many as you have:

| Field | What it unlocks |
|-------|----------------|
| `manifest` | Raw `server.json` content — MCP Registry schema validation |
| `package_json` | Raw `package.json` content — npm checks, mcpName verification |
| `smithery_yaml` | Raw `smithery.yaml` content — Smithery build config checks |
| `pyproject_toml` | Raw `pyproject.toml` content — Python package checks |
| `readme` | Raw README content — documentation quality, PyPI mcp-name marker |
| `target_directories` | Array of `"mcp_registry"`, `"smithery"`, `"npm"` — defaults to all applicable |

### Output

```json
{
  "mode": "artifact_lint",
  "serverName": "io.github.you/your-server",
  "transportType": "stdio",
  "verdict": "fixable",
  "findings": [
    {
      "severity": "block",
      "category": "directory_policy",
      "check": "npm packages: package.json has 'mcpName' matching server.json 'name'",
      "evidence": "package.json missing 'mcpName' field",
      "evidenceLevel": "verified_from_artifact",
      "affectedArtifact": "package.json",
      "rule": {
        "ruleId": "mcpreg-npm-mcpname",
        "directory": "mcp_registry",
        "type": "hard_requirement",
        "sourceUrl": "https://modelcontextprotocol.io/registry/package-types",
        "lastReviewed": "2026-04-11",
        "policyPackVersion": "0.1.0"
      },
      "fix": "Add '\"mcpName\": \"io.github.you/your-server\"' to package.json."
    }
  ],
  "directoryReadiness": {
    "mcp_registry": { "state": "blocked", "hardBlockers": 1, "conventionGaps": 0, "heuristicFlags": 0 },
    "npm": { "state": "ready", "hardBlockers": 0, "conventionGaps": 0, "heuristicFlags": 0 }
  },
  "summary": { "totalChecks": 15, "passed": 13, "warnings": 1, "blockers": 1 },
  "notChecked": [
    { "reason": "Live endpoint probing is not yet supported (v1.1)", "whatItWouldVerify": "..." }
  ]
}
```

**Verdicts:**
- `checks_pass` — all checked rules pass for target directories
- `fixable` — has blockers, but every blocker has a concrete fix
- `not_ready` — fundamental issues

## What it does not do

- Does not rewrite anything. It validates.
- Does not verify stdio server runtime behavior.
- Does not use LLM calls. Pure parsing and validation.
- Does not require authentication or collect PII.
- Does not cover non-MCP marketplaces.

## Design

- **Zero dependencies** — no npm packages at runtime
- **Evidence-based** — every finding cites what was checked, what was found, which directory rule applies
- **Source-linked rules** — every policy rule traces to actual directory documentation with a review date
- **Honest about scope** — explicitly reports what was NOT checked and why

Policy packs are versioned and derived from directory documentation as of 2026-04-11:
- [MCP Registry quickstart](https://modelcontextprotocol.io/registry/quickstart)
- [MCP Registry package types](https://modelcontextprotocol.io/registry/package-types)
- [MCP Registry remote servers](https://modelcontextprotocol.io/registry/remote-servers)
- [MCP server.json schema](https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json)
- [Smithery publish docs](https://smithery.ai/docs/build/publish)
- [npm package.json docs](https://docs.npmjs.com/cli/v11/configuring-npm/package-json)

## Endpoints

| Path | Method | Purpose |
|------|--------|---------|
| `/health` | GET | Health check |
| `/api/check` | POST | REST API |
| `/mcp/` | POST | MCP JSON-RPC (Streamable HTTP) |
| `/server.json` | GET | MCP Registry manifest |
| `/.well-known/mcp/server-card.json` | GET | Smithery server card |

## License

MIT

---

Built by [Skillfoundry](https://skillfoundry.synaplex.ai).
