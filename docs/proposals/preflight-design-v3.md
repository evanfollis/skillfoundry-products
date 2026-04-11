# Product Design: Preflight v3

## Name

**Preflight** — the pre-launch checklist a pilot runs before takeoff.

## Identity

- `skill_slug`: `preflight`
- `target_user`: MCP server builders preparing to publish on Smithery, MCP Registry, or npm
- `owner`: `skillfoundry`
- `pricing`: free — permanently, genuinely, no gate
- `runtime`: TypeScript on Cloudflare Workers

## What It Does

Preflight validates whether an MCP server is **publishable on real MCP directories**. It checks real artifacts — manifests, live endpoints, package configs — and reports findings with explicit evidence levels.

Scope is narrow and honest: **remote MCP endpoint probing + manifest/artifact linting**. It does not verify stdio runtime behavior (Workers cannot spawn child processes). It does not cover non-MCP marketplaces like RapidAPI.

It answers: "Will this pass submission to Smithery / MCP Registry / npm? What specifically fails?"

## Single Tool: `check_publish_readiness`

### Inputs

```typescript
{
  // At least one required. Provide as many as available.
  endpoint_url?: string,     // live remote MCP endpoint
  manifest?: string,         // raw server.json content
  package_json?: string,     // raw package.json content
  smithery_yaml?: string,    // raw smithery.yaml content
  pyproject_toml?: string,   // raw pyproject.toml content
  readme?: string,           // raw README content

  // Optional
  target_directories?: Array<"smithery" | "mcp_registry" | "npm">,
  include_accelerators?: boolean,  // default false — opt-in paid tool refs
}
```

No `package_metadata` struct. Preflight parses real artifact contents, not self-reported summaries.

### What Each Input Unlocks

**`endpoint_url` (live probing):**
- HTTPS certificate valid
- Health/root endpoint responds
- MCP streamable HTTP transport negotiation
- Lists tools/resources/prompts via MCP initialize
- Response latency measurement
- `server.json` accessible at well-known path
- Server-card accessible at `/.well-known/mcp/server-card.json`
- Declared vs actual tool list consistency (if manifest also provided)

**`manifest` (server.json linting):**
- Schema validation against MCP Registry spec
- Required fields: name, version, description
- `packages` and/or `remotes` array present
- Package type verification markers (e.g., `mcpName` for npm packages)
- Transport type declared
- Tools array with name + description

**`package_json` (npm readiness):**
- `name` and `version` present (hard npm requirements)
- `bin` or `main` entry point
- `description` field populated
- `mcpName` field matches manifest name (if manifest provided)

**`smithery_yaml` (Smithery readiness):**
- Valid YAML structure
- Build configuration present
- Streamable HTTP transport declared (Smithery requirement for URL publishing)

**`pyproject_toml` (Python package checks):**
- Project name and version present
- Entry points declared
- Description populated

**`readme` (documentation checks):**
- Not empty / not just a title
- Contains example usage or prompts
- Target user identifiable

### Output

```typescript
{
  mode: "live_probe" | "artifact_lint" | "mixed",
  // live_probe: endpoint_url provided, live checks ran
  // artifact_lint: only static artifacts provided
  // mixed: both endpoint and artifacts provided

  server_name: string | null,
  transport_type: "streamableHttp" | "sse" | "stdio" | "unknown",

  verdict: "publishable" | "fixable" | "not_ready",

  findings: Array<{
    severity: "pass" | "warn" | "block",
    category: "manifest" | "transport" | "tools" | "documentation" | "directory_policy",
    check: string,
    evidence: string,        // what was actually found
    evidence_level: "verified_live" | "verified_from_artifact" | "inferred",
    affected_artifact: string,
    rule: {
      directory: string,     // which directory this rule comes from
      type: "hard_requirement" | "directory_convention" | "heuristic",
      source_url: string,    // link to directory docs for this rule
    },
    fix: string | null,      // self-serve action, always present if blocking

    // Only present when include_accelerators: true
    accelerator?: {
      tool: string,          // skillfoundry tool slug
      description: string,   // what it does for this finding
    },
  }>,

  directory_readiness: {
    [directory: string]: {
      ready: boolean,
      hard_blockers: number,    // count of hard_requirement blocks
      convention_gaps: number,  // count of convention warns/blocks
      heuristic_flags: number,  // count of heuristic warns
    }
  },

  summary: {
    total_checks: number,
    passed: number,
    warnings: number,
    blockers: number,
    evidence_breakdown: {
      verified_live: number,
      verified_from_artifact: number,
      inferred: number,
    }
  },

  // Explicit about what was NOT checked
  not_checked: Array<{
    reason: string,  // e.g. "no endpoint_url provided — live transport checks skipped"
    what_it_would_verify: string,
  }>,
}
```

