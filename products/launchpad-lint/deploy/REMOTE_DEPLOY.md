# Remote Deploy

This product is intended to run on the Hetzner Skillfoundry server behind the existing
Cloudflare tunnel.

## Proposed Hostname

`launchpad.synaplex.ai`

## Runtime Shape

- systemd service
- `uvicorn` bound to `127.0.0.1:8010`
- Cloudflare Tunnel ingress routing the hostname to that local port

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

## Cloudflare Tunnel

Add this ingress rule to `/etc/cloudflared/config.yml` before the final `http_status:404`
entry:

```yaml
- hostname: launchpad.synaplex.ai
  service: http://localhost:8010
```

Then restart cloudflared:

```bash
systemctl restart cloudflared
systemctl status cloudflared
```

If the hostname does not already exist in Cloudflare DNS for the tunnel, create it with:

```bash
cloudflared tunnel route dns mentor launchpad.synaplex.ai
```

## Verification

```bash
curl -I https://launchpad.synaplex.ai/health
curl https://launchpad.synaplex.ai/health
```
