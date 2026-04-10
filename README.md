# skillfoundry-products

`skillfoundry-products` is the implementation repository for software artifacts that
Skillfoundry builds and operates.

This repo has two different lanes on purpose:

- `mechanisms/`: internal factory tools that help Skillfoundry identify, design, and
  improve opportunities. These are not automatically public products.
- `products/`: external, user-facing software artifacts that have been selected for
  public deployment, distribution, and monetization.

Public product routing should stay platform-centric. The preferred external shape is:

- `https://skillfoundry.synaplex.ai/products/<product-slug>/...`

not one public hostname per product.

The distinction matters. Internal mechanisms help the agent system think and decide
better. External products are what we eventually sell or distribute through channels
such as AgenticMarket.

## Current Layout

- `mechanisms/bottleneck-radar/`: internal MCP mechanism for turning noisy source
  signals into ranked bottlenecks and builder-ready opportunity briefs.
- `products/launchpad-lint/`: first external MCP product candidate for auditing launch
  readiness and drafting marketplace launch packages.

## Working Rule

Do not treat a mechanism as a product by default.

A mechanism graduates into a product only when Skillfoundry has made an explicit
decision that:

- the user-facing utility is clear,
- the deployment surface is chosen,
- the pricing or monetization path is chosen,
- and the artifact deserves its own external lifecycle.