## Directory Policy Packs

Each rule is source-linked, typed, and dated. Rules are derived from actual directory documentation.

### Smithery
Source: https://smithery.ai/docs/build/publish

| Rule | Type | Source |
|------|------|--------|
| Streamable HTTP transport required for URL publishing | hard_requirement | Smithery publish docs |
| smithery.yaml with build config present | hard_requirement | Smithery publish docs |
| Git repo URL required for git-based submission | hard_requirement | Smithery publish docs |
| At least one tool declared | hard_requirement | Smithery publish docs |
| Server-card at well-known path | directory_convention | Smithery scanning fallback docs |

### MCP Registry
Source: https://modelcontextprotocol.io/registry/quickstart

| Rule | Type | Source |
|------|------|--------|
| server.json with `packages` and/or `remotes` | hard_requirement | Registry quickstart |
| name, version, description in manifest | hard_requirement | Registry server schema |
| Package-type verification (mcpName for npm, etc.) | hard_requirement | Registry package-types docs |
| Ownership verification markers present | hard_requirement | Registry package-types docs |
| Transport type declared | hard_requirement | Registry remote-servers docs |

### npm
Source: https://docs.npmjs.com/cli/v11/configuring-npm/package-json

| Rule | Type | Source |
|------|------|--------|
| `name` field present | hard_requirement | npm docs |
| `version` field present | hard_requirement | npm docs |
| `bin` or `main` entry point | directory_convention | npm docs |
| README.md present | heuristic | npm best practices |
| `license` field populated | heuristic | npm best practices |
| `description` field populated | heuristic | npm search/discovery |

Policy packs are versioned. Each rule includes `last_reviewed` date.

## What It Does NOT Do

- Does not rewrite anything. It validates.
- Does not verify stdio server runtime behavior (Workers cannot spawn child processes).
- Does not cover non-MCP marketplaces (RapidAPI, etc.) — different problem space.
- Does not generate copy or marketing material.
- Does not use LLM calls. Pure parsing + validation + live probing.
- Does not require authentication or collect PII.

## What It Is Honest About

- **Evidence levels are explicit.** A finding from live probing says `verified_live`. A finding from parsing a manifest says `verified_from_artifact`. A finding inferred from absence says `inferred`. Users know the confidence level.
- **Not-checked is explicit.** If you don't provide an endpoint URL, the output tells you which checks were skipped and what they would have verified.
- **Rule types are explicit.** A `hard_requirement` means directory submission will fail. A `heuristic` means it's good practice but won't block submission.
- **Paid tools are opt-in.** Accelerator references only appear when `include_accelerators: true`. The default output is purely diagnostic.

## Design Principles

1. **Verify, don't trust.** Parse real artifacts. Probe real endpoints. Never validate self-reported metadata.
2. **Evidence levels on everything.** Users know exactly how confident each finding is.
3. **Source-linked rules.** Every policy rule traces to actual directory documentation.
4. **Honest about scope.** Explicit about what isn't checked and why.
5. **Deterministic and fast.** Static checks sub-100ms. Live probes bounded by network RTT.
6. **Genuinely useful standalone.** Full value without ever touching paid tools.

## Connection to Paid Products

Only when `include_accelerators: true`:
- `documentation` findings → `listing-repair-operator`
- `directory_policy` findings → `submission-hardener`
- positioning gaps → `positioning-sharpener`

The self-serve `fix` is always present. Accelerators are an optional shortcut, not a gate.

## Distribution

- **Smithery** — git-based submission, free
- **MCP Registry** — manifest at /server.json
- **npm** — `npx @skillfoundry/preflight`
- **GitHub** — public repo, SEO landing page

## Telemetry

- NDJSON event stream: tool_called / tool_completed
- Per-finding-category failure rates
- Per-directory readiness rates
- Evidence level distribution (how many users provide endpoints vs just manifests?)
- Activation: one completed check with at least one finding

## Reusable Infrastructure

1. **Artifact parsers** — server.json, package.json, pyproject.toml, smithery.yaml → normalized model
2. **Rules engine** — typed rules against normalized artifacts, producing sourced findings
3. **Live MCP prober** — transport negotiation, initialize handshake, tool/resource/prompt listing
4. **Policy packs** — versioned, source-linked, testable directory requirement sets
5. **Fix routing** — findings → self-serve fix + optional paid accelerator

## Success Criteria

- **Activation:** Builder completes one check, identifies at least one concrete fix
- **Retention:** Builder re-runs after fixing
- **Conversion:** Builder opts into accelerators and follows one
- **Learning:** Per-directory failure rates reveal which requirements trip builders up most
