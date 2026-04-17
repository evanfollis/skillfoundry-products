/**
 * Preflight — MCP server publish readiness checker.
 * Cloudflare Worker entry point.
 *
 * Implements MCP Streamable HTTP transport directly (no Node.js SDK transport),
 * plus a REST API at /api/check for non-MCP consumers.
 */

import { skillConfig } from "./lib/skill-config.js";
import { emitTelemetry, type SourceType } from "./lib/telemetry.js";
import {
  parseServerJson,
  parsePackageJson,
  parseSmitheryYaml,
  parsePyprojectToml,
} from "./lib/parsers.js";
import { evaluate } from "./lib/rules-engine.js";
import type { Directory } from "./lib/types.js";
import type { ParsedArtifacts } from "./lib/rules-engine.js";

type Env = {
  ENVIRONMENT?: string;
};

// --- Artifact parsing helper (shared by MCP and REST) ---

function parseArtifactsFromParams(params: Record<string, unknown>): {
  artifacts: ParsedArtifacts;
  hasInput: boolean;
} {
  const artifacts: ParsedArtifacts = { parseErrors: [] };

  if (typeof params.manifest === "string") {
    const result = parseServerJson(params.manifest);
    if (result.ok) artifacts.serverJson = result.data;
    else artifacts.parseErrors.push({ artifact: "server.json", error: result.error });
  }
  if (typeof params.package_json === "string") {
    const result = parsePackageJson(params.package_json);
    if (result.ok) artifacts.packageJson = result.data;
    else artifacts.parseErrors.push({ artifact: "package.json", error: result.error });
  }
  if (typeof params.smithery_yaml === "string") {
    const result = parseSmitheryYaml(params.smithery_yaml);
    if (result.ok) artifacts.smitheryYaml = result.data;
    else artifacts.parseErrors.push({ artifact: "smithery.yaml", error: result.error });
  }
  if (typeof params.pyproject_toml === "string") {
    const result = parsePyprojectToml(params.pyproject_toml);
    if (result.ok) artifacts.pyprojectToml = result.data;
    else artifacts.parseErrors.push({ artifact: "pyproject.toml", error: result.error });
  }
  if (typeof params.readme === "string") {
    artifacts.readme = params.readme;
  }

  const hasInput = !!(
    params.manifest ||
    params.package_json ||
    params.smithery_yaml ||
    params.pyproject_toml ||
    params.readme
  );

  return { artifacts, hasInput };
}

function resolveDirectories(
  artifacts: ParsedArtifacts,
  requested?: unknown[],
): Directory[] {
  const valid = new Set(["mcp_registry", "smithery", "npm"]);

  if (Array.isArray(requested) && requested.length > 0) {
    return requested.filter((d): d is Directory =>
      typeof d === "string" && valid.has(d),
    );
  }

  const dirs: Directory[] = [];
  if (artifacts.serverJson) dirs.push("mcp_registry");
  if (
    artifacts.serverJson?.remotes?.some((r) => r.type === "streamable-http") ||
    artifacts.smitheryYaml
  ) {
    dirs.push("smithery");
  }
  if (artifacts.packageJson) dirs.push("npm");

  return dirs.length > 0 ? dirs : ["mcp_registry", "smithery", "npm"];
}

function runCheck(params: Record<string, unknown>) {
  const { artifacts, hasInput } = parseArtifactsFromParams(params);
  if (!hasInput) return { error: "At least one artifact must be provided." };

  const targetDirectories = resolveDirectories(
    artifacts,
    params.target_directories as unknown[],
  );
  const result = evaluate({ artifacts, targetDirectories });
  const verdict = (result as { verdict?: string }).verdict;
  const nextSteps = buildNextSteps(verdict, targetDirectories);
  return { ...result, targetDirectories, nextSteps };
}

function buildNextSteps(verdict: string | undefined, dirs: Directory[]) {
  const base = "https://skillfoundry.synaplex.ai/products/preflight";
  const dirParam = dirs.join(",");
  if (verdict === "checks_pass") {
    return {
      message: "All checked rules pass. You're ready to publish.",
      learnMore: `${base}#publish-guides`,
    };
  }
  if (verdict === "fixable") {
    return {
      message:
        "Blockers found, each with a concrete fix. Apply the fixes in the findings, then re-run Preflight.",
      learnMore: `${base}#fix-guides?dirs=${dirParam}`,
      notifyWhenFixToolLaunches: `${base}/notify?verdict=fixable&dirs=${dirParam}`,
    };
  }
  if (verdict === "not_ready") {
    return {
      message:
        "Fundamental issues detected. Review findings and consult the directory docs linked in each rule.",
      learnMore: `${base}#not-ready`,
      notifyWhenFixToolLaunches: `${base}/notify?verdict=not_ready&dirs=${dirParam}`,
    };
  }
  return { learnMore: base };
}

// --- MCP JSON-RPC handler (Streamable HTTP) ---

