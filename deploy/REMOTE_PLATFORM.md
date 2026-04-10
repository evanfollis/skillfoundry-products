# Skillfoundry Platform Gateway

Skillfoundry products should not each claim their own public subdomain by default.

The canonical external surface is:

- platform host: `skillfoundry.synaplex.ai`
- product route shape: `/products/<product-slug>/...`

For `launchpad-lint`, the canonical external URLs are:

- `https://skillfoundry.synaplex.ai/products/launchpad-lint/health`
- `https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp`

## Gateway Runtime

- Nginx bound to `127.0.0.1:8020`
- Cloudflare Tunnel ingress routing `skillfoundry.synaplex.ai` to that local port
- individual products continue to run on their own local ports behind the gateway

## Install Nginx

```bash
apt-get update
apt-get install -y nginx
```

## Install Gateway Config

```bash
cp /opt/projects/skillfoundry/skillfoundry-products/deploy/skillfoundry-gateway.nginx.conf /etc/nginx/conf.d/skillfoundry.conf
nginx -t
systemctl enable --now nginx
systemctl reload nginx
```

## Cloudflare Tunnel

Add this ingress rule to `/etc/cloudflared/config.yml`:

```yaml
- hostname: skillfoundry.synaplex.ai
  service: http://127.0.0.1:8020
```

Then restart cloudflared:

```bash
systemctl restart cloudflared
systemctl status cloudflared
```

If needed, create the DNS route:

```bash
cloudflared tunnel route dns mentor skillfoundry.synaplex.ai
```

## Design Rule

New products should normally be added as new route blocks under `/products/<slug>/`
rather than as new public hostnames.
