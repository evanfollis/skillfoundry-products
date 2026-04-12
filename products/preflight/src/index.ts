/**
 * Preflight — MCP server publish readiness checker.
 * Cloudflare Worker entry point.
 *
 * Implements MCP Streamable HTTP transport directly (no Node.js SDK transport),
 * plus a REST API at /api/check for non-MCP consumers.
 */

import { skillConfig } from "./lib/skill-config.js";
import { emitTelemetry } from "./lib/telemetry.js";
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
  return { ...result, targetDirectories };
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

  emitTelemetry({
    environment: env.ENVIRONMENT ?? "development",
    requestId,
    sessionId,
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

    return new Response(
      `Preflight — MCP server publish readiness checker.\nVersion: ${skillConfig.skillVersion}\n`,
    );
  },
};