const TOOL_SCHEMA = {
  type: "object" as const,
  properties: {
    manifest: { type: "string", description: "Raw server.json content" },
    package_json: { type: "string", description: "Raw package.json content" },
    smithery_yaml: { type: "string", description: "Raw smithery.yaml content" },
    pyproject_toml: { type: "string", description: "Raw pyproject.toml content" },
    readme: { type: "string", description: "Raw README content" },
    target_directories: {
      type: "array",
      items: { type: "string", enum: ["mcp_registry", "smithery", "npm"] },
      description: "Directories to check against. Defaults to all applicable.",
    },
  },
};

function jsonRpcResponse(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function handleInitialize(id: unknown) {
  return jsonRpcResponse(id, {
    protocolVersion: "2025-11-25",
    capabilities: { tools: {} },
    serverInfo: {
      name: skillConfig.skillSlug,
      version: skillConfig.skillVersion,
    },
  });
}

function handleToolsList(id: unknown) {
  return jsonRpcResponse(id, {
    tools: [
      {
        name: "check_publish_readiness",
        description:
          "Validate whether an MCP server is publishable on real directories (MCP Registry, Smithery, npm). Provide raw artifact contents. Returns evidence-backed findings with source-linked directory rules.",
        inputSchema: TOOL_SCHEMA,
      },
    ],
  });
}

function handleToolsCall(
  id: unknown,
  params: Record<string, unknown>,
): { response: unknown; verdict?: string; targetDirectories?: string[] } {
  const toolName = params.name;
  if (toolName !== "check_publish_readiness") {
    return { response: jsonRpcError(id, -32602, `Unknown tool: ${toolName}`) };
  }

  const args = (params.arguments ?? {}) as Record<string, unknown>;
  const result = runCheck(args);

  if ("error" in result) {
    return {
      response: jsonRpcResponse(id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: true,
      }),
    };
  }

  return {
    response: jsonRpcResponse(id, {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    }),
    verdict: (result as { verdict?: string }).verdict,
    targetDirectories: (result as { targetDirectories?: string[] }).targetDirectories,
  };
}

async function handleMcp(request: Request, env: Env): Promise<Response> {
  if (request.method === "GET") {
    // Per MCP spec, GET on the MCP endpoint opens an SSE stream.
    // We don't support server-initiated notifications in v0.1,
    // so return 405 with proper Allow header per spec.
    return new Response("SSE not supported in this version.\n", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  if (request.method === "DELETE") {
    // Session termination — no sessions to terminate
    return new Response(null, { status: 204 });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed\n", {
      status: 405,
      headers: { Allow: "GET, POST, DELETE" },
    });
  }

  const requestId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const userAgent = request.headers.get("user-agent") ?? undefined;
  const rawSourceType = request.headers.get("x-source-type") ?? "user";
  const sourceType: SourceType =
    rawSourceType === "system" || rawSourceType === "smoke" || rawSourceType === "cron"
      ? rawSourceType
      : "user";

  emitTelemetry({
    environment: env.ENVIRONMENT ?? "development",
    requestId,
    sessionId,
    sourceType,
    startedAt,
    type: "session_started",
    userAgent,
  });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json(
      jsonRpcError(null, -32700, "Parse error"),
      { status: 400 },
    );
  }

  const method = body.method as string;
  const id = body.id;
  const params = (body.params ?? {}) as Record<string, unknown>;

  let response: unknown;
  let verdict: string | undefined;
  let targetDirectories: string[] | undefined;

  switch (method) {
    case "initialize":
      response = handleInitialize(id);
      break;
    case "notifications/initialized":
      // Notification — no response needed, but return 204
      return new Response(null, { status: 204 });
    case "tools/list":
      response = handleToolsList(id);
      break;
    case "resources/list":
      response = jsonRpcResponse(id, { resources: [] });
      break;
    case "prompts/list":
      response = jsonRpcResponse(id, { prompts: [] });
      break;
    case "tools/call": {
      const r = handleToolsCall(id, params);
      response = r.response;
      verdict = r.verdict;
      targetDirectories = r.targetDirectories;
      break;
    }
    case "ping":
      response = jsonRpcResponse(id, {});
      break;
    default:
      response = jsonRpcError(id, -32601, `Method not found: ${method}`);
  }

  emitTelemetry({
    environment: env.ENVIRONMENT ?? "development",
    finishedAt: new Date().toISOString(),
    latencyMs: Date.now() - Date.parse(startedAt),
    requestId,
    sessionId,
    sourceType,
    startedAt,
    success: true,
    toolName: method,
    type: "session_completed",
    userAgent,
    verdict,
    targetDirectories,
  });

  return Response.json(response, {
    headers: { "Content-Type": "application/json" },
  });
}

// --- REST API handler ---

async function handleRestApi(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed\n", { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = runCheck(body);
  if ("error" in result) {
    return Response.json(result, { status: 400 });
  }
  return Response.json(result);
}

