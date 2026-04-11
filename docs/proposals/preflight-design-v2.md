# Product Design: Preflight v2 (SUPERSEDED by v3)

> **This design was reviewed and found to overclaim scope. See `preflight-design-v3.md` for the final design.**

## Name

**Preflight** — the pre-launch checklist a pilot runs before takeoff.

## Identity

- `skill_slug`: `preflight`
- `target_user`: MCP server builders preparing to publish on real directories (Smithery, MCP Registry, npm, RapidAPI)
- `owner`: `skillfoundry`
- `pricing`: free — permanently, genuinely, no gate
- `runtime`: TypeScript on Cloudflare Workers (matches template, global edge, zero cold start)

## What It Does

Preflight validates whether an MCP server is **publishable on real directories**. Not copy hygiene, not marketing advice — structural, evidence-based verification against actual directory requirements.

It answers: "Will this server pass submission to Smithery / MCP Registry / npm? If not, what specifically fails and how do I fix it?"

## Single Tool: `check_publish_readiness`

One tool. Three input modes. Evidence-based findings.

### Input Modes

**1. `manifest_only`** — provide a server.json or package.json and get static validation.
- Validates manifest schema against MCP Registry and Smithery requirements
- Checks required fields: name, version, description, tools array, transport type
- Validates tool schemas (input_schema present and valid JSON Schema)
- Checks for resources and prompts declarations
- Validates transport declaration (stdio vs streamableHttp vs sse)

**2. `local_package`** — provide full package metadata for deeper analysis.
- Everything in manifest_only, plus:
- README present and substantive (not just a title)
- License declared
- Entry point resolvable
- Dependencies declared (not just `*` versions)
- Tool count assessment (1-5 for first launch, warn on 6+)
- Checks for `.well-known/mcp/server-card.json` presence
- Distinguishes stdio-only vs remote-capable servers

**3. `remote_url`** — provide a live endpoint URL for transport verification.
- Everything in local_package (if manifest provided), plus:
- HTTPS certificate valid
- Health endpoint responds
- MCP transport negotiation succeeds (streamable HTTP or SSE)
- `server.json` or server-card accessible at well-known paths
- Lists tools/resources/prompts via MCP initialize handshake
- Measures response latency (flags >2s as warning, >5s as blocker)
- Verifies declared tools match actual tool list

### Inputs

```typescript
{
  // Exactly one of these three is required
  manifest?: string,        // raw server.json or package.json content
  package_metadata?: {       // structured package info
    name: string,
    version: string,
    description: string,
    tools: Array<{name: string, description: string, inputSchema?: object}>,
    resources?: Array<{name: string, description: string}>,
    prompts?: Array<{name: string, description: string}>,
    transport: "stdio" | "streamableHttp" | "sse",
    readme?: string,
    license?: string,
    server_config?: string,  // package.json or pyproject.toml content
  },
  endpoint_url?: string,     // live URL for transport checks

  // Optional
  target_directories?: Array<"smithery" | "mcp_registry" | "npm" | "rapidapi">,
}
```

### Output

```typescript
{
  mode: "manifest_only" | "local_package" | "remote_url",
  server_name: string,
  transport_type: "stdio" | "streamableHttp" | "sse" | "unknown",

  verdict: "publishable" | "fixable" | "not_ready",
  // publishable: passes all directory requirements for target_directories
  // fixable: has blockers but all have concrete fixes
  // not_ready: fundamental issues (no tools, broken transport, etc.)

  findings: Array<{
    severity: "pass" | "warn" | "block",
    category: "manifest" | "transport" | "tools" | "documentation" | "directory_policy",
    check: string,           // what was evaluated
    evidence: string,        // what was actually found (or "not found")
    affected_artifact: string, // which file/field/endpoint
    policy_source: string,   // which directory requirement this maps to
    fix: string | null,      // exact action to take (null if passing)
  }>,

  directory_readiness: {
    // Per-directory pass/fail based on that directory's actual requirements
    [directory: string]: {
      ready: boolean,
      blocking_findings: number[],  // indices into findings array
    }
  },

  summary: {
    total_checks: number,
    passed: number,
    warnings: number,
    blockers: number,
  }
}
```

