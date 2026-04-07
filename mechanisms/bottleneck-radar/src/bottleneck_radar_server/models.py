"""Typed request and response models for Bottleneck Radar."""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class SourceKind(str, Enum):
    """Supported source kinds for analysis."""

    URL = "url"
    TEXT = "text"


class SignalSource(BaseModel):
    """One signal source provided by the caller."""

    kind: SourceKind
    value: str = Field(min_length=1)


class BottleneckCluster(BaseModel):
    """One ranked bottleneck cluster."""

    cluster_id: str
    title: str
    pain_summary: str
    evidence_snippets: list[str]
    confidence: float = Field(ge=0.0, le=1.0)
    why_now: str
    suggested_next_question: str


class AnalyzeSignalsResult(BaseModel):
    """Structured result for signal analysis."""

    target_user: str
    clusters: list[BottleneckCluster]


class DraftBriefResult(BaseModel):
    """Structured brief output for one selected bottleneck."""

    product_name: str
    target_user: str
    problem_statement: str
    narrow_solution: str
    tool_surface: list[str]
    deployment_constraints: list[str]
    pricing_hypothesis: str
    open_questions: list[str]
