# Builder Diagnose / Paid Fix Suite

## Pattern

Use a free builder-facing diagnosis server as the wedge, then route qualified users
into narrow paid remediation servers that solve the specific problems diagnosed.

## Why This Exists

`launchpad-lint` is a valid paid probe, but it is also a signal that builder-facing
judgment products may need a lower-friction diagnostic front door before a user will
pay for deeper help.

This suite treats diagnosis and remediation as separate jobs:

- the free wedge creates discovery, trust, and problem classification
- the paid operators perform the actual repair or high-value transformation work

## Design Rule

The free product must be genuinely useful on its own.

It cannot function as fake value whose only purpose is to upsell.

The paid follow-ons must be:

- narrow
- outcome-oriented
- better than generic prompting
- and clearly mapped to diagnosed failure modes

## Proposed Suite Shape

### 1. Free wedge

- `builder-bottleneck-diagnosis`

Purpose:

- inspect a builder's server package or product concept
- classify the top issues
- score severity
- route to the best next move

### 2. Paid fix lane: listing and package repair

- `listing-repair-operator`

Purpose:

- take weak launch copy and convert it into a stronger listing package

### 3. Paid fix lane: positioning and differentiation

- `positioning-sharpener`

Purpose:

- make a product feel less generic, more paid-worthy, and more market-legible

### 4. Paid fix lane: compliance and submission hardening

- `submission-hardener`

Purpose:

- close practical gaps that cause marketplace rejection or weak review outcomes

## Business Logic

The free wedge broadens top-of-funnel and creates evidence about what problems occur
most often.

The paid lanes monetize only where the user has already shown a concrete diagnosed
need.

That means the suite learns:

- which bottlenecks actually recur
- which bottlenecks users will pay to fix
- which paid operators deserve to stay alive

## Risks

- diagnosis could feel like a disguised upsell
- remediation products could still feel replaceable by generic prompting
- too many follow-on servers could create portfolio sprawl

## Guardrails

- every diagnosis should include a self-serve path, not only paid next steps
- every paid server should own one narrow failure mode
- kill paid fix lanes quickly if they do not show clearer willingness to pay than the
  diagnostic wedge

## Current Decision

- `keep_warm`

Reason:

- strong strategic shape
- strong portfolio logic
- should be built as a new suite, not stapled onto `launchpad-lint`
- but the exact first wedge and first paid fix lane should be chosen deliberately
