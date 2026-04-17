import { skillConfig } from "./skill-config.js";

export type TelemetryEventName =
  | "session_started"
  | "tool_called"
  | "session_completed"
  | "session_abandoned";

export type SourceType = "user" | "system" | "smoke" | "cron";

export type TelemetryEvent = {
  environment: string;
  errorCode?: string;
  finishedAt?: string;
  inputSizeBytes?: number;
  latencyMs?: number;
  outputSizeBytes?: number;
  requestId: string;
  sessionId: string;
  sourceType: SourceType;
  startedAt: string;
  success?: boolean;
  toolName?: string;
  type: TelemetryEventName;
  userAgent?: string;
  verdict?: string;
  targetDirectories?: string[];
};

export function emitTelemetry(event: TelemetryEvent): void {
  const payload = {
    ...event,
    assumptionId: skillConfig.assumptionId,
    artifactClass: skillConfig.artifactClass,
    probeId: skillConfig.probeId,
    probeType: skillConfig.probeType,
    skillSlug: skillConfig.skillSlug,
    skillVersion: skillConfig.skillVersion,
  };

  console.log(JSON.stringify(payload));
}
