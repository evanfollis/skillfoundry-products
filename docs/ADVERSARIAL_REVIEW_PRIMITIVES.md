# Adversarial Review Primitives

## Purpose

Skillfoundry should not rely on one generic "looks good" review pass.

For builder-facing products, especially products that claim judgment, packaging, or
strategy value, the factory should run explicit adversarial critiques from multiple
angles before and after launch.

The goal is not negativity for its own sake.

The goal is to turn blunt skepticism into reusable workflow primitives that:

- sharpen the product,
- expose weak assumptions early,
- create repeatable evaluation structure,
- and feed observed learning back into future build decisions.

## Core Rule

Every meaningful product should be pressure-tested along named dimensions, not just by
one overall quality score.

At minimum, each adversarial review should answer:

- where is this product genuinely strong,
- where is it replaceable,
- where does it fail to justify price,
- what would block repeat usage,
- what is structurally hard to scale,
- and what reusable primitive should be extracted from the learning.

## Review Dimensions

Score each dimension from `1` to `5`.

- `design_architect_quality`
  - How coherent, durable, and internally consistent the product and runtime design
    are.
- `usefulness`
  - How likely the product is to save real time, reduce ambiguity, or improve outcomes
    in the target workflow.
- `originality`
  - How non-commodity the product feels relative to general-purpose LLM prompting and
    common free utilities.
- `marketability`
  - How legible the value proposition is in one short listing, one screenshot, or one
    example session.
- `scalability`
  - How well the product can sustain more users, more requests, and broader channel
    distribution without fragile operator intervention.
- `leveragability`
  - How much of the product's logic, evaluation, and infrastructure can be reused by
    future products in the factory.
- `pricing_power`
  - How confidently the product can justify charging rather than merely existing.
- `activation_clarity`
  - How quickly a new user can understand the product, try it, and judge whether it
    worked.
- `defensibility`
  - How much of the value comes from productized structure, evidence, and workflow
    design rather than from generic model prose.

## Required Outputs

Each adversarial review should return all of the following:

- `dimension_scores`
- `top_strengths`
- `top_liabilities`
- `replaceability_risk`
- `price_justification`
- `attack_vectors`
- `keep_or_fix_decision`
- `fixes_by_dimension`
- `factory_primitives_to_extract`

## Attack Vector Format

Every critique should try at least one attack vector from each class:

- `commodity attack`
  - "Why can a user not get 80 percent of this from a general assistant?"
- `market attack`
  - "Why would anyone browse, install, or pay for this rather than a free option?"
- `activation attack`
  - "Where does the first session become confusing, slow, or inconclusive?"
- `scope attack`
  - "Where is the product too broad, too vague, or over-promising?"
- `scaling attack`
  - "What breaks first when demand, inputs, or channels grow?"
- `factory attack`
  - "What part of this is one-off work rather than reusable capability?"

## First-Class Workflow Primitives

These should become explicit reusable factory primitives.

### 1. Pre-build adversarial concept review

Run before implementation starts.

Purpose:

- kill weak ideas sooner,
- tighten target user and bottleneck framing,
- and expose weak paid-value assumptions before build time is spent.

### 2. Pre-launch adversarial listing review

Run when the product is working but before distribution begins.

Purpose:

- challenge marketability,
- challenge price justification,
- challenge listing clarity,
- and identify what makes the product feel generic.

### 3. Post-launch adversarial performance review

Run after real traffic or review feedback exists.

Purpose:

- interpret weak activation honestly,
- separate runtime failure from product failure,
- and convert qualitative objections into factory heuristics.

### 4. Primitive extraction review

Run whenever one product develops a valuable critique pattern, evaluator, or rubric.

Purpose:

- decide whether the learning stays local to one product,
- or becomes a reusable scoring, prompting, or evaluation primitive for future skills.

## Decision Heuristic

Use this decision table after each adversarial review:

- `high usefulness` + `high pricing_power` + `low replaceability_risk`
  - keep paid and increase confidence
- `high usefulness` + `low marketability`
  - improve packaging, examples, and listing clarity
- `high marketability` + `low usefulness`
  - tighten or kill; do not hide shallow utility behind strong copy
- `high usefulness` + `low defensibility`
  - add structure, evidence, and workflow-specific checks
- `high leveragability` + `low immediate demand`
  - keep if the primitive strengthens future products materially

## Factory Feedback Loop

Adversarial review is only useful if it updates factory behavior.

Each review should explicitly update at least one of:

- the build-next scorecard,
- the activation heuristic,
- the pricing heuristic,
- the quality bar for builder-facing outputs,
- or the reusable primitive library.

If it changes none of those, it was commentary, not a primitive.

## Minimum Review Cadence

For every new external product:

1. run one pre-build adversarial concept review
2. run one pre-launch adversarial listing review
3. run one post-launch adversarial performance review after the first observation window

## Launchpad Lint Implication

`launchpad-lint` should evolve from a generic launch-readiness checker into a more
explicit multi-lens evaluator.

The product should not only say:

- blockers,
- warnings,
- strengths,
- suggested fixes

It should also say:

- whether the product feels paid-worthy,
- whether the value is generic or differentiated,
- whether the listing is marketable,
- where the first user session will fail,
- and what structural weaknesses will limit scale or reuse.
