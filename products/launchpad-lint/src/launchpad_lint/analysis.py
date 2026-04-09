"""Deterministic launch-readiness analysis for Launchpad Lint."""

from __future__ import annotations

from .models import LaunchPackageDraft, LaunchReadinessResult


def audit_launch_readiness(
    *,
    server_name: str,
    tool_names: list[str],
    tool_descriptions: list[str],
    readme_text: str = "",
    listing_draft: str = "",
    endpoint_url: str = "",
) -> LaunchReadinessResult:
    """Audit a candidate package for obvious launch blockers and weaknesses."""

    blockers: list[str] = []
    warnings: list[str] = []
    strengths: list[str] = []
    suggested_fixes: list[str] = []

    if not server_name.strip():
        blockers.append("Server name is required.")
        suggested_fixes.append("Choose a stable server identifier before launch.")

    if not tool_names:
        blockers.append("At least one tool is required.")
        suggested_fixes.append("Define a narrow public tool surface before launch.")

    if len(tool_names) != len(tool_descriptions):
        blockers.append("Tool names and descriptions must have matching counts.")
        suggested_fixes.append("Provide one clear description for each public tool.")

    if endpoint_url:
        if endpoint_url.startswith("https://"):
            strengths.append("Public HTTPS endpoint is already present.")
        else:
            blockers.append("Endpoint must use HTTPS for public launch.")
            suggested_fixes.append("Deploy behind a stable HTTPS URL before submission.")
    else:
        blockers.append("Public endpoint URL is missing.")
        suggested_fixes.append("Deploy to a stable public HTTPS endpoint.")

    if 1 <= len(tool_names) <= 3:
        strengths.append("Tool surface is narrow enough for a first launch.")
    elif len(tool_names) > 3:
        warnings.append("Tool surface may be too broad for a first marketplace listing.")
        suggested_fixes.append("Reduce the public tool surface to the minimum useful set.")

    if any(len(description.strip()) < 32 for description in tool_descriptions):
        warnings.append("One or more tool descriptions are too short to be self-explanatory.")
        suggested_fixes.append("Expand each tool description so the value is legible without external context.")
    else:
        strengths.append("Tool descriptions are substantial enough to explain value.")

    combined_docs = f"{readme_text}\n{listing_draft}".lower()
    if not combined_docs.strip():
        blockers.append("Launch documentation is missing.")
        suggested_fixes.append("Provide README or listing draft text before launch review.")
    else:
        strengths.append("Some launch-facing documentation exists.")
        if "example" not in combined_docs and "prompt" not in combined_docs:
            warnings.append("Documentation does not appear to include example prompts.")
            suggested_fixes.append("Add example prompts that show first-run value quickly.")
        if "limit" not in combined_docs:
            warnings.append("Documentation does not appear to set explicit limits.")
            suggested_fixes.append("Add a limits section so the product does not over-promise.")
        if "target user" not in combined_docs and "for " not in combined_docs:
            warnings.append("Target user is not obvious from the launch-facing copy.")
            suggested_fixes.append("Name the primary user clearly in the short or long description.")

    score = max(0, 100 - 25 * len(blockers) - 8 * len(warnings))
    return LaunchReadinessResult(
        readiness_score=score,
        blockers=_dedupe(blockers),
        warnings=_dedupe(warnings),
        strengths=_dedupe(strengths),
        suggested_fixes=_dedupe(suggested_fixes),
    )


def draft_launch_package(
    *,
    server_name: str,
    target_user: str,
    tool_names: list[str],
    tool_descriptions: list[str],
    positioning_hints: list[str] | None = None,
    constraints: list[str] | None = None,
) -> LaunchPackageDraft:
    """Draft the minimum launch package for a narrow MCP utility."""

    hints = positioning_hints or []
    explicit_constraints = constraints or []
    tool_summary = ", ".join(tool_names[:2]) if tool_names else "a narrow toolset"
    user = target_user.strip() or "technical builders"
    short_description = (
        f"Audit launch readiness and draft a marketplace package for {user}."
    )
    long_description = (
        f"{server_name} helps {user} review whether an MCP server is ready for a public launch. "
        f"It focuses on {tool_summary} and turns existing server details into a clearer submission package."
    )
    if hints:
        long_description += f" Positioning hints: {'; '.join(hints[:3])}."

    example_prompts = [
        f'Audit whether "{server_name}" is ready for a first marketplace launch.',
        f'Draft a launch package for "{server_name}" aimed at {user}.',
        "Tell me what is missing before I submit this MCP server publicly.",
    ]
    explicit_limits = [
        "Best for narrow builder-facing MCP servers, not broad product strategy.",
        "Depends on the quality of the provided tool descriptions and docs.",
        "Does not automate marketplace submission or pricing decisions.",
    ]
    if explicit_constraints:
        explicit_limits.extend(explicit_constraints[:2])

    pricing_questions = [
        "What is the smallest pricing unit that still reflects meaningful builder value?",
        "Should the first launch optimize for low-friction trial or immediate margin?",
        "What usage pattern best predicts retained value after install?",
    ]

    return LaunchPackageDraft(
        short_description=short_description,
        long_description=long_description,
        example_prompts=example_prompts,
        explicit_limits=_dedupe(explicit_limits),
        pricing_questions=pricing_questions,
    )


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        normalized = value.strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        ordered.append(normalized)
    return ordered
