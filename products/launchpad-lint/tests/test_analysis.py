from __future__ import annotations

import unittest

from launchpad_lint.analysis import audit_launch_readiness, draft_launch_package


class AnalysisTests(unittest.TestCase):
    def test_audit_launch_readiness_flags_missing_material(self) -> None:
        result = audit_launch_readiness(
            server_name="launchpad-lint",
            tool_names=["audit_launch_readiness", "draft_launch_package"],
            tool_descriptions=[
                "Audit a server package and point out what is missing before launch.",
                "Draft a concise launch package with examples and limits.",
            ],
            readme_text="Launchpad Lint helps builders. Example prompts included.",
            endpoint_url="https://example.com/mcp",
        )

        self.assertGreaterEqual(result.readiness_score, 60)
        self.assertIn("Public HTTPS endpoint is already present.", result.strengths)
        self.assertTrue(any("limits" in warning.lower() for warning in result.warnings))

    def test_draft_launch_package(self) -> None:
        package = draft_launch_package(
            server_name="launchpad-lint",
            target_user="technical builders",
            tool_names=["audit_launch_readiness", "draft_launch_package"],
            tool_descriptions=[
                "Audit launch readiness.",
                "Draft launch package.",
            ],
        )

        self.assertIn("technical builders", package.short_description)
        self.assertEqual(len(package.example_prompts), 3)
        self.assertTrue(any("pricing" in question.lower() for question in package.pricing_questions))


if __name__ == "__main__":
    unittest.main()
