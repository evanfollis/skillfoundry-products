# Skill Factory Scorecard

## Purpose

Use this scorecard before building a new external skill. The goal is to rank
opportunities by expected cash flow quality, not by novelty.

## Scoring

Score each candidate from `1` to `5` on each dimension:

- `pain_frequency`: how often the bottleneck appears in real workflows
- `time_to_value`: how quickly a first session can prove usefulness
- `willingness_to_pay`: how legible the value is relative to per-call cost
- `repeatability`: how likely the skill is to be used again after a good first run
- `operational_stability`: how likely the runtime is to stay reliable under production load
- `distribution_fit`: how well the skill matches existing agent or builder channels
- `evaluation_clarity`: how easy it is to tell success from failure with real data
- `build_leverage`: how much of the implementation can reuse existing primitives

## Kill Criteria

Do not build a candidate if any of these are true:

- the first session requires too much hidden context
- value is mostly subjective and difficult to measure
- the likely tool surface is broad or ambiguous
- quality depends on manual operator intervention
- production reliability depends on fragile third-party behavior

## Promotion Threshold

Prefer candidates that:

- score at least `4` on `pain_frequency`
- score at least `4` on `time_to_value`
- score at least `4` on `evaluation_clarity`
- have no score below `3` in `operational_stability`

## Notes To Capture

For each candidate, write down:

- target user
- bottleneck statement
- smallest credible tool set
- activation metric
- likely failure mode
- evidence source

## Ranking Heuristic

When two candidates are close, prefer the one with:

- faster activation
- lower operational variance
- clearer repeat-use path
- easier measurement

That is usually better for early cash flow than a larger but fuzzier opportunity.
