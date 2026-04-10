# AgenticMarket Submission Payload

Use this as the exact copy-paste starting point for the current AgenticMarket
submission form.

## Submission Strategy

Recommended first launch settings:

- keep `List in Marketplace` off
- submit as `Paid`
- use the canonical Skillfoundry MCP URL
- keep the listing private until one clean external activation happens

Reason:

- the canonical runtime is live and healthy
- the public metadata surfaces are live
- the MCP endpoint currently requires a header for pre-approval access, so a private
  first listing is the lowest-friction way to start the review loop

## Exact Form Entries

### Server Name

`launchpad-lint`

### Description

`Audit MCP launch readiness and draft a marketplace-ready package for technical builders.`

### Long Description

```text
launchpad-lint helps technical builders decide whether an MCP server is actually ready for a public marketplace launch.

The first tool audits a candidate package and surfaces blockers, warnings, strengths, and suggested fixes.

The second tool drafts the minimum launch package needed for a credible first listing: concise description, example prompts, explicit limits, and pricing questions that still require human judgment.

This product is intentionally narrow. It is built for builders who already have a working MCP server and want to turn that server into a clearer first public launch, not for broad go-to-market automation.

Example prompts:
- Audit whether my MCP server is ready for a first marketplace launch.
- Tell me what is missing from this server package before I submit it publicly.
- Draft a launch package for this builder-facing MCP server.

Limits:
- Best for narrow builder-facing MCP servers, not broad product strategy.
- Depends on the quality of the provided tool descriptions and docs.
- Does not automate marketplace submission or final pricing decisions.
```

### Category

`AI`

### List in Marketplace

`off`

### Endpoint URL

`https://skillfoundry.synaplex.ai/products/launchpad-lint/mcp/`

### Server Type

`Paid`

## Verified Runtime Status

Verified on `2026-04-10`:

- `GET /health` returns `200`
- `GET /feedback/summary` returns `200`
- `GET /telemetry/summary` returns `200`
- `GET /.well-known/mcp/server-card.json` returns `200`
- `GET /server.json` returns `200`
- `GET /mcp/` without auth returns `401 Unauthorized`

## Auth Note For Review

The live MCP endpoint is intentionally protected before marketplace approval.

If AgenticMarket asks how to access the endpoint during review, send:

```text
This server uses a header-gated preview mode before approval. If your reviewer or proxy needs pre-approval access, I can provide the preview header details directly. After approval I will switch the deployment to your required x-agenticmarket-secret header.
```

If AgenticMarket provides a proxy secret after approval:

- set `AGENTICMARKET_SECRET` in the live environment
- remove the pre-approval dependency on `x-launchpad-lint-secret`
- rerun the smoke check

## Decision Rule

Submit now if:

- the form accepts a private paid listing with the URL above
- AgenticMarket can either review a header-protected endpoint or accept the listing
  pending post-approval secret setup

Pause only if:

- AgenticMarket rejects protected endpoints during review
- or requires an immediately public unauthenticated MCP route
