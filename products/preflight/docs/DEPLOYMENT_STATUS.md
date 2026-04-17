# Preflight Deployment Status

## Live Endpoints

All responding as of 2026-04-11:

| Endpoint | URL | Status |
|----------|-----|--------|
| Health | `https://skillfoundry.synaplex.ai/products/preflight/health` | live |
| REST API | `https://skillfoundry.synaplex.ai/products/preflight/api/check` | live |
| MCP JSON-RPC | `https://skillfoundry.synaplex.ai/products/preflight/mcp/` | live |
| Registry manifest | `https://skillfoundry.synaplex.ai/products/preflight/server.json` | live |
| Server card | `https://skillfoundry.synaplex.ai/products/preflight/.well-known/mcp/server-card.json` | live |

## Infrastructure

- Runs as Node.js process on Hetzner CPX31 (port 8030)
- Behind nginx gateway (port 8020) + Cloudflare Tunnel
- systemd service: `preflight.service` (enabled, auto-restart)
- 8MB memory footprint, <1ms response latency

## Distribution Channels

### MCP Registry
- **Status:** server.json validated, ready to publish
- **Server name:** `io.github.evanfollis/preflight`
- **Remaining step:** Run these commands:
  ```bash
  cd /opt/workspace/projects/skillfoundry/skillfoundry-products/products/preflight
  mcp-publisher login github
  # Browser: go to https://github.com/login/device, enter the displayed code
  mcp-publisher publish
  ```
- **Verify:** `curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.evanfollis/preflight"`

### Smithery
- **Status:** Streamable HTTP transport ready, server-card served
- **Remaining step:** Go to https://smithery.ai/new and enter:
  ```
  https://skillfoundry.synaplex.ai/products/preflight/mcp/
  ```
  Complete the publishing flow in browser.

### GitHub (public repo)
- **Status:** Standalone repo prepared at `/tmp/tmp.xKxpNBTw9C/preflight/`
- **Remaining steps:**
  1. Create repo at https://github.com/new → name: `preflight`, public, no template
  2. Then:
     ```bash
     cd /tmp/tmp.xKxpNBTw9C/preflight
     GIT_SSH_COMMAND="ssh -i /root/.ssh/github" git remote add origin git@github.com:evanfollis/preflight.git
     GIT_SSH_COMMAND="ssh -i /root/.ssh/github" git push -u origin main
     ```
- **Alternative:** Authenticate `gh` CLI:
  ```bash
  gh auth login
  gh repo create evanfollis/preflight --public --source=/tmp/tmp.xKxpNBTw9C/preflight --push
  ```

### npm
- **Status:** Not yet configured (package is private in package.json)
- **Remaining steps:** Change `"private": true` to `false`, add `"bin"` field, `npm publish --access public`
- **Note:** npm distribution is lower priority since Preflight is a remote server, not a CLI tool

## What's Automated

- Service auto-restarts on failure (systemd)
- Nginx reloads preserve routing
- Code changes: edit src → `npx tsc` → `systemctl restart preflight`
- Products repo pushes update GitHub: `cd /opt/workspace/projects/skillfoundry/skillfoundry-products && git push`
