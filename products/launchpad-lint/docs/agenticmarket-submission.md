# AgenticMarket Submission Payload

Use this as the exact copy-paste starting point for the AgenticMarket submission form.

## Listing Fields

- server URL:
  `https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp`
- visibility:
  `unlisted`
- price per successful call:
  `$0.09`

## Short Description

Audit MCP launch readiness and draft a marketplace-ready package for technical builders.

## Long Description

`launchpad-lint` helps technical builders decide whether an MCP server is actually
ready for a public marketplace launch. The first tool audits a candidate package and
surfaces blockers, warnings, strengths, and suggested fixes. The second tool drafts
the minimum launch package needed for a credible first listing: concise description,
example prompts, explicit limits, and pricing questions that still require human
judgment.

This product is intentionally narrow. It is built for builders who already have a
working MCP server and want to turn that server into a clearer first public launch,
not for broad go-to-market automation.

## Example Prompts

- Audit whether my MCP server is ready for a first marketplace launch.
- Tell me what is missing from this server package before I submit it publicly.
- Draft a launch package for this builder-facing MCP server.

## Limits

- Best for narrow builder-facing MCP servers, not broad product strategy.
- Depends on the quality of the provided tool descriptions and docs.
- Does not automate marketplace submission or final pricing decisions.

## Operator Notes

- If AgenticMarket asks for auth details, the product currently supports:
  - `x-launchpad-lint-secret` before approval
  - `x-agenticmarket-secret` after approval
- Switch the production environment to `AGENTICMARKET_SECRET` only after the platform
  provides the proxy secret.
