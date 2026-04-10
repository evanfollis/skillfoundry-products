export type SkillConfig = {
  activationMetric: string;
  description: string;
  skillSlug: string;
  skillVersion: string;
};

export const skillConfig: SkillConfig = {
  skillSlug: "remote-skill-ts-template",
  skillVersion: "0.1.0",
  description: "Template for narrow remote Skillfoundry MCP skills.",
  activationMetric: "One successful first session that reaches the tool's intended outcome.",
};
