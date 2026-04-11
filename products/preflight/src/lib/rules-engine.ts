/**
 * Rules engine — evaluates parsed artifacts against policy packs.
 * Produces typed findings with evidence levels and source-linked rules.
 */

import type {
  Directory,
  DirectoryReadiness,
  DirectoryState,
  Finding,
  NotChecked,
  PreflightResult,
  Severity,
  Verdict,
} from "./types.js";
import type {
  ParsedPackageJson,
  ParsedPyprojectToml,
  ParsedServerJson,
  ParsedSmitheryYaml,
} from "./parsers.js";
import { POLICY_PACK_VERSION, rulesForDirectory } from "./policy-packs.js";

export interface ParsedArtifacts {
  serverJson?: ParsedServerJson;
  packageJson?: ParsedPackageJson;
  smitheryYaml?: ParsedSmitheryYaml;
  pyprojectToml?: ParsedPyprojectToml;
  readme?: string;
  /** Parse errors from artifacts that were provided but couldn't be parsed */
  parseErrors: Array<{ artifact: string; error: string }>;
}

export interface CheckInput {
  artifacts: ParsedArtifacts;
  targetDirectories: Directory[];
}

function finding(
  rule: { ruleId: string; directory: string; type: string; sourceUrl: string; lastReviewed: string },
  severity: Severity,
  evidence: string,
  evidenceLevel: "verified_from_artifact" | "inferred",
  affectedArtifact: string,
  fix: string | null,
): Finding {
  return {
    severity,
    category: "manifest", // overridden by callers
    check: "", // overridden by callers
    evidence,
    evidenceLevel,
    affectedArtifact,
    rule: {
      ruleId: rule.ruleId,
      directory: rule.directory,
      type: rule.type as Finding["rule"]["type"],
      sourceUrl: rule.sourceUrl,
      lastReviewed: rule.lastReviewed,
      policyPackVersion: POLICY_PACK_VERSION,
    },
    fix,
  };
}

// --- MCP Registry checks ---

