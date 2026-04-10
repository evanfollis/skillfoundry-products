# Launchpad Lint Adversarial Review Spec

## Problem

The current `launchpad-lint` product does a useful deterministic pass, but it is still
too close to a generic launch checklist.

Current output is:

- `readiness_score`
- `blockers`
- `warnings`
- `strengths`
- `suggested_fixes`

That is enough for a first narrow launch-readiness product.

It is not enough to operationalize the kind of blunt, multi-dimensional critique needed
to justify a paid builder-facing product.

## Product Goal

Make `launchpad-lint` feel less like "good advice" and more like a productized
adversarial reviewer that a builder cannot easily replace with one generic prompt.

## New First-Class Review Dimensions

The product should explicitly score:

- `design_architect_quality`
- `usefulness`
- `originality`
- `marketability`
- `scalability`
- `leveragability`
- `pricing_power`
- `activation_clarity`
- `defensibility`

Each score should be:

- `1` to `5`
- justified with one short rationale
- linked to one concrete fix when below `4`

## Recommended New Tool

Add:

- `adversarial_launch_review`

### Purpose

Run a deliberately skeptical multi-lens review of a candidate MCP product or launch
package.

### Suggested Inputs

- `server_name`
- `target_user`
- `tool_names`
- `tool_descriptions`
- `readme_text`
- `listing_draft`
- `endpoint_url`
- `pricing_context`
- `comparison_context`
- `channel`

### Suggested Outputs

- `dimension_scores`
- `dimension_rationales`
- `top_strengths`
- `top_liabilities`
- `replaceability_risk`
- `price_justification`
- `marketplace_fit`
- `attack_vectors`
- `fixes_by_dimension`
- `verdict`

## Attack Vector Library

The new tool should always generate attacks across multiple classes.

### Commodity attack

- "Why is this not replaceable by a general assistant plus one good prompt?"

### Free alternative attack

- "Why would a user pay for this instead of choosing a free utility in the same
  marketplace?"

### Activation attack

- "What will confuse a first user in the first two minutes?"

### Positioning attack

- "What in the copy still sounds generic, inflated, or weakly differentiated?"

### Scale attack

- "What breaks when usage grows 10x?"

### Factory attack

- "Which part of this is reusable across Skillfoundry and which part is one-off?"

## Output Structure Recommendation

The review should not collapse everything into one summary.

Preferred output shape:

1. `verdict`
2. `dimension_scores`
3. `top_strengths`
4. `top_liabilities`
5. `attack_vectors`
6. `fixes_by_dimension`
7. `factory_primitives_to_extract`

## Workflow Recommendation

Use `launchpad-lint` in a three-pass sequence.

### Pass 1: launch readiness

Use current:

- `audit_launch_readiness`

Purpose:

- remove obvious blockers
- tighten docs
- tighten endpoint and listing basics

### Pass 2: adversarial review

Use new:

- `adversarial_launch_review`

Purpose:

- challenge paid justification
- challenge originality
- challenge market fit
- challenge activation and replaceability

### Pass 3: revised package drafting

Use current:

- `draft_launch_package`

Purpose:

- rewrite the listing after the adversarial critique, not before

## Launchpad Lint V2 Quality Bar

`launchpad-lint` should be considered materially improved when it can do all of the
following:

- identify why a product feels generic rather than only whether docs are missing
- explain whether the product deserves to be paid or free
- distinguish product weakness from packaging weakness
- highlight first-session activation risk
- propose fixes grouped by dimension rather than one flat fix list
- output reusable factory heuristics from each critique

## How To Feed Learning Back Into Skillfoundry

Each adversarial review should end with:

- one change to the product under review
- one change to the factory heuristic
- one reusable primitive to extract, if any

That means a `launchpad-lint` review should not only improve the reviewed server.

It should also improve:

- the build-next scorecard
- the launch review bar
- the pricing heuristic
- or the next evaluator we build

## Immediate Next Product Changes

Shortest credible path:

1. extend the models to support dimension scores and critiques
2. add deterministic heuristics for obvious weak signals per dimension
3. add one new public MCP tool: `adversarial_launch_review`
4. update listing copy and examples to mention adversarial multi-lens review explicitly
5. capture review feedback on whether the critique felt specific or generic

## Why This Matters

If `launchpad-lint` remains only a launch checklist, it will stay "useful but
replaceable."

If it becomes a productized adversarial reviewer with explicit multi-lens critique and
factory-grade outputs, it has a much better chance of justifying paid usage and of
creating reusable Skillfoundry primitives.