// --- Worker entry point ---

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        service: skillConfig.skillSlug,
        status: "ok",
        version: skillConfig.skillVersion,
      });
    }

    if (url.pathname === "/server.json") {
      return Response.json({
        $schema: "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
        name: "io.github.evanfollis/preflight",
        title: "Preflight",
        description: "Check if your MCP server is ready to publish on the MCP Registry, Smithery, or npm.",
        version: skillConfig.skillVersion,
        remotes: [
          {
            type: "streamable-http",
            url: "https://skillfoundry.synaplex.ai/products/preflight/mcp/",
          },
        ],
      });
    }

    if (url.pathname === "/.well-known/mcp/server-card.json") {
      return Response.json({
        serverInfo: {
          name: skillConfig.skillSlug,
          version: skillConfig.skillVersion,
        },
        capabilities: {
          tools: [
            {
              name: "check_publish_readiness",
              description: "Validate whether an MCP server is publishable on real directories.",
            },
          ],
        },
      });
    }

    if (url.pathname === "/api/check") {
      return handleRestApi(request);
    }

    if (url.pathname.startsWith("/mcp")) {
      return handleMcp(request, env);
    }

    if (url.pathname === "/" || url.pathname === "") {
      return new Response(LANDING_PAGE_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response("Not found\n", { status: 404 });
  },
};

// --- Landing page ---

const LANDING_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preflight — MCP Server Publish Readiness Checker</title>
  <meta name="description" content="Check if your MCP server is ready to publish to the npm MCP registry, Smithery, or agenticmarket. Preflight audits server.json, smithery.yaml, and registry rules in seconds.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://skillfoundry.synaplex.ai/products/preflight/">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Preflight",
    "description": "MCP server publish readiness checker. Validates server.json, smithery.yaml, and registry requirements.",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "url": "https://skillfoundry.synaplex.ai/products/preflight/",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "author": { "@type": "Organization", "name": "Skillfoundry" }
  }
  </script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 760px; margin: 0 auto; padding: 2rem 1rem; color: #1a1a1a; line-height: 1.6; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .tagline { font-size: 1.15rem; color: #444; margin-bottom: 2rem; }
    h2 { font-size: 1.25rem; margin-top: 2rem; border-bottom: 1px solid #e5e5e5; padding-bottom: 0.4rem; }
    code, pre { background: #f4f4f4; border-radius: 4px; padding: 0.2em 0.4em; font-size: 0.9rem; }
    pre { padding: 1rem; overflow-x: auto; }
    .cta { display: inline-block; background: #1a1a1a; color: #fff; padding: 0.7rem 1.4rem; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 1rem 0; }
    .verdict-pass { color: #16a34a; font-weight: 600; }
    .verdict-fix { color: #b45309; font-weight: 600; }
    footer { margin-top: 3rem; font-size: 0.85rem; color: #888; border-top: 1px solid #e5e5e5; padding-top: 1rem; }
  </style>
</head>
<body>
  <h1>Preflight</h1>
  <p class="tagline">Know if your MCP server is ready to publish — before you submit.</p>

  <a class="cta" href="https://skillfoundry.synaplex.ai/products/preflight/mcp/">Try it via MCP →</a>

  <h2>What Preflight checks</h2>
  <ul>
    <li><code>server.json</code> schema compliance and required fields</li>
    <li><code>smithery.yaml</code> presence and structure</li>
    <li>Registry slug format (npm MCP registry, Smithery, agenticmarket)</li>
    <li>Version string format and semver compliance</li>
    <li>Homepage URL presence and reachability flag</li>
    <li><code>remotes</code> block structure and endpoint format</li>
    <li><code>package.json</code> fields required for npm publish</li>
  </ul>

  <h2>Who it's for</h2>
  <p>Solo MCP builders and small automation agencies preparing a first or updated listing on the npm MCP registry, Smithery, or agenticmarket. If you've ever had a submission rejected for a metadata gap you didn't know was there, Preflight flags it before you submit.</p>

  <h2>How to try it</h2>
  <p>Preflight is an MCP tool. Connect your MCP client to the endpoint below and call <code>check_publish_readiness</code> with your server artifacts:</p>
  <pre>MCP endpoint: https://skillfoundry.synaplex.ai/products/preflight/mcp/

Tool: check_publish_readiness
Parameters:
  manifest      — contents of your server.json
  package_json  — contents of your package.json (optional)
  smithery_yaml — contents of your smithery.yaml (optional)</pre>

  <p>Or use the REST API directly:</p>
  <pre>curl -X POST https://skillfoundry.synaplex.ai/products/preflight/api/check \\
  -H "Content-Type: application/json" \\
  -d '{"manifest": "{...your server.json contents...}"}'</pre>

  <h2>What the verdict means</h2>
  <p><span class="verdict-pass">checks_pass</span> — your server meets all registry requirements audited. Ready to submit.</p>
  <p><span class="verdict-fix">fixable</span> — specific gaps found. Preflight returns each failing rule and what to change.</p>

  <h2>The signal it produces</h2>
  <p>Every check run against live registry rules. When you fix what Preflight flags, your listing passes review. Preflight is updated as registry requirements change.</p>

  <footer>
    Operated by <a href="https://skillfoundry.synaplex.ai/">Skillfoundry</a>. Not affiliated with any registry.
    MCP endpoint: <code>https://skillfoundry.synaplex.ai/products/preflight/mcp/</code>
  </footer>
</body>
</html>
`;
