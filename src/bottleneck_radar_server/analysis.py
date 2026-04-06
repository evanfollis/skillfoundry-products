"""Core deterministic analysis for Bottleneck Radar."""

from __future__ import annotations

import html
from html.parser import HTMLParser
import math
import re
from urllib.parse import urlparse

import httpx

from .models import AnalyzeSignalsResult, BottleneckCluster, SignalSource, SourceKind, DraftBriefResult


PAIN_KEYWORDS = {
    "signal-opportunity-synthesis": {
        "title": "Signal-to-opportunity synthesis",
        "keywords": {
            "signal", "signals", "opportunity", "prioritize", "ranking", "ranked",
            "what to build", "build next", "which to build", "idea", "ideas",
            "bottleneck", "pain point", "pain points", "high-signal",
        },
        "why_now": "Builders have more raw market data than synthesis capacity, so prioritization quality is becoming a bottleneck.",
        "next_question": "Which repeated signal appears across the highest-trust sources and can be solved by one narrow tool?"
    },
    "docs-tool-surface": {
        "title": "Docs-to-tool-surface design",
        "keywords": {
            "api", "docs", "documentation", "openapi", "swagger", "endpoint", "schema",
            "tool surface", "mcp server", "tool descriptions", "oauth", "scopes",
        },
        "why_now": "MCP adoption is increasing faster than developers can turn third-party APIs into clean, shippable tool surfaces.",
        "next_question": "What is the smallest reliable tool surface that captures the value of this API?"
    },
    "packaging-launch": {
        "title": "Marketplace packaging and launch prep",
        "keywords": {
            "launch", "listing", "marketplace", "pricing", "positioning", "publish",
            "install", "readme", "onboarding", "distribution",
        },
        "why_now": "Many builders can ship working tools but stall on the packaging and positioning needed for public adoption.",
        "next_question": "What listing copy and example prompts would make the tool legible in under one minute?"
    },
    "auth-security": {
        "title": "OAuth, scopes, and secure public access",
        "keywords": {
            "auth", "oauth", "scope", "scopes", "secret", "permission", "permissions",
            "security", "unauthorized", "token",
        },
        "why_now": "Hosted MCP servers increasingly need production-grade auth and permission discipline, not local-only assumptions.",
        "next_question": "Which permissions are truly required for the first useful version?"
    },
    "post-launch-interpretation": {
        "title": "Post-launch usage interpretation",
        "keywords": {
            "revenue", "retention", "analytics", "usage", "activation", "churn",
            "dashboard", "metrics", "installs", "monetize",
        },
        "why_now": "As more MCP utilities launch, creators need faster ways to tell real value from vanity installs.",
        "next_question": "What user behavior is the earliest reliable proxy for retained value?"
    },
}

SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+|\n+")
TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"\s+")


class _TextExtractor(HTMLParser):
    """Minimal HTML-to-text extractor."""

    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:  # type: ignore[override]
        if tag in {"script", "style", "noscript"}:
            self._skip_depth += 1

    def handle_endtag(self, tag: str) -> None:  # type: ignore[override]
        if tag in {"script", "style", "noscript"} and self._skip_depth:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:  # type: ignore[override]
        if not self._skip_depth:
            normalized = WHITESPACE_RE.sub(" ", data).strip()
            if normalized:
                self.parts.append(normalized)


def analyze_sources(sources: list[SignalSource], target_user: str = "", max_clusters: int = 5) -> AnalyzeSignalsResult:
    """Analyze noisy signals into ranked bottleneck clusters."""

    evidence_by_cluster: dict[str, list[str]] = {cluster_id: [] for cluster_id in PAIN_KEYWORDS}
    fallback_evidence: list[str] = []
    for source in sources:
        text = _load_source_text(source)
        for sentence in _candidate_sentences(text):
            cluster_id = _match_cluster(sentence)
            if cluster_id is None:
                fallback_evidence.append(sentence)
                continue
            evidence_by_cluster[cluster_id].append(sentence)

    ranked_clusters: list[BottleneckCluster] = []
    for cluster_id, definition in PAIN_KEYWORDS.items():
        evidence = _dedupe(evidence_by_cluster[cluster_id])[:4]
        if not evidence:
            continue
        confidence = min(0.95, 0.35 + math.log(len(evidence) + 1, 4))
        ranked_clusters.append(
            BottleneckCluster(
                cluster_id=cluster_id,
                title=definition["title"],
                pain_summary=_summarize_evidence(definition["title"], evidence),
                evidence_snippets=evidence,
                confidence=round(confidence, 2),
                why_now=definition["why_now"],
                suggested_next_question=definition["next_question"],
            )
        )

    if not ranked_clusters and fallback_evidence:
        evidence = _dedupe(fallback_evidence)[:4]
        ranked_clusters.append(
            BottleneckCluster(
                cluster_id="emerging-pattern",
                title="Emerging pattern from supplied signals",
                pain_summary=_summarize_evidence("emerging pattern", evidence),
                evidence_snippets=evidence,
                confidence=0.32,
                why_now="The supplied signals show repeated friction, but they do not yet map cleanly onto a known launch category.",
                suggested_next_question="What recurring pain appears most often once you remove generic complaints and feature requests?"
            )
        )

    ranked_clusters.sort(key=lambda cluster: (-cluster.confidence, -len(cluster.evidence_snippets), cluster.title))
    return AnalyzeSignalsResult(target_user=target_user or "technical builders", clusters=ranked_clusters[:max_clusters])


