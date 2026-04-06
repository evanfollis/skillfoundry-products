# Bottleneck Radar Server

`bottleneck-radar` is a hosted MCP server for technical builders. It turns noisy input
signals into ranked bottlenecks and concise product briefs.

## Public Tools

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

## AgenticMarket Middleware

When `AGENTICMARKET_SECRET` is set, requests hitting `/mcp` must include the
`x-agenticmarket-secret` header. Local development works without that variable.

## Health Check

- `GET /health`

## Deploy

This repo includes [render.yaml](/Users/evanfollis/projects/skillfoundry/bottleneck-radar-server/render.yaml)
for a simple HTTPS deployment path on Render.
