# Skill Proposal

## Skill

- `skill_slug`: `builder-bottleneck-diagnosis`
- `target_user`: solo technical builders and small automation agencies shipping MCP servers
- `owner`: `skillfoundry`

## Bottleneck

- repeated pain: builders often know something is weak in their server, listing, or launch package but do not know which problem matters most right now
- current workaround: ask a general assistant for broad feedback or manually compare against marketplace examples
- why now: early marketplace launches and builder tooling are creating real demand for fast diagnosis, but willingness to pay may require a lower-friction wedge

## Smallest Credible Tool Surface

- tool 1: classify_launch_bottlenecks
- tool 2: recommend_next_path
- tool 3: compare_self_serve_vs_operator_path

## Activation

- first-session outcome: user receives a ranked diagnosis of the top launch or product bottlenecks plus a clear next-step path
- activation metric: one completed diagnosis session where the user identifies at least one concrete next action
- fastest proof of value: user says the ranked bottleneck list correctly names the real problem

## Testable Hypothesis

- statement: If Skillfoundry offers a free diagnosis server that identifies and ranks the most important builder bottlenecks, then more builders will complete a first useful session and reveal monetizable follow-on problems within the first launch cycle because the diagnosis lowers commitment and clarifies need before payment is required.
- primary metric: completed diagnosis sessions with at least one explicit next action
- success threshold: at least one external diagnosis session that produces a credible next action and at least one follow-on interest signal toward a fix path
- failure threshold: diagnosis sessions occur but users do not trust the output or do not progress to any next action
- observation window: first live launch cycle
- decision rule: if activation is clean but paid follow-on interest is weak, keep the wedge and rethink the paid fix lanes; if activation is weak, tighten diagnosis specificity or kill

## Economics

- likely buyer: initially free user, later the same user as a qualified lead into paid fix servers
- expected pricing shape: free wedge
- expected cost drivers: model inference per diagnosis, retrieval of package text, telemetry and feedback storage

## Operational Risk

- provider dependencies: hosted MCP runtime, model provider if generation is used, marketplace or direct distribution channels
- likely failure mode: diagnosis feels generic or manipulative rather than genuinely useful
- runtime choice: TypeScript remote skill on the default hosted lane

## Scorecard

- pain_frequency: 5
- time_to_value: 5
- willingness_to_pay: 2
- repeatability: 3
- operational_stability: 4
- distribution_fit: 5
- evaluation_clarity: 4
- build_leverage: 5

## Decision

- build now / hold / kill: `keep_warm`
- reason: strongest candidate wedge for a broader suite, but should follow the current `launchpad-lint` review cycle rather than interrupt it
