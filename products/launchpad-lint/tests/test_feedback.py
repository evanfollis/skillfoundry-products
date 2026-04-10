from __future__ import annotations

import json
import os
import tempfile
import unittest

from launchpad_lint.feedback_store import record_feedback, summarize_feedback
from launchpad_lint.models import LaunchFeedbackSubmission


class FeedbackStoreTests(unittest.TestCase):
    def test_record_feedback_replaces_existing_reviewer_record(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "feedback.json")
            previous = os.environ.get("LAUNCHPAD_LINT_FEEDBACK_PATH")
            os.environ["LAUNCHPAD_LINT_FEEDBACK_PATH"] = path
            try:
                first = record_feedback(
                    LaunchFeedbackSubmission(
                        reviewer_id="agent-1",
                        session_id="session-a",
                        score=3,
                        reduced_launch_ambiguity=True,
                        required_only_light_editing=False,
                        would_reuse=False,
                        notes="first pass",
                    )
                )
                second = record_feedback(
                    LaunchFeedbackSubmission(
                        reviewer_id="agent-1",
                        session_id="session-b",
                        score=5,
                        reduced_launch_ambiguity=True,
                        required_only_light_editing=True,
                        would_reuse=True,
                        notes="better result",
                    )
                )

                self.assertFalse(first.replaced_existing)
                self.assertTrue(second.replaced_existing)

                with open(path, encoding="utf-8") as handle:
                    data = json.loads(handle.read())
                self.assertEqual(list(data.keys()), ["agent-1"])
                self.assertEqual(data["agent-1"]["score"], 5)
                self.assertEqual(data["agent-1"]["session_id"], "session-b")
            finally:
                if previous is None:
                    os.environ.pop("LAUNCHPAD_LINT_FEEDBACK_PATH", None)
                else:
                    os.environ["LAUNCHPAD_LINT_FEEDBACK_PATH"] = previous

    def test_summarize_feedback_returns_compact_rates(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            path = os.path.join(tmpdir, "feedback.json")
            previous = os.environ.get("LAUNCHPAD_LINT_FEEDBACK_PATH")
            os.environ["LAUNCHPAD_LINT_FEEDBACK_PATH"] = path
            try:
                record_feedback(
                    LaunchFeedbackSubmission(
                        reviewer_id="agent-1",
                        session_id="session-a",
                        score=4,
                        reduced_launch_ambiguity=True,
                        required_only_light_editing=True,
                        would_reuse=True,
                        notes="good",
                    )
                )
                record_feedback(
                    LaunchFeedbackSubmission(
                        reviewer_id="agent-2",
                        session_id="session-b",
                        score=2,
                        reduced_launch_ambiguity=False,
                        required_only_light_editing=False,
                        would_reuse=False,
                        notes="bad",
                    )
                )

                summary = summarize_feedback()
                self.assertEqual(summary.total_reviews, 2)
                self.assertEqual(summary.average_score, 3.0)
                self.assertEqual(summary.reduced_launch_ambiguity_rate, 0.5)
                self.assertEqual(summary.light_edit_rate, 0.5)
                self.assertEqual(summary.repeat_intent_rate, 0.5)
            finally:
                if previous is None:
                    os.environ.pop("LAUNCHPAD_LINT_FEEDBACK_PATH", None)
                else:
                    os.environ["LAUNCHPAD_LINT_FEEDBACK_PATH"] = previous


if __name__ == "__main__":
    unittest.main()
