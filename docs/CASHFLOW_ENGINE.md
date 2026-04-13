# Skillfoundry Cash Flow Engine

## Goal

Create a repeatable system that turns repeated bottlenecks into the cheapest valid
commercial probes, measures whether they create real value, and compounds on that
learning over time.

This system should also operate as a learning lab: mistakes, weak signals, and wins
must all become reusable evidence rather than isolated anecdotes.

## Default Offering Shape

The default external MCP offering lane is now:

- TypeScript-first
- remote MCP over Streamable HTTP
- stateless by default
- hosted on Skillfoundry-controlled infrastructure
- deployed to Cloudflare Workers unless the offering needs a heavier runtime

Use Python only when the probe or offering genuinely requires Python-native libraries or
long-running compute that would add more friction to a Workers-based design than it
removes.

## Operating Loop

1. isolate one critical commercial assumption
2. design the cheapest valid probe that could falsify it
3. pre-register the target evidence class, evidence quality, and kill rule
4. expose the probe to external reality instead of relying on internal coherence
5. record typed evidence and an explicit decision
6. only after repeated strong external signal, promote the lane into an offering or portfolio candidate
7. keep, tighten, pivot, pause, or kill the lane explicitly
8. feed the learning back into future ranking and build choices

## Design Rules

- Prefer one probe with one clear falsification target over broad exploratory builds.
- Prefer one narrow MCP offering over broad multipurpose servers when the lane graduates.
- Prefer 1-3 tools per MCP probe or offering.
- A new probe should have one explicit success rule and one explicit falsification rule before deployment.
- Do not rely on marketplace-specific routing or billing for core runtime viability.
- Every shipped probe or offering must emit a stable telemetry envelope and support typed evidence recording for later valuation work.
- Every public offering should be callable through a Skillfoundry-owned hostname even if it
  is also listed elsewhere.
- Internal telemetry may improve execution quality, but it does not count as commercial validation by itself.

## Hosting Rule

Use Cloudflare Workers as the default lane for:

- stateless request/response tools
- API wrappers
- formatting, validation, and ranking tools
- offerings whose value is visible in one short session

Escalate to a heavier runtime only when the probe or offering needs:

- Python-native inference or data tooling
- long-running jobs
- large binary dependencies
- durable local filesystem assumptions

## Cash Flow Rule

A lane stays alive only if it shows admissible external evidence such as:

- strong external conversation tied to a concrete offer
- external commitment such as a request for pilot terms or proposal
- external transaction such as payment or repeated paid usage

Vanity installs are not evidence of demand. Internal migration wins are not evidence of
demand.

## Compounding Learning Rule

Each live probe or offering must create reusable learning in four buckets:

- acquisition: what kind of bottleneck actually causes users to engage with the probe
- activation: what first workflow gets users to value quickly
- economics: what latency, cost, and reliability profile is acceptable
- retention: what makes agents or operators call the skill again

That learning must be fed back into:

- candidate ranking
- default tool shapes
- pricing decisions
- deployment defaults

## Lab Standard

Skillfoundry should standardize on falsifiable assumptions, typed evidence, and explicit
decisions, not decorative strategy language.

Every major commercial move should have:

- a prewritten assumption or hypothesis
- pre-registered evidence targets
- measurable thresholds
- an observation window
- a decision artifact that states what changed in the factory afterward

## Required Artifacts For New Probes Or Offerings

- product or probe brief
- activation metric or primary commercial signal
- operator-grade README
- evaluation examples
- telemetry field map
- hypothesis record using `docs/HYPOTHESIS_TEMPLATE.md`
- probe proposal using `docs/SKILL_PROPOSAL_TEMPLATE.md`
- one typed evidence record for every commercial decision
- post-launch valuation note after the first live cycle
- post-launch review using `docs/POST_LAUNCH_REVIEW_TEMPLATE.md`
