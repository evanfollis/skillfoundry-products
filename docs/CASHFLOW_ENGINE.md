# Skillfoundry Cash Flow Engine

## Goal

Create a repeatable system that turns repeated bottlenecks into narrow hosted skills,
measures whether they create real value, and compounds on that learning over time.

This system should also operate as a learning lab: mistakes, weak signals, and wins
must all become reusable evidence rather than isolated anecdotes.

## Default Product Shape

The default external product lane is now:

- TypeScript-first
- remote MCP over Streamable HTTP
- stateless by default
- hosted on Skillfoundry-controlled infrastructure
- deployed to Cloudflare Workers unless the skill needs a heavier runtime

Use Python only when the skill genuinely requires Python-native libraries or
long-running compute that would add more friction to a Workers-based design than it
removes.

## Operating Loop

1. identify repeated bottlenecks
2. score candidate skills using the factory scorecard
3. build the smallest narrow remote skill that can create value in one session
4. deploy it behind a stable Skillfoundry-owned endpoint
5. capture activation, reliability, latency, and repeat-usage telemetry
6. compare predicted value against observed value using explicit hypotheses
7. keep, improve, or kill the lane
8. feed the learning back into future ranking and build choices

## Design Rules

- Prefer one skill with one clear job over broad multipurpose servers.
- Prefer 1-3 tools per skill.
- A new skill should have one explicit activation metric before deployment.
- Do not rely on marketplace-specific routing or billing for core runtime viability.
- Every shipped skill must emit a stable telemetry envelope for later valuation work.
- Every public skill should be callable through a Skillfoundry-owned hostname even if it
  is also listed elsewhere.

## Hosting Rule

Use Cloudflare Workers as the default lane for:

- stateless request/response tools
- API wrappers
- formatting, validation, and ranking tools
- products whose value is visible in one short session

Escalate to a heavier runtime only when the product needs:

- Python-native inference or data tooling
- long-running jobs
- large binary dependencies
- durable local filesystem assumptions

## Cash Flow Rule

A lane stays alive only if it shows at least one of:

- clean activation from install to first successful outcome
- repeat use in the first value cycle
- strong evidence that users would be disappointed if the skill disappeared

Vanity installs are not evidence of demand.

## Compounding Learning Rule

Each shipped skill must create reusable learning in four buckets:

- acquisition: what kind of bottleneck actually causes users to try the skill
- activation: what first workflow gets users to value quickly
- economics: what latency, cost, and reliability profile is acceptable
- retention: what makes agents or operators call the skill again

That learning must be fed back into:

- candidate ranking
- default tool shapes
- pricing decisions
- deployment defaults

## Lab Standard

Skillfoundry should standardize on testable hypotheses, not decorative strategy
language.

Every major product move should have:

- a prewritten hypothesis
- measurable thresholds
- an observation window
- a review artifact that states what changed in the factory afterward

## Required Artifacts For New Skills

- product brief
- activation metric
- operator-grade README
- evaluation examples
- telemetry field map
- hypothesis record using `docs/HYPOTHESIS_TEMPLATE.md`
- skill proposal using `docs/SKILL_PROPOSAL_TEMPLATE.md`
- post-launch valuation note after the first live cycle
- post-launch review using `docs/POST_LAUNCH_REVIEW_TEMPLATE.md`
