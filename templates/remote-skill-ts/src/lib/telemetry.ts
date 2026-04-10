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
};

export function emitTelemetry(event: SkillTelemetryEvent): void {
  const payload = {
    ...event,
    skillSlug: skillConfig.skillSlug,
    skillVersion: skillConfig.skillVersion,
  };

  console.log(JSON.stringify(payload));
}
