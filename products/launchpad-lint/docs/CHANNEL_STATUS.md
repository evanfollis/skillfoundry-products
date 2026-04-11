# Launchpad Lint Channel Status

## Goal

Track which monetization and discovery arms are prepared, launched, or killed.

## Current State

### AgenticMarket

- status: ready for operator submission
- canonical runtime: `https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp/`
- pricing target: `$0.09` per successful call
- visibility target: `unlisted`
- payment role: primary current payment arm

### Smithery

- status: ready for operator submission
- canonical runtime: `https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp/`
- server card: `https://skillfoundry.synaplex.ai/products/launchpad-lint/.well-known/mcp/server-card.json`
- payment role: discovery and install arm

### MCP Registry

- status: ready for operator publish
- manifest URL: `https://skillfoundry.synaplex.ai/products/launchpad-lint/server.json`
- registry name: `io.github.evanfollis/launchpad-lint`
- payment role: discovery arm

### RapidAPI

- status: ready for submission
- OpenAPI spec: `docs/openapi.yaml`
- REST endpoints: `/api/audit` (POST), `/api/draft` (POST)
- payment role: primary payment arm (platform-managed billing, ~20% commission)
- discovery: large existing developer user base, search, recommendations
- telemetry: provider analytics API
- submission method: upload OpenAPI spec via RapidAPI Provider Dashboard or Provider API

### Direct x402

- status: deferred
- reason: better fit for the future TypeScript lane than a rushed Python-only retrofit
