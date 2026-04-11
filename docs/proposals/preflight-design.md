# Product Design: Preflight (v1 — SUPERSEDED by v3)

> **This design was rejected by adversarial review. See `preflight-design-v3.md` for the final design.**

## Name

**Preflight** — as in the pre-launch checklist a pilot runs before takeoff.

Not "diagnosis," not "bottleneck checker," not anything that sounds like a sales funnel disguised as a tool. The name communicates exactly what it does: check whether your MCP server is ready before you ship it publicly.

## Identity

- `skill_slug`: `preflight`
- `target_user`: MCP server builders preparing their first public listing or directory submission
- `owner`: `skillfoundry`
- `pricing`: free — permanently, genuinely, no gate
- `runtime`: TypeScript on Cloudflare Workers (matches template, global edge deployment, zero cold start)

## What It Does

Preflight inspects an MCP server package and returns a structured, actionable readiness report. It answers: "Is this ready to ship publicly, and if not, what specifically needs to change?"

Three tools, each with a distinct job:

### Tool 1: `check_readiness`

The core diagnostic. Takes a server's metadata and returns a structured readiness assessment.

**Inputs:**
- `server_name` (string, required)
- `tools` (array of {name, description}, required)
- `readme` (string) — README or documentation text
- `listing_copy` (string) — draft marketplace listing
- `endpoint_url` (string) — public endpoint if deployed
- `server_config` (string) — package.json, pyproject.toml, or equivalent

**Output:**
- `overall_score` (0-100)
- `verdict` ("ready" | "needs_work" | "not_ready")
- `checks` — array of individual check results, each with:
  - `category` ("trust" | "compatibility" | "discoverability" | "quality" | "operations")
  - `check` — what was evaluated
  - `status` ("pass" | "warn" | "fail")
  - `detail` — specific finding
  - `fix` — actionable fix suggestion (null if passing)

**Check Categories:**

Trust:
- HTTPS endpoint present
- Tool descriptions explain what data is accessed
- Explicit limits stated
- License declared

Compatibility:
- Tool count is narrow (1-5 for first launch)
- Tool names and descriptions match
- Input schemas defined
- No undocumented side effects mentioned

Discoverability:
- README exists with meaningful content
- Example prompts included
- Target user identified
- Short description under 160 chars

Quality:
- Tool descriptions are substantive (>40 chars)
- No placeholder or lorem ipsum text
- Consistent naming conventions
- Description doesn't overpromise

Operations:
- Health endpoint present
- Endpoint responds (if URL provided)
- Server metadata present (version, name)

### Tool 2: `compare_listings`

Takes two listing drafts and scores them comparatively. Useful for A/B testing copy before publishing.

**Inputs:**
- `listing_a` (string, required) — first listing draft
- `listing_b` (string, required) — second listing draft
- `target_user` (string) — who the listing is for

**Output:**
- `preferred` ("a" | "b" | "tie")
- `scores` — {a: number, b: number} on 0-100
- `comparison` — array of dimension comparisons:
  - `dimension` ("clarity" | "specificity" | "trust_signals" | "actionability")
  - `winner` ("a" | "b" | "tie")
  - `reasoning` — why

### Tool 3: `suggest_improvements`

Takes a readiness report and returns prioritized, concrete improvements. This is the bridge to paid services — the suggestions are genuinely useful on their own, but some may reference paid Skillfoundry tools for the heavy lifting.

**Inputs:**
- `readiness_report` (the output of check_readiness)
- `priority` ("speed" | "quality" | "trust") — what to optimize for

**Output:**
- `improvements` — ordered array of:
  - `priority` (1-N)
  - `category` — which check category
  - `action` — specific thing to do
  - `effort` ("quick_fix" | "moderate" | "significant")
  - `impact` ("high" | "medium" | "low")
  - `self_serve_hint` — how to do it yourself
  - `accelerator` — optional reference to a paid Skillfoundry tool that does this faster (null if none exists)

## What It Does NOT Do

- It does not rewrite anything. It diagnoses.
- It does not access external URLs or fetch live data. All analysis is on provided inputs.
- It does not require authentication. It is free and open.
- It does not generate copy, listings, or marketing material. That's what the paid tools do.
- It does not collect PII or require sign-up.

## Design Principles

1. **Genuinely useful standalone.** A builder who never pays Skillfoundry anything should still find Preflight valuable. The self_serve_hints must be real advice, not "contact us."

2. **Deterministic and fast.** No LLM calls. Pure heuristic analysis. Sub-100ms response times on edge. Builders can run it dozens of times as they iterate.

3. **Structured output, not prose.** Every check returns machine-readable results. Agents, CI pipelines, and scripts can consume the output, not just humans reading text.

4. **Honest about what's paid.** The `accelerator` field in suggest_improvements transparently names paid tools that could help. It's not hidden upsell — it's clear routing.

5. **Discovery funnel by design.** Every Preflight session creates:
   - Telemetry about which check categories fail most (feeds bottleneck research)
   - Evidence about what builders actually struggle with (feeds product design)
   - Natural exposure to paid Skillfoundry tools (feeds conversion)

## Distribution

Preflight should be listed everywhere free is allowed:

- **Smithery** — git-based submission, free tier, server card served from edge
- **MCP Registry** — manifest at /server.json
- **RapidAPI** — free tier (0 calls charged), basic plan for higher limits
- **Dev.to / Hashnode** — tutorial content: "How to check if your MCP server is launch-ready"
- **GitHub** — public repo with good README, acts as SEO landing page
- **npm** — installable as `npx @skillfoundry/preflight`

## Telemetry

Same model as launchpad-lint:
- NDJSON event stream with tool_called / tool_completed events
- Session tracking via sessionId
- Per-check-category failure rates (most important business signal)
- Activation metric: one completed check_readiness session with at least one actionable finding

## Connection to Paid Products

The `accelerator` field in suggest_improvements maps to:
- `listing-repair-operator` → for listing copy and packaging fixes
- `launchpad-lint` → for deeper audit + draft launch package
- `submission-hardener` → for compliance and submission fixes (when built)
- `positioning-sharpener` → for differentiation fixes (when built)

This is the funnel. Free diagnosis → shows specific gaps → routes to narrow paid fixes.

## Success Criteria

- **Activation:** Builder completes one check_readiness session and identifies at least one concrete fix
- **Retention signal:** Builder runs check_readiness more than once (iterating on fixes)
- **Conversion signal:** Builder follows an accelerator link to a paid tool
- **Learning signal:** Per-check-category failure rates reveal which problems are most common

## Why TypeScript

- Cloudflare Workers deployment: global edge, zero cold start, free tier
- Matches the remote-skill-ts template already in the repo
- Better fit for npm distribution
- Keeps Python for launchpad-lint (existing, works) and TypeScript for new products
