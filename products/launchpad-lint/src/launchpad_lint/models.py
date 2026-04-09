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