def draft_brief_from_cluster(
    *,
    cluster_title: str,
    pain_summary: str,
    evidence_snippets: list[str],
    target_user: str,
    distribution_surface: str = "AgenticMarket",
) -> DraftBriefResult:
    """Turn one selected bottleneck cluster into a concise product brief."""

    base_slug = re.sub(r"[^a-z0-9]+", "-", cluster_title.lower()).strip("-")
    product_name = "-".join(part for part in [base_slug, "radar"] if part)
    narrow_solution = (
        f"Provide one hosted MCP workflow that helps {target_user} move from raw signals to a prioritized, evidence-backed next action "
        f"without requiring custom analysis setup."
    )
    return DraftBriefResult(
        product_name=product_name or "bottleneck-radar",
        target_user=target_user or "technical builders",
        problem_statement=pain_summary,
        narrow_solution=narrow_solution,
        tool_surface=["analyze_signals", "draft_brief"],
        deployment_constraints=[
            "Hosted HTTPS MCP endpoint",
            "Stable tools/list output",
            f"Listing-ready README-quality description for {distribution_surface}",
        ],
        pricing_hypothesis="Start with a low-friction per-call price that matches the clarity and leverage of one successful analysis run.",
        open_questions=[
            "Which input source types produce the strongest results for the first users?",
            "How much evidence is enough before a cluster feels trustworthy?",
            f"What is the lowest credible price for early {distribution_surface} installs without signaling low value?",
        ],
    )


def _load_source_text(source: SignalSource) -> str:
    if source.kind is SourceKind.TEXT:
        return source.value
    return _fetch_url_text(source.value)


def _fetch_url_text(url: str) -> str:
    response = httpx.get(url, timeout=8.0, follow_redirects=True)
    response.raise_for_status()
    content_type = response.headers.get("content-type", "")
    body = response.text[:15000]
    if "html" in content_type:
        extractor = _TextExtractor()
        extractor.feed(body)
        text = " ".join(extractor.parts)
    else:
        text = TAG_RE.sub(" ", body)
    parsed = urlparse(url)
    prefix = parsed.netloc.replace("www.", "")
    return f"{prefix} {html.unescape(WHITESPACE_RE.sub(' ', text)).strip()}"


def _candidate_sentences(text: str) -> list[str]:
    sentences = []
    for sentence in SENTENCE_SPLIT_RE.split(text):
        normalized = WHITESPACE_RE.sub(" ", sentence).strip(" -\t\r\n")
        if len(normalized) < 35:
            continue
        lowered = normalized.lower()
        if any(keyword in lowered for keywords in (definition["keywords"] for definition in PAIN_KEYWORDS.values()) for keyword in keywords):
            sentences.append(normalized)
    if sentences:
        return sentences
    return [WHITESPACE_RE.sub(" ", part).strip() for part in text.splitlines() if len(part.strip()) >= 35][:12]


def _match_cluster(sentence: str) -> str | None:
    lowered = sentence.lower()
    scores: list[tuple[int, str]] = []
    for cluster_id, definition in PAIN_KEYWORDS.items():
        score = sum(1 for keyword in definition["keywords"] if keyword in lowered)
        if score:
            scores.append((score, cluster_id))
    if not scores:
        return None
    scores.sort(reverse=True)
    return scores[0][1]


def _summarize_evidence(title: str, evidence: list[str]) -> str:
    top_evidence = evidence[:2]
    joined = " ".join(top_evidence)
    return f"{title} appears repeatedly across the supplied signals. Representative evidence: {joined}"


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        ordered.append(value)
    return ordered
