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
  assumptionId: "example-critical-assumption",
  probeId: "example-probe",
  probeType: "remote_mcp_server",
  artifactClass: "mcp_probe",
  targetEvidenceClass: "external_commitment",
  minimumEvidenceQuality: "moderate",
  skillSlug: "remote-skill-ts-template",
  skillVersion: "0.1.0",
  description: "Template for narrow remote Skillfoundry MCP probes or offerings.",
  activationMetric: "One successful first session that reaches the tool's intended outcome.",
};
