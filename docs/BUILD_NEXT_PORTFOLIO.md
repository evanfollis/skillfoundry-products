# Build-Next Portfolio

## Goal

Rank the current external skill lanes by expected speed to first cash flow, quality of
learning, and long-term strategic leverage.

## Current Order

### 1. `launchpad-lint`

Why it is first:

- it is already implemented and deployable
- the value proposition is legible in one short workflow
- activation is measurable in one session
- operational variance is lower than the other top candidates
- it can produce revenue and learning without building a broader platform first

Decision:

- keep as the immediate revenue lane
- tighten the product, telemetry, and launch workflow
- do not rewrite the runtime before first market signal unless reliability requires it

## 2. docs-to-tool-surface design assistant

Why it is second:

- high pain and strategic importance
- stronger eventual moat if executed well
- likely repeat use from the same ICP

Why it is not first:

- harder retrieval and quality variance
- broader scope risk
- more ways to disappoint users before value is obvious

Decision:

- keep warm as the next major product candidate
- build only after `launchpad-lint` generates enough learning to sharpen the design

## 3. post-launch usage interpretation assistant

Why it matters:

- it becomes more valuable as more hosted skills exist
- it compounds factory learning directly

Why it is not first:

- it depends on usage data that the current product lane does not yet have
- it is more leverage than immediate cash flow

Decision:

- treat this as an internal leverage lane for now
- revisit once at least one skill has meaningful live telemetry

## TypeScript Rule

For near-term cash flow:

- keep the current Python `launchpad-lint` lane if it remains reliable enough to test
  the market quickly

For future external skills:

- default to the TypeScript remote skill lane
- only keep non-TypeScript runtimes where they create clear product advantage

## Revisit Trigger

Re-rank the portfolio if:

- `launchpad-lint` fails to activate despite product tightening
- a docs-to-tool-surface prototype shows unusually strong one-session value
- marketplace/distribution constraints make `launchpad-lint` structurally weaker than
  expected
- a new bottleneck scores materially higher on the factory scorecard
