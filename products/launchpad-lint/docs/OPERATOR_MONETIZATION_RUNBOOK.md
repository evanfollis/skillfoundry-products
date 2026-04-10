# Launchpad Lint Operator Monetization Runbook

## Goal

Get `launchpad-lint` live on the channels that can already generate learning or
revenue, without waiting for the ecosystem to settle.

## What Is Ready Now

### Ready for immediate action

- AgenticMarket
- Smithery URL publishing
- MCP Registry publishing

### Not a same-day monetization arm yet

- direct x402 payments

Reason:

- x402 support is best served by the future TypeScript lane, not by rushing a bespoke
  Python payment layer into the current product.

## Canonical URLs

- homepage: `https://skillfoundry.synaplex.ai/products/launchpad-lint/`
- health: `https://skillfoundry.synaplex.ai/products/launchpad-lint/health`
- mcp: `https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp`
- feedback summary: `https://skillfoundry.synaplex.ai/products/launchpad-lint/feedback/summary`
- telemetry summary: `https://skillfoundry.synaplex.ai/products/launchpad-lint/telemetry/summary`
- server card: `https://skillfoundry.synaplex.ai/products/launchpad-lint/.well-known/mcp/server-card.json`
- registry manifest: `https://skillfoundry.synaplex.ai/products/launchpad-lint/server.json`

## Channel 1: AgenticMarket

### Repo state

Already prepared:

- secret middleware support in the app
- listing copy in `docs/agenticmarket-listing.md`
- revenue hypothesis in `docs/REVENUE_HYPOTHESIS.md`

### You need to do this

1. Fix the wallet funding issue in your AgenticMarket account.
2. Go to `https://agenticmarket.dev/dashboard/submit`.
3. Submit:
   - upstream URL: `https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp`
   - short description: `Audit MCP launch readiness and draft a marketplace-ready package for technical builders.`
   - price: `$0.09` per successful call
   - visibility: `unlisted`
4. When AgenticMarket gives you the proxy secret, set `AGENTICMARKET_SECRET` in the live environment.
5. Run:

```bash
deploy/smoke_check.sh https://skillfoundry.synaplex.ai/products/launchpad-lint
```

## Channel 2: Smithery

### Repo state

Already prepared:

- public server card endpoint
- canonical remote endpoint
- channel experiment docs

### You need to do this

Use either the UI or the CLI.

UI path:

1. Go to `https://smithery.ai/new`.
2. Enter:
   `https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp`
3. Complete the URL publish flow.

CLI path:

```bash
npx -y @smithery/cli@latest mcp publish "https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp" -n @evanfollis/launchpad-lint
```

Important:

- Smithery URL publishing requires Streamable HTTP, which `launchpad-lint` already has.
- Smithery supports auth-required servers only when the auth story is compatible with
  its flow. If the secret-protected endpoint blocks scanning, use the static server
  card already exposed by the app and expect Smithery to serve primarily as a
  distribution/analytics arm, not a direct payment arm.

## Channel 3: MCP Registry

### Repo state

Already prepared:

- `products/launchpad-lint/server.json`
- `.github/workflows/publish-launchpad-lint-mcp.yml`
- GitHub-based registry name: `io.github.evanfollis/launchpad-lint`

### You need to do this

Manual first publish:

1. Install the publisher:

```bash
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher
sudo mv mcp-publisher /usr/local/bin/
```

2. From `products/launchpad-lint`, authenticate with GitHub:

```bash
mcp-publisher login github
```

3. Publish:

```bash
cd /opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint
mcp-publisher publish
```

4. Verify:

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.evanfollis/launchpad-lint"
```

Optional automation after the first successful publish:

- push a tag like `launchpad-lint-v0.1.0` to trigger the workflow

## What To Check After Every Channel Launch

1. `deploy/smoke_check.sh https://skillfoundry.synaplex.ai/products/launchpad-lint`
2. confirm the listing points to the canonical Skillfoundry runtime
3. record the channel in `docs/CHANNEL_EXPERIMENT_TEMPLATE.md`
4. watch:
   - `/feedback/summary`
   - `/telemetry/summary`

## Decision Rule

- If a channel brings activations, keep it.
- If a channel brings installs but weak activation, tighten the listing or target user.
- If a channel creates friction without traffic or activation, kill it fast.
