import { skillConfig } from "./skill-config.js";

export type SkillTelemetryEventName =
  | "session_started"
  | "tool_called"
  | "session_completed"
  | "session_abandoned"
  | "user_feedback_recorded";

export type SkillTelemetryEvent = {
  environment: string;
  errorCode?: string;
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  estimatedTotalTokens?: number;
  finishedAt?: string;
  inputSizeBytes?: number;
  latencyMs?: number;
  outputSizeBytes?: number;
  requestId: string;
  sessionId: string;
  startedAt: string;
  success?: boolean;
  toolName?: string;
  type: SkillTelemetryEventName;
  userAgent?: string;
  verdict?: string;
};

export function emitTelemetry(event: SkillTelemetryEvent): void {
  const payload = {
    ...event,
    assumptionId: skillConfig.assumptionId,
    artifactClass: skillConfig.artifactClass,
    minimumEvidenceQuality: skillConfig.minimumEvidenceQuality,
    probeId: skillConfig.probeId,
    probeType: skillConfig.probeType,
    skillSlug: skillConfig.skillSlug,
    skillVersion: skillConfig.skillVersion,
    targetEvidenceClass: skillConfig.targetEvidenceClass,
  };

  console.log(JSON.stringify(payload));
}