function checkMcpRegistry(artifacts: ParsedArtifacts): Finding[] {
  const findings: Finding[] = [];
  const rules = rulesForDirectory("mcp_registry");
  const ruleMap = Object.fromEntries(rules.map((r) => [r.ruleId, r]));

  const sj = artifacts.serverJson;

  // server.json present
  const r0 = ruleMap["mcpreg-server-json-present"];
  if (!sj) {
    findings.push({
      ...finding(r0, "block", "server.json not provided", "inferred", "server.json", "Create a server.json manifest. Use `mcp-publisher init` to generate a template."),
      category: r0.category,
      check: r0.check,
    });
    return findings; // Can't check further without server.json
  }

  findings.push({
    ...finding(r0, "pass", "server.json provided and parsed", "verified_from_artifact", "server.json", null),
    category: r0.category,
    check: r0.check,
  });

  // name required
  const r1 = ruleMap["mcpreg-name-required"];
  if (!sj.name) {
    findings.push({
      ...finding(r1, "block", "'name' field missing or not a string", "verified_from_artifact", "server.json", "Add a 'name' field in reverse-DNS format (e.g., 'io.github.username/server-name')."),
      category: r1.category,
      check: r1.check,
    });
  } else {
    const isReverseDns = /^[a-z][a-z0-9.-]*\/[a-z0-9._-]+$/i.test(sj.name);
    if (!isReverseDns) {
      findings.push({
        ...finding(r1, "block", `name '${sj.name}' is not in reverse-DNS format (required by registry schema)`, "verified_from_artifact", "server.json", "Use reverse-DNS format for name (e.g., 'io.github.username/server-name')."),
        category: r1.category,
        check: r1.check,
      });
    } else {
      findings.push({
        ...finding(r1, "pass", `name: '${sj.name}'`, "verified_from_artifact", "server.json", null),
        category: r1.category,
        check: r1.check,
      });
    }
  }

  // description required
  const r2 = ruleMap["mcpreg-description-required"];
  if (!sj.description) {
    findings.push({
      ...finding(r2, "block", "'description' field missing", "verified_from_artifact", "server.json", "Add a 'description' field to server.json."),
      category: r2.category,
      check: r2.check,
    });
  } else {
    findings.push({
      ...finding(r2, "pass", `description present (${sj.description.length} chars)`, "verified_from_artifact", "server.json", null),
      category: r2.category,
      check: r2.check,
    });
  }

  // version required
  const r3 = ruleMap["mcpreg-version-required"];
  if (!sj.version) {
    findings.push({
      ...finding(r3, "block", "'version' field missing", "verified_from_artifact", "server.json", "Add a 'version' field to server.json (semver recommended)."),
      category: r3.category,
      check: r3.check,
    });
  } else {
    findings.push({
      ...finding(r3, "pass", `version: '${sj.version}'`, "verified_from_artifact", "server.json", null),
      category: r3.category,
      check: r3.check,
    });
  }

  // packages and/or remotes
  const r4 = ruleMap["mcpreg-packages-or-remotes"];
  const hasPackages = sj.packages && sj.packages.length > 0;
  const hasRemotes = sj.remotes && sj.remotes.length > 0;
  if (!hasPackages && !hasRemotes) {
    findings.push({
      ...finding(r4, "block", "Neither 'packages' nor 'remotes' array present", "verified_from_artifact", "server.json", "Add a 'packages' array (for installable servers) and/or 'remotes' array (for hosted servers)."),
      category: r4.category,
      check: r4.check,
    });
  } else {
    const parts = [];
    if (hasPackages) parts.push(`${sj.packages!.length} package(s)`);
    if (hasRemotes) parts.push(`${sj.remotes!.length} remote(s)`);
    findings.push({
      ...finding(r4, "pass", parts.join(", "), "verified_from_artifact", "server.json", null),
      category: r4.category,
      check: r4.check,
    });
  }

  // Package-level checks
  if (hasPackages) {
    for (let i = 0; i < sj.packages!.length; i++) {
      const pkg = sj.packages![i];
      const label = `server.json packages[${i}]`;

      const r5 = ruleMap["mcpreg-package-registry-type"];
      if (!pkg.registryType) {
        findings.push({
          ...finding(r5, "block", `packages[${i}] missing 'registryType'`, "verified_from_artifact", label, `Add 'registryType' (npm, pypi, oci, nuget, or mcpb) to packages[${i}].`),
          category: r5.category,
          check: r5.check,
        });
      } else {
        findings.push({
          ...finding(r5, "pass", `registryType: '${pkg.registryType}'`, "verified_from_artifact", label, null),
          category: r5.category,
          check: r5.check,
        });
      }

      const r6 = ruleMap["mcpreg-package-identifier"];
      if (!pkg.identifier) {
        findings.push({
          ...finding(r6, "block", `packages[${i}] missing 'identifier'`, "verified_from_artifact", label, `Add 'identifier' (package name or URL) to packages[${i}].`),
          category: r6.category,
          check: r6.check,
        });
      } else {
        findings.push({
          ...finding(r6, "pass", `identifier: '${pkg.identifier}'`, "verified_from_artifact", label, null),
          category: r6.category,
          check: r6.check,
        });
      }

      const r7 = ruleMap["mcpreg-package-transport"];
      if (!pkg.transport?.type) {
        findings.push({
          ...finding(r7, "block", `packages[${i}] missing transport type`, "verified_from_artifact", label, `Add 'transport: { type: "stdio" }' (or "streamable-http"/"sse") to packages[${i}].`),
          category: r7.category,
          check: r7.check,
        });
      } else {
        findings.push({
          ...finding(r7, "pass", `transport: '${pkg.transport.type}'`, "verified_from_artifact", label, null),
          category: r7.category,
          check: r7.check,
        });
      }

      // npm-specific: mcpName verification
      if (pkg.registryType === "npm") {
        const r8 = ruleMap["mcpreg-npm-mcpname"];
        const pj = artifacts.packageJson;
        if (!pj) {
          findings.push({
            ...finding(r8, "warn", "npm package declared but package.json not provided — cannot verify mcpName", "inferred", "package.json", "Provide package.json content so mcpName can be verified."),
            category: r8.category,
            check: r8.check,
          });
        } else if (!pj.mcpName) {
          findings.push({
            ...finding(r8, "block", "package.json missing 'mcpName' field", "verified_from_artifact", "package.json", `Add '"mcpName": "${sj.name}"' to package.json.`),
            category: r8.category,
            check: r8.check,
          });
        } else if (pj.mcpName !== sj.name) {
          findings.push({
            ...finding(r8, "block", `mcpName '${pj.mcpName}' does not match server.json name '${sj.name}'`, "verified_from_artifact", "package.json", `Change mcpName in package.json to '${sj.name}'.`),
            category: r8.category,
            check: r8.check,
          });
        } else {
          findings.push({
            ...finding(r8, "pass", `mcpName matches: '${pj.mcpName}'`, "verified_from_artifact", "package.json", null),
            category: r8.category,
            check: r8.check,
          });
        }
      }

      // PyPI-specific: README marker
      if (pkg.registryType === "pypi") {
        const r9 = ruleMap["mcpreg-pypi-readme-marker"];
        const readme = artifacts.readme;
        if (!readme) {
          findings.push({
            ...finding(r9, "warn", "PyPI package declared but README not provided — cannot verify mcp-name marker", "inferred", "README", "Provide README content so mcp-name marker can be verified."),
            category: r9.category,
            check: r9.check,
          });
        } else {
          const markerPattern = new RegExp(`mcp-name:\\s*${sj.name?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') ?? ""}`);
          if (!markerPattern.test(readme)) {
            findings.push({
              ...finding(r9, "block", `README does not contain 'mcp-name: ${sj.name}' marker`, "verified_from_artifact", "README", `Add '<!-- mcp-name: ${sj.name} -->' to your README.`),
              category: r9.category,
              check: r9.check,
            });
          } else {
            findings.push({
              ...finding(r9, "pass", "mcp-name marker found in README", "verified_from_artifact", "README", null),
              category: r9.category,
              check: r9.check,
            });
          }
        }
      }
    }
  }

  // Remote-level checks
  if (hasRemotes) {
    for (let i = 0; i < sj.remotes!.length; i++) {
      const remote = sj.remotes![i];
      const label = `server.json remotes[${i}]`;

      const r10 = ruleMap["mcpreg-remote-type"];
      if (!remote.type) {
        findings.push({
          ...finding(r10, "block", `remotes[${i}] missing 'type'`, "verified_from_artifact", label, `Add 'type: "streamable-http"' (or "sse") to remotes[${i}].`),
          category: r10.category,
          check: r10.check,
        });
      } else if (remote.type !== "streamable-http" && remote.type !== "sse") {
        findings.push({
          ...finding(r10, "block", `remotes[${i}] type '${remote.type}' is not 'streamable-http' or 'sse' (only valid values)`, "verified_from_artifact", label, `Use 'streamable-http' or 'sse' as remote type.`),
          category: r10.category,
          check: r10.check,
        });
      } else {
        findings.push({
          ...finding(r10, "pass", `type: '${remote.type}'`, "verified_from_artifact", label, null),
          category: r10.category,
          check: r10.check,
        });
      }

      const r11 = ruleMap["mcpreg-remote-url"];
      if (!remote.url) {
        findings.push({
          ...finding(r11, "block", `remotes[${i}] missing 'url'`, "verified_from_artifact", label, `Add 'url' field to remotes[${i}].`),
          category: r11.category,
          check: r11.check,
        });
      } else {
        findings.push({
          ...finding(r11, "pass", `url: '${remote.url}'`, "verified_from_artifact", label, null),
          category: r11.category,
          check: r11.check,
        });
      }
    }
  }

  return findings;
}

