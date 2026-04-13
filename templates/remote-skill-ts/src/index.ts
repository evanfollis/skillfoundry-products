import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

import { skillConfig } from "./lib/skill-config.js";
import { emitTelemetry } from "./lib/telemetry.js";

type Env = {
  ENVIRONMENT?: string;
};

function buildServer(): McpServer {
  const server = new McpServer({
    name: skillConfig.skillSlug,
    version: skillConfig.skillVersion,
  });

  server.registerTool(
    "describe_probe",
    {
      description: "Return the current probe description, activation metric, and evidence target.",
      inputSchema: {
        audience: z.string().optional(),
      },
    },
    async ({ audience }) => {
      const lines = [
        `Probe: ${skillConfig.skillSlug}`,
        `Description: ${skillConfig.description}`,
        `Activation metric: ${skillConfig.activationMetric}`,
        `Assumption: ${skillConfig.assumptionId}`,
        `Probe id: ${skillConfig.probeId}`,
        `Target evidence: ${skillConfig.targetEvidenceClass}`,
        `Minimum evidence quality: ${skillConfig.minimumEvidenceQuality}`,
      ];

      if (audience) {
        lines.push(`Audience hint: ${audience}`);
      }

      return {
        content: [
          {
            type: "text",
            text: lines.join("\n"),
          },
        ],
      };
    },
  );

  return server;
}

async function handleMcp(request: Request, env: Env): Promise<Response> {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  const requestId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const url = new URL(request.url);

  emitTelemetry({
    environment: env.ENVIRONMENT ?? "development",
    requestId,
    sessionId,
    startedAt,
    toolName: url.pathname,
    type: "session_started",
  });

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);

    emitTelemetry({
      environment: env.ENVIRONMENT ?? "development",
      finishedAt: new Date().toISOString(),
      latencyMs: Date.now() - Date.parse(startedAt),
      requestId,
      sessionId,
      startedAt,
      success: response.status < 500,
      toolName: url.pathname,
      type: "session_completed",
    });

    return response;
  } catch (error) {
    emitTelemetry({
      environment: env.ENVIRONMENT ?? "development",
      errorCode: error instanceof Error ? error.name : "UnknownError",
      finishedAt: new Date().toISOString(),
      latencyMs: Date.now() - Date.parse(startedAt),
      requestId,
      sessionId,
      startedAt,
      success: false,
      toolName: url.pathname,
      type: "session_abandoned",
    });

    return new Response("Internal Server Error\n", { status: 500 });
  }
}

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

    if (url.pathname.startsWith("/mcp")) {
      return handleMcp(request, env);
    }

    return new Response(`${skillConfig.skillSlug} is running.\n`);
  },
};
