"""Durable feedback storage for Launchpad Lint."""

from __future__ import annotations

import json
import os
from datetime import UTC, datetime
from pathlib import Path

from .models import (
    LaunchFeedbackReceipt,
    LaunchFeedbackRecord,
    LaunchFeedbackSubmission,
    LaunchFeedbackSummary,
)

SKILL_SLUG = "launchpad-lint"
SKILL_VERSION = "0.1.0"


def _default_feedback_path() -> Path:
    return Path(__file__).resolve().parents[2] / "artifacts" / "feedback" / "launchpad_lint_feedback.json"


def _feedback_path() -> Path:
    configured = os.getenv("LAUNCHPAD_LINT_FEEDBACK_PATH")
    return Path(configured).expanduser() if configured else _default_feedback_path()


def _read_feedback_map() -> dict[str, LaunchFeedbackRecord]:
    path = _feedback_path()
    if not path.exists():
        return {}

    data = json.loads(path.read_text())
    return {
        reviewer_id: LaunchFeedbackRecord.model_validate(record)
        for reviewer_id, record in data.items()
    }


def _write_feedback_map(feedback_map: dict[str, LaunchFeedbackRecord]) -> None:
    path = _feedback_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    serialized = {
        reviewer_id: record.model_dump(mode="json")
        for reviewer_id, record in sorted(feedback_map.items())
    }
    path.write_text(json.dumps(serialized, indent=2, sort_keys=True) + "\n")


def record_feedback(submission: LaunchFeedbackSubmission) -> LaunchFeedbackReceipt:
    """Upsert the latest feedback for one reviewer."""

    feedback_map = _read_feedback_map()
    replaced_existing = submission.reviewer_id in feedback_map
    recorded_at = datetime.now(UTC).isoformat().replace("+00:00", "Z")

    feedback_map[submission.reviewer_id] = LaunchFeedbackRecord(
        **submission.model_dump(),
        recorded_at=recorded_at,
        skill_slug=SKILL_SLUG,
        skill_version=SKILL_VERSION,
    )
    _write_feedback_map(feedback_map)

    return LaunchFeedbackReceipt(
        reviewer_id=submission.reviewer_id,
        recorded_at=recorded_at,
        replaced_existing=replaced_existing,
        session_id=submission.session_id,
    )


def summarize_feedback() -> LaunchFeedbackSummary:
    """Compute a compact quality summary for live feedback records."""

    feedback = list(_read_feedback_map().values())
    total_reviews = len(feedback)
    if total_reviews == 0:
        return LaunchFeedbackSummary(
            average_score=0.0,
            light_edit_rate=0.0,
            reduced_launch_ambiguity_rate=0.0,
            repeat_intent_rate=0.0,
            total_reviews=0,
        )

    average_score = sum(record.score for record in feedback) / total_reviews
    reduced_launch_ambiguity_rate = (
        sum(1 for record in feedback if record.reduced_launch_ambiguity) / total_reviews
    )
    light_edit_rate = sum(1 for record in feedback if record.required_only_light_editing) / total_reviews
    repeat_intent_rate = sum(1 for record in feedback if record.would_reuse) / total_reviews

    return LaunchFeedbackSummary(
        average_score=round(average_score, 2),
        light_edit_rate=round(light_edit_rate, 3),
        reduced_launch_ambiguity_rate=round(reduced_launch_ambiguity_rate, 3),
        repeat_intent_rate=round(repeat_intent_rate, 3),
        total_reviews=total_reviews,
    )