// --- Smithery checks ---

function checkSmithery(artifacts: ParsedArtifacts): Finding[] {
  const findings: Finding[] = [];
  const rules = rulesForDirectory("smithery");
  const ruleMap = Object.fromEntries(rules.map((r) => [r.ruleId, r]));

  // Determine transport type from available artifacts
  let detectedTransport: string | undefined;

  if (artifacts.smitheryYaml?.transportType) {
    detectedTransport = artifacts.smitheryYaml.transportType;
  } else if (artifacts.serverJson?.remotes?.some((r) => r.type === "streamable-http")) {
    detectedTransport = "streamableHttp";
  } else if (artifacts.serverJson?.packages?.some((p) => p.transport?.type === "stdio")) {
    detectedTransport = "stdio";
  }

  // Streamable HTTP required
  const r0 = ruleMap["smithery-streamable-http"];
  if (detectedTransport === "streamableHttp" || detectedTransport === "streamable-http") {
    findings.push({
      ...finding(r0, "pass", `Streamable HTTP transport detected`, "verified_from_artifact", artifacts.smitheryYaml ? "smithery.yaml" : "server.json", null),
      category: r0.category,
      check: r0.check,
    });
  } else if (detectedTransport === "stdio") {
    findings.push({
      ...finding(r0, "block", `Transport is stdio — Smithery URL publishing requires Streamable HTTP`, "verified_from_artifact", artifacts.smitheryYaml ? "smithery.yaml" : "server.json", "Switch to Streamable HTTP transport for Smithery URL publishing."),
      category: r0.category,
      check: r0.check,
    });
  } else if (!detectedTransport) {
    findings.push({
      ...finding(r0, "warn", "Could not determine transport type from provided artifacts", "inferred", "smithery.yaml / server.json", "Ensure your server uses Streamable HTTP transport and provide smithery.yaml or server.json."),
      category: r0.category,
      check: r0.check,
    });
  } else {
    findings.push({
      ...finding(r0, "block", `Transport '${detectedTransport}' detected — Smithery requires Streamable HTTP`, "verified_from_artifact", artifacts.smitheryYaml ? "smithery.yaml" : "server.json", "Switch to Streamable HTTP transport for Smithery URL publishing."),
      category: r0.category,
      check: r0.check,
    });
  }

  // Public HTTPS — can only verify from remotes URL
  const r1 = ruleMap["smithery-public-https"];
  const remoteUrls = artifacts.serverJson?.remotes?.map((r) => r.url).filter(Boolean) ?? [];
  const hasHttps = remoteUrls.some((u) => u!.startsWith("https://"));
  if (remoteUrls.length === 0) {
    findings.push({
      ...finding(r1, "warn", "No remote URLs found in artifacts — cannot verify HTTPS", "inferred", "server.json", "Add a 'remotes' entry with your public HTTPS URL in server.json."),
      category: r1.category,
      check: r1.check,
    });
  } else if (!hasHttps) {
    findings.push({
      ...finding(r1, "block", `Remote URL(s) not using HTTPS: ${remoteUrls.join(", ")}`, "verified_from_artifact", "server.json", "Use HTTPS for your public endpoint URL."),
      category: r1.category,
      check: r1.check,
    });
  } else {
    findings.push({
      ...finding(r1, "pass", `HTTPS remote URL found`, "verified_from_artifact", "server.json", null),
      category: r1.category,
      check: r1.check,
    });
  }

  // Server card (convention, not hard requirement)
  const r2 = ruleMap["smithery-server-card-fallback"];
  // We can't verify server-card without live probing — mark as not verifiable from artifacts
  findings.push({
    ...finding(r2, "warn", "Cannot verify server-card presence without live endpoint — ensure /.well-known/mcp/server-card.json is served", "inferred", "endpoint", "Serve a server-card.json at /.well-known/mcp/server-card.json as a fallback for Smithery scanning."),
    category: r2.category,
    check: r2.check,
  });

  return findings;
}

