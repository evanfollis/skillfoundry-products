export type SkillConfig = {
  activationMetric: string;
  artifactClass: string;
  assumptionId: string;
  description: string;
  minimumEvidenceQuality: string;
  probeId: string;
  probeType: string;
  skillSlug: string;
  skillVersion: string;
  targetEvidenceClass: string;
};

export const skillConfig: SkillConfig = {
  assumptionId: "mcp-builders-need-publish-readiness-check",
  probeId: "preflight-publish-readiness",
  probeType: "remote_mcp_server",
  artifactClass: "mcp_diagnostic",
  targetEvidenceClass: "behavioral_signal",
  minimumEvidenceQuality: "moderate",
  skillSlug: "preflight",
  skillVersion: "0.1.0",
  description:
    "Validate whether an MCP server is publishable on real directories (MCP Registry, Smithery, npm).",
  activationMetric:
    "One completed check with at least one finding that leads to a re-check showing improvement.",
};
