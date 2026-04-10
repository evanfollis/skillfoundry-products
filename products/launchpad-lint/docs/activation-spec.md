# Launchpad Lint Activation Spec

## Primary Activation Metric

One successful two-call session that reduces launch ambiguity.

## Operational Definition

A session counts as activated when the user:

1. completes one `audit_launch_readiness` call,
2. completes one `draft_launch_package` call,
3. and indicates that the resulting output clarified what should change before launch.

## Why This Metric

The product is event-driven and narrow. Success should be judged by whether it helps a
builder get to a clearer first launch package quickly, not by raw installs alone.