// --- npm checks ---

function checkNpm(artifacts: ParsedArtifacts): Finding[] {
  const findings: Finding[] = [];
  const rules = rulesForDirectory("npm");
  const ruleMap = Object.fromEntries(rules.map((r) => [r.ruleId, r]));

  const pj = artifacts.packageJson;

  if (!pj) {
    // All npm rules become inferred warnings
    const r0 = ruleMap["npm-name-required"];
    findings.push({
      ...finding(r0, "block", "package.json not provided", "inferred", "package.json", "Provide package.json content for npm readiness checks."),
      category: r0.category,
      check: "package.json provided",
    });
    return findings;
  }

  // name
  const r0 = ruleMap["npm-name-required"];
  if (!pj.name) {
    findings.push({
      ...finding(r0, "block", "'name' field missing", "verified_from_artifact", "package.json", "Add a 'name' field to package.json."),
      category: r0.category,
      check: r0.check,
    });
  } else {
    findings.push({
      ...finding(r0, "pass", `name: '${pj.name}'`, "verified_from_artifact", "package.json", null),
      category: r0.category,
      check: r0.check,
    });
  }

  // version
  const r1 = ruleMap["npm-version-required"];
  if (!pj.version) {
    findings.push({
      ...finding(r1, "block", "'version' field missing", "verified_from_artifact", "package.json", "Add a 'version' field to package.json."),
      category: r1.category,
      check: r1.check,
    });
  } else {
    findings.push({
      ...finding(r1, "pass", `version: '${pj.version}'`, "verified_from_artifact", "package.json", null),
      category: r1.category,
      check: r1.check,
    });
  }

  // bin or main
  const r2 = ruleMap["npm-bin-or-main"];
  if (!pj.bin && !pj.main) {
    findings.push({
      ...finding(r2, "warn", "Neither 'bin' nor 'main' entry point found", "verified_from_artifact", "package.json", "Add a 'main' or 'bin' field to package.json to define the entry point."),
      category: r2.category,
      check: r2.check,
    });
  } else {
    const entry = pj.bin ? "bin" : "main";
    findings.push({
      ...finding(r2, "pass", `Entry point via '${entry}'`, "verified_from_artifact", "package.json", null),
      category: r2.category,
      check: r2.check,
    });
  }

  // description (heuristic)
  const r3 = ruleMap["npm-description"];
  if (!pj.description) {
    findings.push({
      ...finding(r3, "warn", "'description' field missing — reduces npm search visibility", "verified_from_artifact", "package.json", "Add a 'description' field to package.json for better npm search ranking."),
      category: r3.category,
      check: r3.check,
    });
  } else {
    findings.push({
      ...finding(r3, "pass", `description present (${pj.description.length} chars)`, "verified_from_artifact", "package.json", null),
      category: r3.category,
      check: r3.check,
    });
  }

  // license (heuristic)
  const r4 = ruleMap["npm-license"];
  if (!pj.license) {
    findings.push({
      ...finding(r4, "warn", "'license' field missing", "verified_from_artifact", "package.json", "Add a 'license' field (e.g., 'MIT', 'Apache-2.0')."),
      category: r4.category,
      check: r4.check,
    });
  } else {
    findings.push({
      ...finding(r4, "pass", `license: '${pj.license}'`, "verified_from_artifact", "package.json", null),
      category: r4.category,
      check: r4.check,
    });
  }

  // README (heuristic)
  const r5 = ruleMap["npm-readme"];
  if (!artifacts.readme) {
    findings.push({
      ...finding(r5, "warn", "README not provided", "inferred", "README", "Include README content for a complete npm readiness check."),
      category: r5.category,
      check: r5.check,
    });
  } else if (artifacts.readme.trim().length < 100) {
    findings.push({
      ...finding(r5, "warn", `README is very short (${artifacts.readme.trim().length} chars)`, "verified_from_artifact", "README", "Expand your README with usage examples, target audience, and setup instructions."),
      category: r5.category,
      check: r5.check,
    });
  } else {
    findings.push({
      ...finding(r5, "pass", `README present (${artifacts.readme.trim().length} chars)`, "verified_from_artifact", "README", null),
      category: r5.category,
      check: r5.check,
    });
  }

  return findings;
}

