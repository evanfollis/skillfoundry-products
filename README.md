# skillfoundry-products

`skillfoundry-products` is the implementation repository for software artifacts that
Skillfoundry builds and operates.

This repo has two different lanes on purpose:

- `mechanisms/`: internal factory tools that help Skillfoundry identify, design, and
  improve opportunities. These are not automatically public products.
- `products/`: external, user-facing software artifacts that have been selected for
  public deployment, distribution, and monetization.
- `templates/`: reusable implementation starters for future external product lanes.

Public product routing should stay platform-centric. The preferred external shape is:

- `https://skillfoundry.synaplex.ai/products/<product-slug>/...`

not one public hostname per product.

The distinction matters. Internal mechanisms help the agent system think and decide
better. External products are what we eventually sell or distribute through channels
such as AgenticMarket.

## Default External Stack

The default lane for new external hosted skills is now:

- TypeScript-first
- remote MCP over Streamable HTTP
- Cloudflare Workers for stateless skills
- Skillfoundry-owned public routes for the canonical runtime surface

That keeps the runtime independent from any single marketplace while preserving a
simple path to distribution through registries and marketplaces later.

## Current Layout

- `mechanisms/bottleneck-radar/`: internal MCP mechanism for turning noisy source
  signals into ranked bottlenecks and builder-ready opportunity briefs.
- `products/launchpad-lint/`: first external MCP product candidate for auditing launch
  readiness and drafting marketplace launch packages.
- `templates/remote-skill-ts/`: default starter for new remote TypeScript skills.

## Working Rule

Do not treat a mechanism as a product by default.

A mechanism graduates into a product only when Skillfoundry has made an explicit
decision that:

- the user-facing utility is clear,
- the deployment surface is chosen,
- the pricing or monetization path is chosen,
- and the artifact deserves its own external lifecycle.

## Factory Documents

- `docs/CASHFLOW_ENGINE.md`: repo-level operating loop for external skills
- `docs/BUILD_NEXT_PORTFOLIO.md`: current ranking of the next revenue lanes
- `docs/LEARNING_LAB.md`: standard for turning launches and failures into reusable learning
- `docs/HYPOTHESIS_TEMPLATE.md`: required hypothesis format for major changes
- `docs/SKILL_FACTORY_SCORECARD.md`: build-next scoring heuristic
- `docs/TELEMETRY_MODEL.md`: minimum telemetry envelope for compounding learning
- `docs/SKILL_PROPOSAL_TEMPLATE.md`: required pre-build proposal template
- `docs/POST_LAUNCH_REVIEW_TEMPLATE.md`: required after-launch learning template

## TypeScript Workspace Setup

The repo now includes a `pnpm` workspace for future TypeScript skills. If `pnpm` is not
installed globally, use `corepack`:

```bash
corepack pnpm install
```
