# Remote Deploy

This product is intended to run on the Hetzner Skillfoundry server behind the existing
Cloudflare tunnel.

## Canonical External Route

`https://skillfoundry.synaplex.ai/products/launchpad-lint/`

## Runtime Shape

- systemd service
- `uvicorn` bound to `127.0.0.1:8010`
- Skillfoundry platform gateway routing `/products/launchpad-lint/` to that local port

## Server Paths

- repo root: `/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint`
- env file: `/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint/.env.production`
- service file: `/etc/systemd/system/launchpad-lint.service`

## Install Steps

```bash
cd /opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint
python3.12 -m venv .venv
source .venv/bin/activate
python3.12 -m pip install -e .[dev]
cp deploy/.env.production.example .env.production
```

Populate:

- `LAUNCHPAD_LINT_SHARED_SECRET` for pre-approval testing
- `AGENTICMARKET_SECRET` only after the listing is approved and the dashboard provides
  the proxy secret

## systemd

```bash
cp deploy/launchpad-lint.service /etc/systemd/system/launchpad-lint.service
systemctl daemon-reload
systemctl enable --now launchpad-lint
systemctl status launchpad-lint
```

## Platform Gateway

Install the shared gateway first using:

- `/opt/projects/skillfoundry/skillfoundry-products/deploy/REMOTE_PLATFORM.md`

The product service itself stays on `127.0.0.1:8010`. The gateway exposes it at:

- `/products/launchpad-lint/health`
- `/products/launchpad-lint/mcp`

## Verification

```bash
curl -I https://skillfoundry.synaplex.ai/products/launchpad-lint/health
curl https://skillfoundry.synaplex.ai/products/launchpad-lint/health
deploy/smoke_check.sh https://skillfoundry.synaplex.ai/products/launchpad-lint
```

## Other Surfaces

This product now includes additional deployment artifacts for comparison:

- `render.yaml`
- `railway.toml`
- `fly.toml`
- `Dockerfile`
- `deploy/DEPLOYMENT_SURFACES.md`