// --- Orchestrator ---

function deriveTransportType(artifacts: ParsedArtifacts): PreflightResult["transportType"] {
  if (artifacts.serverJson?.remotes?.some((r) => r.type === "streamable-http")) {
    return "streamableHttp";
  }
  if (artifacts.serverJson?.remotes?.some((r) => r.type === "sse")) {
    return "sse";
  }
  if (artifacts.serverJson?.packages?.some((p) => p.transport?.type === "stdio")) {
    return "stdio";
  }
  if (artifacts.smitheryYaml?.transportType === "streamableHttp") {
    return "streamableHttp";
  }
  return "unknown";
}

function computeDirectoryReadiness(
  findings: Finding[],
  directory: string,
  wasChecked: boolean,
): DirectoryReadiness {
  if (!wasChecked) {
    return { state: "not_checked", hardBlockers: 0, conventionGaps: 0, heuristicFlags: 0 };
  }

  const dirFindings = findings.filter((f) => f.rule.directory === directory);
  const hardBlockers = dirFindings.filter(
    (f) => f.severity === "block" && f.rule.type === "hard_requirement",
  ).length;
  const conventionGaps = dirFindings.filter(
    (f) =>
      (f.severity === "block" || f.severity === "warn") &&
      f.rule.type === "directory_convention",
  ).length;
  const heuristicFlags = dirFindings.filter(
    (f) => f.severity === "warn" && f.rule.type === "heuristic",
  ).length;

  let state: DirectoryState;
  if (hardBlockers > 0) {
    state = "blocked";
  } else {
    state = "ready";
  }

  return { state, hardBlockers, conventionGaps, heuristicFlags };
}

