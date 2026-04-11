/**
 * Directory-specific policy packs.
 * Every rule is source-linked, typed, and dated.
 * Derived from actual directory documentation fetched 2026-04-11.
 */

import type { PolicyRule } from "./types.js";

export const POLICY_PACK_VERSION = "0.1.0";
const REVIEWED = "2026-04-11";

// --- MCP Registry ---
// Sources:
//   https://modelcontextprotocol.io/registry/quickstart
//   https://modelcontextprotocol.io/registry/package-types
//   https://modelcontextprotocol.io/registry/remote-servers
//   https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json

const mcpRegistryRules: PolicyRule[] = [
  {
    ruleId: "mcpreg-server-json-present",
    directory: "mcp_registry",
    category: "manifest",
    check: "server.json manifest provided",
    type: "hard_requirement",
    sourceUrl: "https://modelcontextprotocol.io/registry/quickstart",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "mcpreg-name-required",
    directory: "mcp_registry",
    category: "manifest",
    check: "server.json has 'name' field (reverse-DNS format)",
    type: "hard_requirement",
    sourceUrl:
      "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "mcpreg-description-required",
    directory: "mcp_registry",
    category: "manifest",
    check: "server.json has 'description' field",
    type: "hard_requirement",
    sourceUrl:
      "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "mcpreg-version-required",
    directory: "mcp_registry",
    category: "manifest",
    check: "server.json has 'version' field",
    type: "hard_requirement",
    sourceUrl:
      "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "mcpreg-packages-or-remotes",
    directory: "mcp_registry",
    category: "manifest",
    check: "server.json has 'packages' and/or 'remotes' array",
    type: "hard_requirement",
    sourceUrl: "https://modelcontextprotocol.io/registry/quickstart",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "mcpreg-package-registry-type",
    directory: "mcp_registry",
    category: "manifest",
    check: "Each package entry has 'registryType' field",
    type: "hard_requirement",
    sourceUrl: "https://modelcontextprotocol.io/registry/package-types",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "mcpreg-package-identifier",
    directory: "mcp_registry",
    category: "manifest",
    check: "Each package entry has 'identifier' field",
    type: "hard_requirement",
    sourceUrl: "https://modelcontextprotocol.io/registry/package-types",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "mcpreg-package-transport",
    directory: "mcp_registry",
    category: "transport",
    check: "Each package entry has 'transport' with 'type' field",
    type: "hard_requirement",
    sourceUrl: "https://modelcontextprotocol.io/registry/package-types",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "mcpreg-remote-type",
    directory: "mcp_registry",
    category: "transport",
    check: "Each remote entry has 'type' field (streamable-http or sse)",
    type: "hard_requirement",
    sourceUrl: "https://modelcontextprotocol.io/registry/remote-servers",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "mcpreg-remote-url",
    directory: "mcp_registry",
    category: "transport",
    check: "Each remote entry has 'url' field",
    type: "hard_requirement",
    sourceUrl: "https://modelcontextprotocol.io/registry/remote-servers",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "mcpreg-npm-mcpname",
    directory: "mcp_registry",
    category: "directory_policy",
    check:
      "npm packages: package.json has 'mcpName' matching server.json 'name'",
    type: "hard_requirement",
    sourceUrl: "https://modelcontextprotocol.io/registry/package-types",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "mcpreg-pypi-readme-marker",
    directory: "mcp_registry",
    category: "directory_policy",
    check:
      "PyPI packages: README contains 'mcp-name: <server-name>' marker",
    type: "hard_requirement",
    sourceUrl: "https://modelcontextprotocol.io/registry/package-types",
    lastReviewed: REVIEWED,
  },
];

// --- Smithery ---
// Source: https://smithery.ai/docs/build/publish

const smitheryRules: PolicyRule[] = [
  {
    ruleId: "smithery-streamable-http",
    directory: "smithery",
    category: "transport",
    check: "Streamable HTTP transport required for URL publishing",
    type: "hard_requirement",
    sourceUrl: "https://smithery.ai/docs/build/publish",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "smithery-public-https",
    directory: "smithery",
    category: "transport",
    check: "Server must be publicly accessible via HTTPS",
    type: "hard_requirement",
    sourceUrl: "https://smithery.ai/docs/build/publish",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "smithery-server-card-fallback",
    directory: "smithery",
    category: "manifest",
    check:
      "/.well-known/mcp/server-card.json present (fallback for scan failures)",
    type: "directory_convention",
    sourceUrl: "https://smithery.ai/docs/build/publish",
    lastReviewed: REVIEWED,
  },
];

// --- npm ---
// Source: https://docs.npmjs.com/cli/v11/configuring-npm/package-json

const npmRules: PolicyRule[] = [
  {
    ruleId: "npm-name-required",
    directory: "npm",
    category: "manifest",
    check: "package.json has 'name' field",
    type: "hard_requirement",
    sourceUrl:
      "https://docs.npmjs.com/cli/v11/configuring-npm/package-json#name",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "npm-version-required",
    directory: "npm",
    category: "manifest",
    check: "package.json has 'version' field",
    type: "hard_requirement",
    sourceUrl:
      "https://docs.npmjs.com/cli/v11/configuring-npm/package-json#version",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "npm-bin-or-main",
    directory: "npm",
    category: "manifest",
    check: "package.json has 'bin' or 'main' entry point",
    type: "directory_convention",
    sourceUrl:
      "https://docs.npmjs.com/cli/v11/configuring-npm/package-json#main",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "npm-description",
    directory: "npm",
    category: "documentation",
    check: "package.json has 'description' field for npm search",
    type: "heuristic",
    sourceUrl:
      "https://docs.npmjs.com/cli/v11/configuring-npm/package-json#description",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "npm-license",
    directory: "npm",
    category: "documentation",
    check: "package.json has 'license' field",
    type: "heuristic",
    sourceUrl:
      "https://docs.npmjs.com/cli/v11/configuring-npm/package-json#license",
    lastReviewed: REVIEWED,
  },
  {
    ruleId: "npm-readme",
    directory: "npm",
    category: "documentation",
    check: "README present with substantive content",
    type: "heuristic",
    sourceUrl: "https://docs.npmjs.com/cli/v11/configuring-npm/package-json",
    lastReviewed: REVIEWED,
  },
];

export const ALL_RULES: PolicyRule[] = [
  ...mcpRegistryRules,
  ...smitheryRules,
  ...npmRules,
];

export function rulesForDirectory(directory: string): PolicyRule[] {
  return ALL_RULES.filter((r) => r.directory === directory);
}
