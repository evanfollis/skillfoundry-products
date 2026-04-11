/** Evidence confidence levels */
export type EvidenceLevel =
  | "verified_from_artifact"
  | "inferred";
// "verified_live" deferred to v1.1

/** Rule enforcement type */
export type RuleType =
  | "hard_requirement"
  | "directory_convention"
  | "heuristic";

/** Supported directories */
export type Directory = "mcp_registry" | "smithery" | "npm";

/** Finding severity */
export type Severity = "pass" | "warn" | "block";

/** Finding category */
export type FindingCategory =
  | "manifest"
  | "transport"
  | "tools"
  | "documentation"
  | "directory_policy";

/** Per-directory readiness state */
export type DirectoryState =
  | "ready"
  | "blocked"
  | "not_checked"
  | "not_applicable";

/** A single policy rule definition */
export interface PolicyRule {
  ruleId: string;
  directory: Directory;
  category: FindingCategory;
  check: string;
  type: RuleType;
  sourceUrl: string;
  lastReviewed: string; // ISO date
}

/** A single finding produced by the rules engine */
export interface Finding {
  severity: Severity;
  category: FindingCategory;
  check: string;
  evidence: string;
  evidenceLevel: EvidenceLevel;
  affectedArtifact: string;
  rule: {
    ruleId: string;
    directory: string;
    type: RuleType;
    sourceUrl: string;
    lastReviewed: string;
    policyPackVersion: string;
  };
  fix: string | null;
}

/** Directory readiness summary */
export interface DirectoryReadiness {
  state: DirectoryState;
  hardBlockers: number;
  conventionGaps: number;
  heuristicFlags: number;
}

/** Items not checked due to missing input */
export interface NotChecked {
  reason: string;
  whatItWouldVerify: string;
}

/** Top-level verdict */
export type Verdict = "checks_pass" | "fixable" | "not_ready";

/** Full output of check_publish_readiness */
export interface PreflightResult {
  mode: "artifact_lint";  // "live_probe" | "mixed" deferred to v1.1
  serverName: string | null;
  transportType: "streamableHttp" | "sse" | "stdio" | "unknown";
  verdict: Verdict;
  findings: Finding[];
  directoryReadiness: Record<string, DirectoryReadiness>;
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    blockers: number;
    evidenceBreakdown: {
      verifiedFromArtifact: number;
      inferred: number;
    };
  };
  notChecked: NotChecked[];
}