function computeVerdict(findings: Finding[]): Verdict {
  const blockers = findings.filter((f) => f.severity === "block");
  if (blockers.length === 0) return "checks_pass";

  // "not_ready" if there are blockers without fixes
  const unfixable = blockers.filter((f) => !f.fix);
  if (unfixable.length > 0) return "not_ready";

  return "fixable";
}

function buildNotChecked(
  artifacts: ParsedArtifacts,
  targetDirectories: Directory[],
): NotChecked[] {
  const items: NotChecked[] = [];

  // Always note live probing is deferred
  items.push({
    reason: "Live endpoint probing is not yet supported (v1.1)",
    whatItWouldVerify:
      "HTTPS certificate, MCP transport negotiation, actual tool/resource/prompt listing, response latency, server-card accessibility",
  });

  if (!artifacts.serverJson) {
    items.push({
      reason: "No server.json manifest provided",
      whatItWouldVerify:
        "MCP Registry schema compliance, packages/remotes configuration, name format",
    });
  }

  if (!artifacts.packageJson && targetDirectories.includes("npm")) {
    items.push({
      reason: "No package.json provided",
      whatItWouldVerify: "npm publish requirements (name, version, entry point, mcpName)",
    });
  }

  if (!artifacts.smitheryYaml && targetDirectories.includes("smithery")) {
    items.push({
      reason: "No smithery.yaml provided",
      whatItWouldVerify: "Smithery build configuration and transport type",
    });
  }

  if (!artifacts.readme) {
    items.push({
      reason: "No README content provided",
      whatItWouldVerify: "Documentation quality, PyPI mcp-name marker, npm search content",
    });
  }

  return items;
}

export function evaluate(input: CheckInput): PreflightResult {
  const { artifacts, targetDirectories } = input;
  const allFindings: Finding[] = [];

  // Add parse error findings — attach to each target directory so they
  // count toward per-directory readiness correctly.
  for (const pe of artifacts.parseErrors) {
    for (const dir of targetDirectories) {
      allFindings.push({
        severity: "block",
        category: "manifest",
        check: `${pe.artifact} is parseable`,
        evidence: pe.error,
        evidenceLevel: "verified_from_artifact",
        affectedArtifact: pe.artifact,
        rule: {
          ruleId: "parse-error",
          directory: dir,
          type: "hard_requirement",
          sourceUrl: "",
          lastReviewed: "",
          policyPackVersion: POLICY_PACK_VERSION,
        },
        fix: `Fix the parse error in ${pe.artifact}: ${pe.error}`,
      });
    }
  }

  // Run directory-specific checks
  const checkedDirectories = new Set<string>();

  if (targetDirectories.includes("mcp_registry")) {
    checkedDirectories.add("mcp_registry");
    allFindings.push(...checkMcpRegistry(artifacts));
  }

  if (targetDirectories.includes("smithery")) {
    checkedDirectories.add("smithery");
    allFindings.push(...checkSmithery(artifacts));
  }

  if (targetDirectories.includes("npm")) {
    checkedDirectories.add("npm");
    allFindings.push(...checkNpm(artifacts));
  }

  // Compute summaries
  const passed = allFindings.filter((f) => f.severity === "pass").length;
  const warnings = allFindings.filter((f) => f.severity === "warn").length;
  const blockers = allFindings.filter((f) => f.severity === "block").length;

  const verifiedFromArtifact = allFindings.filter(
    (f) => f.evidenceLevel === "verified_from_artifact",
  ).length;
  const inferred = allFindings.filter(
    (f) => f.evidenceLevel === "inferred",
  ).length;

  const directoryReadiness: Record<string, DirectoryReadiness> = {};
  for (const dir of ["mcp_registry", "smithery", "npm"] as Directory[]) {
    directoryReadiness[dir] = computeDirectoryReadiness(
      allFindings,
      dir,
      checkedDirectories.has(dir),
    );
  }

  const serverName =
    artifacts.serverJson?.name ??
    artifacts.packageJson?.name ??
    artifacts.pyprojectToml?.projectName ??
    null;

  return {
    mode: "artifact_lint",
    serverName,
    transportType: deriveTransportType(artifacts),
    verdict: computeVerdict(allFindings),
    findings: allFindings,
    directoryReadiness,
    summary: {
      totalChecks: allFindings.length,
      passed,
      warnings,
      blockers,
      evidenceBreakdown: {
        verifiedFromArtifact,
        inferred,
      },
    },
    notChecked: buildNotChecked(artifacts, targetDirectories),
  };
}
