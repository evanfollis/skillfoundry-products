"""Typed request and response models for Launchpad Lint."""

from __future__ import annotations

from pydantic import BaseModel, Field


class LaunchReadinessResult(BaseModel):
    """Structured audit output for a candidate launch package."""

    readiness_score: int = Field(ge=0, le=100)
    blockers: list[str]
    warnings: list[str]
    strengths: list[str]
    suggested_fixes: list[str]


class LaunchPackageDraft(BaseModel):
    """Structured launch package draft for one candidate server."""

    short_description: str
    long_description: str
    example_prompts: list[str]
    explicit_limits: list[str]
    pricing_questions: list[str]


class LaunchFeedbackSubmission(BaseModel):
    """Feedback captured after one Launchpad Lint session."""

    reviewer_id: str = Field(min_length=1)
    session_id: str = Field(min_length=1)
    score: int = Field(ge=1, le=5)
    reduced_launch_ambiguity: bool
    required_only_light_editing: bool
    would_reuse: bool
    notes: str = ""


class LaunchFeedbackRecord(LaunchFeedbackSubmission):
    """Durable feedback record with Skillfoundry-managed metadata."""

    assumption_id: str
    probe_id: str
    recorded_at: str
    skill_slug: str
    skill_version: str


class LaunchFeedbackReceipt(BaseModel):
    """Receipt returned after feedback is recorded."""

    reviewer_id: str
    recorded_at: str
    replaced_existing: bool
    session_id: str


class LaunchFeedbackSummary(BaseModel):
    """Aggregated view of recorded feedback for quick interpretation."""

    average_score: float
    light_edit_rate: float
    reduced_launch_ambiguity_rate: float
    repeat_intent_rate: float
    total_reviews: int


class ToolTelemetrySummary(BaseModel):
    """Compact aggregate metrics for completed tool calls."""

    call_success_rate: float
    p50_latency_ms: float
    p95_latency_ms: float
    tool_breakdown: dict[str, dict[str, float | int]]
    total_completed_calls: int
