# Skill Proposal

## Skill

- `skill_slug`: `positioning-sharpener`
- `target_user`: builders whose product works technically but still feels generic, weakly differentiated, or not clearly paid-worthy
- `owner`: `skillfoundry`

## Bottleneck

- repeated pain: technically competent builders often ship tools whose usefulness is real but whose differentiation and price justification are unclear
- current workaround: iterate on messaging informally or ask a general assistant for branding help
- why now: the early MCP market has many commodity utilities, which increases the importance of originality, marketability, and paid justification

## Smallest Credible Tool Surface

- tool 1: diagnose_positioning_weakness
- tool 2: sharpen_value_proposition
- tool 3: generate_paid_justification

## Activation

- first-session outcome: user receives a tighter, more differentiated framing of their product and a clearer paid-value argument
- activation metric: one completed session where the user adopts the revised positioning or uses it directly in launch materials
- fastest proof of value: the product owner says the critique named what felt generic and the new framing is stronger

## Testable Hypothesis

- statement: If Skillfoundry offers a paid positioning-sharpener for narrow builder tools, then some builders will pay to make their product feel less generic and more clearly worth charging for because differentiation and price justification are high-friction judgment tasks that are hard to do well from scratch.
- primary metric: paid sessions where revised positioning is adopted with only light edits
- success threshold: at least one paid session with explicit positive feedback on originality or price-justification improvement
- failure threshold: users like the feedback but still treat it as generic brainstorming rather than operator-grade output
- observation window: first paid launch cycle after the wedge exists
- decision rule: keep only if the tool consistently improves perceived originality and paid justification beyond what users believe they can get from a general assistant

## Economics

- likely buyer: builder who believes the product works but suspects weak differentiation is blocking adoption
- expected pricing shape: low per-call paid operator
- expected cost drivers: critique quality, rewrite quality, evaluator design

## Operational Risk

- provider dependencies: model quality, difficulty of evaluating originality without drifting into vague rhetoric
- likely failure mode: output sounds smart but does not materially improve adoption or willingness to pay
- runtime choice: TypeScript remote skill on the default hosted lane

## Scorecard

- pain_frequency: 4
- time_to_value: 4
- willingness_to_pay: 4
- repeatability: 3
- operational_stability: 4
- distribution_fit: 4
- evaluation_clarity: 4
- build_leverage: 5

## Decision

- build now / hold / kill: `hold`
- reason: strategically important, but should follow after the wedge and listing-repair lane so it has stronger comparative evidence
