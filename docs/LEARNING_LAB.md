# Skillfoundry Learning Lab

## Purpose

Skillfoundry is not only a product factory. It is also a lab.

That means every meaningful build, launch, and iteration should produce evidence that
improves future decision-making. The system should get better at identifying,
building, deploying, and improving skills as the surrounding AI engineering landscape
changes.

## Lab Rule

No major product decision should rely on rhetoric alone.

Every candidate skill, launch change, pricing change, onboarding change, or runtime
change should be traceable to:

- a stated hypothesis
- a success threshold
- a failure threshold
- an observation window
- a decision rule

## Standard Experiment Loop

1. write the hypothesis before the work starts
2. define the smallest observable change that could falsify it
3. deploy the change
4. record the observation window and measured outcomes
5. decide whether to keep, tighten, expand, or kill the lane
6. write the learning in a way that future ranking and build work can reuse

## What Counts As Learning

Useful learning should change at least one of:

- the bottleneck ranking heuristic
- the activation design heuristic
- the deployment default
- the pricing heuristic
- the quality bar for future skills

If nothing in the factory changes, the work was likely activity, not learning.

## Required Evidence Types

Every meaningful launch or change should aim to capture:

- quantitative evidence: activation, reliability, latency, repeat usage, cost
- qualitative evidence: user or agent feedback, failure notes, objections
- comparative evidence: expected outcome versus observed outcome

## Anti-Patterns

Treat these as lab failures:

- calling installs success without activation
- treating anecdotes as proof without thresholds
- changing multiple major variables without recording what changed
- writing post-launch summaries with no prior hypothesis
- describing vague improvement without updating a reusable heuristic

## Default Review Question

For every shipped skill and every major revision, ask:

"What would we do differently on the next skill because of what we learned here?"
