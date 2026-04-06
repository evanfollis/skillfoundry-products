from __future__ import annotations

import unittest

from bottleneck_radar_server.analysis import analyze_sources, draft_brief_from_cluster
from bottleneck_radar_server.models import SignalSource, SourceKind


class AnalysisTests(unittest.TestCase):
    def test_analyze_signals_returns_ranked_clusters(self) -> None:
        result = analyze_sources(
            sources=[
                SignalSource(
                    kind=SourceKind.TEXT,
                    value=(
                        "Builders keep asking which MCP server to build next because they have plenty of raw signals but no way to rank them. "
                        "Multiple issue threads say signal prioritization is still manual and noisy."
                    ),
                ),
                SignalSource(
                    kind=SourceKind.TEXT,
                    value=(
                        "We have ideas from Discord, GitHub, and docs comments, but turning that into a ranked opportunity list is slow."
                    ),
                ),
            ],
            target_user="MCP builders",
            max_clusters=3,
        )

        self.assertEqual(result.target_user, "MCP builders")
        self.assertGreaterEqual(len(result.clusters), 1)
        self.assertEqual(result.clusters[0].cluster_id, "signal-opportunity-synthesis")
        self.assertGreaterEqual(result.clusters[0].confidence, 0.35)

    def test_draft_brief_from_cluster(self) -> None:
        brief = draft_brief_from_cluster(
            cluster_title="Signal-to-opportunity synthesis",
            pain_summary="Builders struggle to rank recurring pains from noisy source data.",
            evidence_snippets=["Ranking problems is still manual."],
            target_user="technical builders",
        )

        self.assertIn("signal-to-opportunity-synthesis", brief.product_name)
        self.assertEqual(brief.tool_surface, ["analyze_signals", "draft_brief"])
        self.assertIn("Hosted HTTPS MCP endpoint", brief.deployment_constraints)


if __name__ == "__main__":
    unittest.main()
