/**
 * Artifact parsers — extract normalized data from raw file contents.
 * Each parser is defensive: malformed input produces parse errors, not crashes.
 */

const MAX_INPUT_BYTES = 512_000; // 500KB per artifact

export interface ParsedServerJson {
  raw: Record<string, unknown>;
  name?: string;
  title?: string;
  description?: string;
  version?: string;
  packages?: Array<{
    registryType?: string;
    identifier?: string;
    version?: string;
    transport?: { type?: string };
  }>;
  remotes?: Array<{
    type?: string;
    url?: string;
  }>;
  repository?: { url?: string; source?: string };
}

export interface ParsedPackageJson {
  raw: Record<string, unknown>;
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  bin?: unknown;
  license?: string;
  mcpName?: string;
  repository?: unknown;
}

export interface ParsedSmitheryYaml {
  raw: Record<string, unknown>;
  hasBuildConfig: boolean;
  transportType?: string;
}

export interface ParsedPyprojectToml {
  raw: Record<string, unknown>;
  projectName?: string;
  projectVersion?: string;
  projectDescription?: string;
  hasEntryPoints: boolean;
}

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function checkSize(input: string, artifact: string): string | null {
  const bytes = new TextEncoder().encode(input).length;
  if (bytes > MAX_INPUT_BYTES) {
    return `${artifact} exceeds maximum size (${bytes} bytes > ${MAX_INPUT_BYTES} bytes)`;
  }
  return null;
}

export function parseServerJson(raw: string): ParseResult<ParsedServerJson> {
  const sizeErr = checkSize(raw, "server.json");
  if (sizeErr) return { ok: false, error: sizeErr };

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "server.json is not valid JSON" };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: "server.json root must be an object" };
  }

  return {
    ok: true,
    data: {
      raw: parsed,
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      title: typeof parsed.title === "string" ? parsed.title : undefined,
      description:
        typeof parsed.description === "string"
          ? parsed.description
          : undefined,
      version:
        typeof parsed.version === "string" ? parsed.version : undefined,
      packages: Array.isArray(parsed.packages)
        ? (parsed.packages as unknown[])
            .filter((p): p is Record<string, unknown> =>
              typeof p === "object" && p !== null && !Array.isArray(p))
            .map((p) => ({
              registryType:
                typeof p.registryType === "string"
                  ? p.registryType
                  : undefined,
              identifier:
                typeof p.identifier === "string" ? p.identifier : undefined,
              version:
                typeof p.version === "string" ? p.version : undefined,
              transport:
                typeof p.transport === "object" &&
                p.transport !== null &&
                !Array.isArray(p.transport)
                  ? {
                      type:
                        typeof (p.transport as Record<string, unknown>).type ===
                        "string"
                          ? ((p.transport as Record<string, unknown>).type as string)
                          : undefined,
                    }
                  : undefined,
            }))
        : undefined,
      remotes: Array.isArray(parsed.remotes)
        ? (parsed.remotes as unknown[])
            .filter((r): r is Record<string, unknown> =>
              typeof r === "object" && r !== null && !Array.isArray(r))
            .map((r) => ({
              type: typeof r.type === "string" ? r.type : undefined,
              url: typeof r.url === "string" ? r.url : undefined,
            }))
        : undefined,
      repository:
        typeof parsed.repository === "object" &&
        parsed.repository !== null &&
        !Array.isArray(parsed.repository)
          ? {
              url:
                typeof (parsed.repository as Record<string, unknown>).url ===
                "string"
                  ? ((parsed.repository as Record<string, unknown>).url as string)
                  : undefined,
              source:
                typeof (parsed.repository as Record<string, unknown>)
                  .source === "string"
                  ? ((parsed.repository as Record<string, unknown>).source as string)
                  : undefined,
            }
          : undefined,
    },
  };
}

export function parsePackageJson(raw: string): ParseResult<ParsedPackageJson> {
  const sizeErr = checkSize(raw, "package.json");
  if (sizeErr) return { ok: false, error: sizeErr };

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "package.json is not valid JSON" };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: "package.json root must be an object" };
  }

  return {
    ok: true,
    data: {
      raw: parsed,
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      version:
        typeof parsed.version === "string" ? parsed.version : undefined,
      description:
        typeof parsed.description === "string"
          ? parsed.description
          : undefined,
      main: typeof parsed.main === "string" ? parsed.main : undefined,
      bin: parsed.bin,
      license:
        typeof parsed.license === "string" ? parsed.license : undefined,
      mcpName:
        typeof parsed.mcpName === "string" ? parsed.mcpName : undefined,
      repository: parsed.repository,
    },
  };
}

/**
 * Minimal YAML-like parser for smithery.yaml.
 * We avoid pulling a full YAML library into a Worker bundle.
 * Only extracts top-level keys we need.
 */
export function parseSmitheryYaml(
  raw: string,
): ParseResult<ParsedSmitheryYaml> {
  const sizeErr = checkSize(raw, "smithery.yaml");
  if (sizeErr) return { ok: false, error: sizeErr };

  // Check for build config presence (look for "build:" or "startCommand:" keys)
  const hasBuildConfig =
    /^build:/m.test(raw) || /^startCommand:/m.test(raw);

  // Look for transport type hints
  let transportType: string | undefined;
  const transportMatch = raw.match(
    /transport[:\s].*?(streamable[-_]?http|sse|stdio)/i,
  );
  if (transportMatch) {
    const t = transportMatch[1].toLowerCase().replace(/[-_]/g, "");
    if (t === "streamablehttp") transportType = "streamableHttp";
    else if (t === "sse") transportType = "sse";
    else if (t === "stdio") transportType = "stdio";
  }

  return {
    ok: true,
    data: {
      raw: {},
      hasBuildConfig,
      transportType,
    },
  };
}

/**
 * Minimal TOML-like parser for pyproject.toml.
 * Extracts only [project] section fields we need.
 */
export function parsePyprojectToml(
  raw: string,
): ParseResult<ParsedPyprojectToml> {
  const sizeErr = checkSize(raw, "pyproject.toml");
  if (sizeErr) return { ok: false, error: sizeErr };

  const nameMatch = raw.match(/^\s*name\s*=\s*"([^"]+)"/m);
  const versionMatch = raw.match(/^\s*version\s*=\s*"([^"]+)"/m);
  const descMatch = raw.match(/^\s*description\s*=\s*"([^"]+)"/m);
  const hasEntryPoints =
    /\[project\.scripts\]/m.test(raw) ||
    /\[project\.gui-scripts\]/m.test(raw) ||
    /\[tool\.poetry\.scripts\]/m.test(raw);

  return {
    ok: true,
    data: {
      raw: {},
      projectName: nameMatch?.[1],
      projectVersion: versionMatch?.[1],
      projectDescription: descMatch?.[1],
      hasEntryPoints,
    },
  };
}
