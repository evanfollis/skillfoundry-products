# Portfolio Intake

## Purpose

Skillfoundry needs one obvious place to drop new product ideas before they are mature
enough to become a shipped product.

This intake lane exists to stop good ideas from disappearing into chat history while
also preventing half-shaped ideas from being treated like committed roadmap work.

## When To Use This

Use this intake lane when:

- a new product idea or portfolio strategy appears during product work
- a launch suggests a follow-on product
- a pricing or channel result implies a new wedge
- a critique reveals a repeatable bottleneck that deserves its own product lane

Do not add an idea directly to `products/` until it has passed through intake,
proposal, scorecard review, and hypothesis definition.

## Required Artifacts

For every new idea dropped into the factory:

1. one short strategy note if the idea is a suite or portfolio pattern
2. one or more proposal files using `docs/SKILL_PROPOSAL_TEMPLATE.md`
3. one hypothesis file if the next move is concrete enough to test
4. one portfolio placement decision in `docs/BUILD_NEXT_PORTFOLIO.md`

## Canonical Location

Use:

- `docs/proposals/`

Suggested file shapes:

- `docs/proposals/<portfolio-or-suite>.md`
- `docs/proposals/<skill-slug>.md`
- `docs/proposals/<skill-slug>-hypothesis.md`

## Intake Workflow

1. write the smallest clear statement of the bottleneck
2. decide whether it is a single skill or a suite pattern
3. write a proposal using the template
4. score it against the factory scorecard
5. place it in the build-next portfolio
6. only then decide whether it graduates into `products/`

## Decision Labels

Every intake item should carry one label:

- `build_now`
- `keep_warm`
- `hold`
- `kill`

## Current Use

This intake lane is now the default drop-off point for the builder free-wedge /
paid-fix portfolio concept.
