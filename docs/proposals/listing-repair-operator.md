# Skill Proposal

## Skill

- `skill_slug`: `listing-repair-operator`
- `target_user`: technical builders with a weak or rejected marketplace listing draft
- `owner`: `skillfoundry`

## Bottleneck

- repeated pain: builders can diagnose that their listing is weak but still struggle to produce copy, examples, and limits that feel credible and marketable
- current workaround: rewrite copy manually or ask a general assistant for generic marketing help
- why now: marketplace launches are increasing and poor listing quality is one of the easiest failure modes to diagnose and to fix with a narrow operator

## Smallest Credible Tool Surface

- tool 1: rewrite_listing_package
- tool 2: generate_example_prompts
- tool 3: sharpen_limits_and_positioning

## Activation

- first-session outcome: user receives a materially stronger marketplace-ready listing package requiring only light edits
- activation metric: one completed repair session where the user judges the output to require only light editing
- fastest proof of value: user replaces their existing listing copy with the generated package with minimal rewrite

## Testable Hypothesis

- statement: If Skillfoundry offers a narrow paid listing-repair operator after diagnosis, then builders with identified copy and packaging weaknesses will pay for it and judge the output to require only light edits within the first launch cycle because the operator performs a concrete high-friction fix rather than broad advice.
- primary metric: paid successful repair sessions judged to require only light edits
- success threshold: at least one paid repair session with positive usefulness feedback
- failure threshold: sessions complete but outputs still need heavy rewrite or users prefer self-serve rewriting
- observation window: first paid launch cycle after the wedge exists
- decision rule: keep only if the paid operator is materially more trusted and more reusable than generic prompting

## Economics

- likely buyer: builder who already agrees their listing/package is weak and wants it fixed quickly
- expected pricing shape: low per-call paid operator
- expected cost drivers: model inference for rewrite quality, evaluation examples, feedback loop

## Operational Risk

- provider dependencies: model output quality, marketplace-specific formatting conventions
- likely failure mode: output reads as polished but generic
- runtime choice: TypeScript remote skill on the default hosted lane

## Scorecard

- pain_frequency: 4
- time_to_value: 5
- willingness_to_pay: 4
- repeatability: 3
- operational_stability: 4
- distribution_fit: 4
- evaluation_clarity: 5
- build_leverage: 4

## Decision

- build now / hold / kill: `keep_warm`
- reason: strongest first paid follow-on lane once a free diagnosis wedge exists
