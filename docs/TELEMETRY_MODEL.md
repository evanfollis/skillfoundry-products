# Probe And Offering Telemetry Model

## Goal

Capture the minimum telemetry needed to decide whether a probe or offering creates
value, remains reliable, and deserves further investment.

## Principles

- Record enough to interpret outcomes quickly.
- Keep the envelope stable across probes and offerings.
- Separate product usefulness from transport success.
- Prefer explicit event names over free-form logs.
- Do not confuse runtime telemetry with commercial proof.

## Required Dimensions

Every remote MCP probe or offering should emit structured events with:

- `assumption_id`
- `probe_id`
- `artifact_class`
- `probe_type`
- `skill_slug`
- `skill_version`
- `environment`
- `request_id`
- `session_id`
- `tool_name`
- `started_at`
- `finished_at`
- `latency_ms`
- `success`
- `error_code`
- `input_size_bytes`
- `output_size_bytes`
- `estimated_input_tokens`
- `estimated_output_tokens`
- `estimated_total_tokens`

## Activation Events

Track at least:

- `skill_installed`
- `session_started`
- `tool_called`
- `session_completed`
- `session_abandoned`
- `user_feedback_recorded`

## Reliability Metrics

Compute:

- call success rate
- tool-specific success rate
- p50 latency
- p95 latency
- timeout rate
- provider error rate

## Economic Metrics

Compute:

- cost per successful session
- tokens per successful session
- repeat sessions per installed user or agent
- calls required for first successful outcome

## Feedback Model

Each probe or offering should support one durable feedback record per reviewer identity and runtime
version range. That record can be edited later, but the latest record should overwrite
the previous one rather than creating duplicates.

Capture:

- `assumption_id`
- `probe_id`
- `reviewer_id`
- `skill_slug`
- `score`
- `would_reuse`
- `quality_notes`
- `updated_at`

## Typed Commercial Evidence

Commercial decisions should cite typed evidence in addition to runtime telemetry.

Use these evidence classes:

- `internal_operational`
- `external_conversation`
- `external_commitment`
- `external_transaction`

Use these evidence quality levels:

- `weak`
- `moderate`
- `strong`

Rules:

- internal telemetry may justify runtime fixes or design changes
- internal telemetry may not justify promotion on its own
- promotion requires admissible external evidence linked back to `assumption_id` and `probe_id`

## Interpretation Rule

If a probe or offering has:

- weak activation but good reliability, fix positioning or onboarding
- good activation but weak reliability, fix runtime and provider dependencies
- good activation and reliability but weak reuse, narrow the value proposition or kill the lane
- good reuse and acceptable economics, keep investing only if external evidence also supports the lane
