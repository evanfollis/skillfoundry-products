from __future__ import annotations

import json
import os
import unittest

from launchpad_lint.metadata import registry_manifest, server_card


class MetadataTests(unittest.TestCase):
    def test_registry_manifest_uses_canonical_remote_url(self) -> None:
        previous = os.environ.get("LAUNCHPAD_LINT_PUBLIC_BASE_URL")
        os.environ["LAUNCHPAD_LINT_PUBLIC_BASE_URL"] = "https://example.com/launchpad"
        try:
            manifest = registry_manifest()
        finally:
            if previous is None:
                os.environ.pop("LAUNCHPAD_LINT_PUBLIC_BASE_URL", None)
            else:
                os.environ["LAUNCHPAD_LINT_PUBLIC_BASE_URL"] = previous

        self.assertEqual(manifest["remotes"][0]["url"], "https://example.com/launchpad/mcp/")
        self.assertEqual(manifest["name"], "io.github.evanfollis/launchpad-lint")

    def test_server_card_lists_current_tools(self) -> None:
        card = server_card()
        tool_names = [tool["name"] for tool in card["tools"]]
        self.assertEqual(tool_names, ["audit_launch_readiness", "draft_launch_package"])
        json.dumps(card)


if __name__ == "__main__":
    unittest.main()
