# Launchpad Lint

`launchpad-lint` is the first external Skillfoundry product candidate.

It helps technical builders audit whether an MCP server is actually ready for a public
marketplace launch and drafts the minimum package needed to submit credibly.

## Current Preview Deployment

- preview base URL: `https://skillfoundry.synaplex.ai/products/launchpad-lint/`
- health URL: `https://skillfoundry.synaplex.ai/products/launchpad-lint/health`
- MCP URL: `https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp`
- the MCP route is intentionally protected before marketplace approval

## Target User

Solo AI builders and small technical automation agencies that already have a working
MCP server but need help turning it into a credible first public launch package.

## Public Tools

- `audit_launch_readiness`
- `draft_launch_package`

## Example Prompts

- "Audit whether my MCP server is ready for a first AgenticMarket launch."
- "Tell me what is missing from this server package before I submit it publicly."
- "Draft a launch package for this builder-facing MCP server."

## Explicit Limits

- Best for narrow builder-facing MCP servers, not broad product strategy.
- Depends on the quality of the provided tool descriptions and docs.
- Does not automate marketplace submission or final pricing decisions.

## Local Run

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python3.12 -m pip install -e .[dev]
uvicorn launchpad_lint.app:app --host 0.0.0.0 --port 8000
```

The MCP endpoint is mounted at `http://localhost:8000/mcp/`.

## Deployment Surfaces

Launchpad Lint now includes deploy artifacts for:

- Hetzner + systemd + Cloudflare tunnel
- Render
- Railway
- Fly.io
- generic Docker hosts

See [DEPLOYMENT_SURFACES.md](/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint/deploy/DEPLOYMENT_SURFACES.md).

## Monetization Channels

Launchpad Lint is now set up to support channel fan-out from one canonical runtime:

- AgenticMarket
- Smithery
- MCP Registry
- direct paid access experiments

See [MONETIZATION_CHANNELS.md](/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint/docs/MONETIZATION_CHANNELS.md).
See [OPERATOR_MONETIZATION_RUNBOOK.md](/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint/docs/OPERATOR_MONETIZATION_RUNBOOK.md).
See [OPERATOR_TODO.md](/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint/docs/OPERATOR_TODO.md).

## Request Authentication

- For pre-approval preview deploys, if `LAUNCHPAD_LINT_SHARED_SECRET` is set, requests
  hitting `/mcp` must include `x-launchpad-lint-secret`.
- After AgenticMarket approval, if `AGENTICMARKET_SECRET` is set, requests hitting
  `/mcp` must include `x-agenticmarket-secret` exactly as documented by
  AgenticMarket.

If neither variable is set, local development remains open.

## Health Check

- `GET /health`

## Telemetry

Each tool call now emits a structured telemetry envelope through the application
logger and, by default, appends the same event to a durable NDJSON file with:

- tool name
- request id
- latency
- success or failure
- approximate input and output payload sizes

Set `LAUNCHPAD_LINT_ENVIRONMENT` to label events by environment.
Set `LAUNCHPAD_LINT_TELEMETRY_PATH` to control where the durable telemetry stream is written.

Telemetry summary is available at:

- `GET /telemetry/summary`

## Feedback Loop

Launchpad Lint now exposes a minimal feedback surface so a session can be evaluated
after use:

- `POST /feedback`: upsert one reviewer feedback record
- `GET /feedback/summary`: return compact aggregate quality metrics

Each reviewer keeps one latest record that can be replaced later. Set
`LAUNCHPAD_LINT_FEEDBACK_PATH` to control where the durable feedback file is written.

## Registry Metadata

The app now exposes:

- `GET /server.json`
- `GET /.well-known/mcp/server-card.json`

## Smoke Check

After deploying to any surface, run:

```bash
deploy/smoke_check.sh <base-url>
```
