# Launchpad Lint Revenue Hypothesis

## Change

- `change_id`: `launchpad-lint-initial-revenue-lane`
- `probe_or_offering_slug`: `launchpad-lint`
- `assumption_id`: `launchpad-lint-first-external-commitment`
- `probe_id`: `launchpad-lint-agenticmarket-live-listing`
- `owner`: `skillfoundry`
- `date_started`: `2026-04-10`

## Hypothesis

- statement: If `launchpad-lint` stays narrow and produces a useful audit-plus-draft
  outcome in one short session, then technical builders preparing MCP launches will
  complete the two-call workflow and show enough usefulness and repeat intent to
  justify keeping the lane alive within the first launch cycle.

## Scope

- user or agent segment: solo technical builders and small automation agencies already
  operating MCP servers
- workflow affected: launch-readiness audit followed by launch package drafting
- metric owner: valuation with builder and growth support
- external surface: `https://agenticmarket.dev/strange_loop/launchpad-lint`

## Measures

- primary metric: full two-call session completion rate
- secondary metrics:
  - install to first paid call
  - user-reported reduction in launch ambiguity
  - user-reported light-edit requirement
  - repeat usage in the first launch cycle
- guardrail metrics:
  - tool success rate
  - p95 latency
  - major output-quality complaints

## Thresholds

- success threshold:
  - at least one external builder completes the full two-call activation path
  - the same builder provides an external commitment signal or repeat intent strong enough to justify continued selling
  - output judged to require only light editing
  - no major reliability failure in the successful session
- failure threshold:
  - installs occur but no clean full two-call activation happens
  - or users complete the flow but still report heavy rewriting
  - or no meaningful external commitment appears in the first launch cycle despite live distribution
- ambiguous range:
  - activation happens but usefulness is mixed or repeat intent is weak

## Observation Window

- start: first live launch date
- end: end of the first launch cycle

## Decision Rule

- if success: keep the lane alive, broaden visibility carefully, and improve pricing
  only after usefulness stays strong
- if ambiguous: tighten output quality, positioning, and activation design before
  expanding distribution
- if failure: pause or kill the lane and feed the learning back into bottleneck ranking

## Notes

- main risk: the product may be perceived as generic packaging copy instead of real
  decision support
- what this should teach the factory:
  - whether narrow launch-decision support is cash-flow viable
  - what a clean one-session activation pattern looks like
  - how much output polish is required for paid builder-facing skills
