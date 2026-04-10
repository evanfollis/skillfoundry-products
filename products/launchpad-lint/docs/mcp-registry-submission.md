# MCP Registry Submission Payload

The local manifest file is already prepared at:

- [server.json](/opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint/server.json)

## Registry Identity

- registry name:
  `io.github.evanfollis/launchpad-lint`
- title:
  `Launchpad Lint`
- version:
  `0.1.0`

## Canonical Remote

- remote type:
  `streamable-http`
- remote URL:
  `https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp/`

## Repository

- source:
  `github`
- url:
  `https://github.com/evanfollis/skillfoundry-products`

## Publish Command

```bash
cd /opt/projects/skillfoundry/skillfoundry-products/products/launchpad-lint
mcp-publisher publish
```

## Verify

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.evanfollis/launchpad-lint"
```
