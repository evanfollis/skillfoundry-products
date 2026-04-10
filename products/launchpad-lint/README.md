# Launchpad Lint

`launchpad-lint` is the first external Skillfoundry product candidate.

It helps technical builders audit whether an MCP server is actually ready for a public
marketplace launch and drafts the minimum package needed to submit credibly.

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

## Preview Secret

When `LAUNCHPAD_LINT_SHARED_SECRET` is set, requests hitting `/mcp` must include the
`x-launchpad-lint-secret` header. Local development works without that variable.

## Health Check

- `GET /health`
