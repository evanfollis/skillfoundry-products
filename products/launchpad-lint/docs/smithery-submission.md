# Smithery Submission Payload

Use this as the exact operator reference for Smithery URL publishing.

## Canonical Runtime

- remote MCP URL:
  `https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp`
- homepage:
  `https://skillfoundry.synaplex.ai/products/launchpad-lint/`
- server card:
  `https://skillfoundry.synaplex.ai/products/launchpad-lint/.well-known/mcp/server-card.json`

## Suggested Display Name

Launchpad Lint

## Suggested Description

Audit MCP launch readiness and draft a marketplace-ready package for technical builders.

## Suggested Homepage

`https://skillfoundry.synaplex.ai/products/launchpad-lint/`

## Suggested Icon

Use the Skillfoundry brand icon if you have one ready. If not, publish without an icon
and add it later.

## Notes

- Smithery should point at the canonical hosted runtime, not a wrapper fork.
- If Smithery scanning has trouble with a protected endpoint, use the exposed static
  server card URL during the setup flow.
- Treat Smithery as a discovery and install arm first; judge it by session quality,
  not by vanity visibility.

## CLI Path

```bash
npx -y @smithery/cli@latest mcp publish "https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp" -n @evanfollis/launchpad-lint
```