### Directory-Specific Policy Packs

Each target directory has documented requirements. Preflight encodes these as policy packs:

**Smithery:**
- server.json or smithery.yaml present
- Git-based submission requires valid repo URL
- Server card at `.well-known/mcp/server-card.json`
- Transport type declared
- At least one tool

**MCP Registry:**
- Manifest at `/server.json` with required fields (name, version, description)
- Registry name format: `namespace/server-name`
- Tools array with name + description
- Transport type declared

**npm:**
- Valid package.json with name, version, description
- `bin` or `main` entry point
- README.md present
- License field populated

**RapidAPI:**
- OpenAPI 3.0+ spec or working REST endpoints
- At least one documented endpoint
- Health check endpoint
- Response schemas defined

Policy packs are versioned and updatable as directories change requirements.

## What It Does NOT Do

- Does not rewrite anything. It validates.
- Does not generate copy, listings, or marketing material.
- Does not require authentication.
- Does not collect PII or require sign-up.
- Does not use LLM calls. Pure validation and heuristic analysis. Sub-100ms for static checks.

## Design Principles

1. **Evidence-based, not opinion-based.** Every finding cites what was checked, what was found, and which directory policy it maps to. No subjective quality scores.

2. **Validates real artifacts, not pasted text.** Inspects manifests, transport behavior, tool schemas, and directory-specific requirements — the things that actually determine publishability.

3. **Distinguishes stdio from remote.** A stdio MCP server has fundamentally different requirements than a remote one. Transport type shapes the entire check suite.

4. **Actionable fixes, not vague advice.** Every blocker includes the exact fix: "Add `description` field to server.json" not "Consider improving your documentation."

5. **Deterministic and fast.** No LLM calls. Static checks sub-100ms. Live transport checks bounded by network RTT.

6. **Genuinely useful standalone.** A builder who never pays Skillfoundry anything gets real value: they know exactly what to fix before submitting to each directory.

## Connection to Paid Products

Findings naturally route to paid fix tools. The routing is explicit in the output, not hidden:

- Findings in `documentation` category → `listing-repair-operator` can generate/fix
- Findings in `directory_policy` category → `submission-hardener` can remediate
- Findings about positioning/differentiation → `positioning-sharpener` can help

The `fix` field always contains the self-serve action. A separate optional `accelerator` field (only present when a paid tool exists) names the Skillfoundry tool that automates the fix. This is transparent: builders see both paths.

## Distribution

- **Smithery** — git-based submission, free tier
- **MCP Registry** — manifest at /server.json
- **RapidAPI** — free tier, REST endpoint wrapping the MCP tool
- **npm** — installable as `npx @skillfoundry/preflight`
- **GitHub** — public repo, README as SEO landing page

## Telemetry

- NDJSON event stream with tool_called / tool_completed events
- Session tracking via sessionId
- Per-finding-category failure rates (business intelligence: what do builders struggle with most?)
- Per-directory readiness rates (which directories are hardest to pass?)
- Activation metric: one completed check with at least one finding acted on (re-check shows improvement)

## Reusable Infrastructure

The durable engineering asset from Preflight is:
1. **Artifact ingestion + normalization** — parse server.json, package.json, pyproject.toml, smithery.yaml into common model
2. **Rules engine** — findings from policy packs against normalized artifacts
3. **Directory-specific policy packs** — versioned, updatable requirement sets
4. **Live transport verification** — MCP handshake, health checks, latency measurement
5. **Fix routing** — maps findings to self-serve actions and optional paid accelerators

This infrastructure serves every future Skillfoundry diagnostic product.

## Success Criteria

- **Activation:** Builder completes one check and identifies at least one concrete fix
- **Retention:** Builder re-runs after fixing (confirms the loop works)
- **Conversion:** Builder follows an accelerator to a paid tool
- **Learning:** Per-directory failure rates reveal which submission requirements trip builders up most
