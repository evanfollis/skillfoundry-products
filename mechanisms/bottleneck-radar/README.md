# Bottleneck Radar

`bottleneck-radar` is an internal Skillfoundry mechanism. It turns noisy input signals
into ranked bottlenecks and concise opportunity briefs so downstream agents can decide
what products are worth designing and shipping.

It is implemented as a narrow MCP server because that makes it easy for other agents
and operators to call, but it should not be confused with a monetized product.

## Mechanism Tools

- `analyze_signals`
- `draft_brief`

## Local Run

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python3.12 -m pip install -e .[dev]
uvicorn bottleneck_radar_server.app:app --host 0.0.0.0 --port 8000
```

The MCP endpoint is mounted at `http://localhost:8000/mcp/`.

## Shared Secret Middleware

When `SKILLFOUNDRY_SHARED_SECRET` is set, requests hitting `/mcp` must include the
`x-skillfoundry-secret` header. Local development works without that variable.

## Health Check

- `GET /health`

## Deploy

This mechanism includes [render.yaml](/Users/evanfollis/projects/skillfoundry/skillfoundry-products/mechanisms/bottleneck-radar/render.yaml)
for a simple HTTPS deployment path when a hosted internal endpoint is useful.
