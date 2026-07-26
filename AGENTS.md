# Skillfoundry Products

This monorepo owns Skillfoundry’s deployable products, internal mechanisms, and
intentional implementation templates.

- Keep `products/`, `mechanisms/`, and `templates/` distinct.
- A mechanism does not become a public product without an explicit decision.
- Run `make check` before publication or deployment.
- Do not expose credentials in source, workflows, logs, or model-visible input.
- Release workflows use pinned actions, pinned verified publisher artifacts,
  least privilege, and OIDC.
- Preflight’s canonical implementation is `products/preflight`; the standalone
  repository is archived lineage.

Read `docs/architecture.md` before changing boundaries or deploy ownership.
Substantial product or measurement changes require adversarial review.
