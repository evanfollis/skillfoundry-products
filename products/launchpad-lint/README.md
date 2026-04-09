# Launchpad Lint

`launchpad-lint` is the first external Skillfoundry product candidate.

It helps technical builders audit whether an MCP server is actually ready for a public
marketplace launch and drafts the minimum package needed to submit credibly.

## Public Tools

- `audit_launch_readiness`
- `draft_launch_package`

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
