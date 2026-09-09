"""Gemini / Vertex graph refinement for evidence-backed entity & relationship verification.

Runs after hybrid regex/spaCy extraction. Priority: dated timeline events and
evidence-grounded relationships that can be synced to Neo4j.
"""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from typing import Any

from apps.backend.app.core.config import settings

logger = logging.getLogger(__name__)

ALLOWED_ENTITY_TYPES = {
    "PERSON",
    "ORGANIZATION",
    "PHONE_NUMBER",
    "ACCOUNT",
    "VEHICLE",
    "LOCATION",
    "MONEY",
    "DATE",
}

ALLOWED_REL_TYPES = {
    "COMMUNICATED_WITH",
    "TRANSFERRED",
    "OWNS_ACCOUNT",
    "DIRECTOR_OF",
    "EMPLOYED_BY",
    "DRIVES",
    "RESIDES_AT",
    "ASSOCIATED_WITH",
    "LOCATED_AT",
    "OWNS",
    "CALLED",
}


@dataclass
class RefinedEntity:
    value: str
    entity_type: str
    confidence: float
    source_snippet: str = ""
    keep: bool = True


@dataclass
class RefinedRelationship:
    source_value: str
    target_value: str
    relation_type: str
    confidence: float
    source_snippet: str = ""
    event_timestamp: str | None = None  # ISO-8601 preferred


@dataclass
class RefinedTimelineEvent:
    timestamp: str
    title: str
    description: str
    category: str
    primary_entity: str | None = None
    secondary_entity: str | None = None
    confidence: float = 0.8


@dataclass
class GeminiRefineResult:
    entities: list[RefinedEntity] = field(default_factory=list)
    relationships: list[RefinedRelationship] = field(default_factory=list)
    timeline_events: list[RefinedTimelineEvent] = field(default_factory=list)
    provider: str = "gemini"
    model: str = ""
    raw_error: str | None = None


def _strip_json_fence(text: str) -> str:
    t = (text or "").strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.IGNORECASE)
        t = re.sub(r"\s*```$", "", t)
    return t.strip()


def _clamp_conf(v: Any, default: float = 0.8) -> float:
    try:
        f = float(v)
    except (TypeError, ValueError):
        return default
    return max(0.0, min(1.0, f))


class GeminiGraphRefiner:
    """Verify hybrid NLP candidates against document text using Gemini."""

    def __init__(self) -> None:
        self.api_key = settings.VERTEX_API_KEY
        self.model = settings.GEMINI_MODEL
        self.enabled = bool(
            settings.GEMINI_GRAPH_REFINEMENT_ENABLED and self.api_key
        )

    def refine(
        self,
        document_text: str,
        seed_entities: list[dict[str, Any]],
        seed_relationships: list[dict[str, Any]],
    ) -> GeminiRefineResult:
        if not self.enabled:
            return GeminiRefineResult(
                raw_error="Gemini refinement disabled or VERTEX_API_KEY missing",
                model=self.model,
            )

        text = (document_text or "").strip()
        if not text:
            return GeminiRefineResult(raw_error="Empty document text", model=self.model)

        # Cap prompt size for free-tier / latency
        text_excerpt = text[:48000]
        seed_ents = seed_entities[:120]
        seed_rels = seed_relationships[:80]

        prompt = self._build_prompt(text_excerpt, seed_ents, seed_rels)

        try:
            from google import genai
            from google.genai import types

            # Exact Vertex enterprise client pattern (google-genai)
            client = genai.Client(enterprise=True, api_key=self.api_key)
            response = client.models.generate_content(
                model=self.model,
                contents=[
                    prompt,
                    types.Part.from_text(text=text_excerpt),
                ],
            )
            raw_text = getattr(response, "text", None) or ""
            # #region agent log
            try:
                import json as _json, time as _time
                from pathlib import Path as _Path
                _root = _Path(__file__).resolve()
                while _root.parent != _root and not (_root / "apps").is_dir():
                    _root = _root.parent
                for _log_path in (_root / ".cursor" / "debug-e250be.log", _root / "debug-e250be.log"):
                    _log_path.parent.mkdir(parents=True, exist_ok=True)
                    with _log_path.open("a", encoding="utf-8") as _lf:
                        _lf.write(_json.dumps({
                            "sessionId": "e250be",
                            "runId": "pre-fix",
                            "hypothesisId": "G2",
                            "location": "gemini_refiner.py:refine",
                            "message": "gemini generate_content returned",
                            "data": {
                                "model": self.model,
                                "enterprise": True,
                                "uses_types_part": True,
                                "raw_len": len(raw_text or ""),
                                "raw_preview": (raw_text or "")[:180],
                            },
                            "timestamp": int(_time.time() * 1000),
                        }) + "\n")
            except Exception:
                pass
            # #endregion
            return self._parse_response(raw_text)
        except Exception as exc:
            logger.warning("Gemini refinement failed: %s", type(exc).__name__)
            # #region agent log
            try:
                import json as _json, time as _time
                from pathlib import Path as _Path
                _root = _Path(__file__).resolve()
                while _root.parent != _root and not (_root / "apps").is_dir():
                    _root = _root.parent
                for _log_path in (_root / ".cursor" / "debug-e250be.log", _root / "debug-e250be.log"):
                    _log_path.parent.mkdir(parents=True, exist_ok=True)
                    with _log_path.open("a", encoding="utf-8") as _lf:
                        _lf.write(_json.dumps({
                            "sessionId": "e250be",
                            "runId": "pre-fix",
                            "hypothesisId": "G2",
                            "location": "gemini_refiner.py:refine",
                            "message": "gemini generate_content failed",
                            "data": {
                                "model": self.model,
                                "enterprise": True,
                                "uses_types_part": True,
                                "error_type": type(exc).__name__,
                                "error": str(exc)[:400],
                            },
                            "timestamp": int(_time.time() * 1000),
                        }) + "\n")
            except Exception:
                pass
            # #endregion
            return GeminiRefineResult(
                raw_error=f"{type(exc).__name__}: {exc}",
                model=self.model,
            )

    def _build_prompt(
        self,
        text: str,
        seed_entities: list[dict[str, Any]],
        seed_relationships: list[dict[str, Any]],
    ) -> str:
        return f"""You are an investigative graph analyst for a SYNTHETIC demo case file.
Task: verify and correct entity extraction, establish evidence-backed relationships, and extract a chronological timeline.

Rules:
- Use ONLY facts supported by the attached document text Part. Do not invent people or numbers.
- Prefer precise entity types: PERSON, ORGANIZATION, PHONE_NUMBER, ACCOUNT, VEHICLE, LOCATION, MONEY, DATE.
- ACCOUNT values that look like ACCT-######## must be ACCOUNT (never PHONE_NUMBER).
- Reject non-entities (job titles alone, generic phrases like "Chief Judicial Magistrate" unless clearly a named person in context, section headers).
- Relationships must connect two entities that appear in the document; include a short source_snippet.
- PRIORITY: dated timeline events (calls, transfers, sightings, recovery). Use ISO timestamps when possible (e.g. 2026-06-07T10:52:00+05:30).
- relation_type must be one of: {sorted(ALLOWED_REL_TYPES)}.
- Return STRICT JSON only (no markdown) with this schema:
{{
  "entities": [{{"value":"","entity_type":"","confidence":0.0,"source_snippet":"","keep":true}}],
  "relationships": [{{"source_value":"","target_value":"","relation_type":"","confidence":0.0,"source_snippet":"","event_timestamp":null}}],
  "timeline_events": [{{"timestamp":"","title":"","description":"","category":"COMMUNICATION|FINANCIAL|MOVEMENT|ASSOCIATION","primary_entity":null,"secondary_entity":null,"confidence":0.0}}]
}}

Seed entities (may be wrong — correct them):
{json.dumps(seed_entities, ensure_ascii=False)[:8000]}

Seed relationships (may be incomplete — repair/add):
{json.dumps(seed_relationships, ensure_ascii=False)[:6000]}

The next content Part is the full evidence document text. Analyze it and return JSON only.
"""

    def _parse_response(self, raw_text: str) -> GeminiRefineResult:
        cleaned = _strip_json_fence(raw_text)
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            # Try to salvage first JSON object
            m = re.search(r"\{[\s\S]*\}", cleaned)
            if not m:
                return GeminiRefineResult(
                    raw_error="Gemini returned non-JSON",
                    model=self.model,
                )
            try:
                data = json.loads(m.group(0))
            except json.JSONDecodeError as exc:
                return GeminiRefineResult(
                    raw_error=f"JSON parse failed: {exc}",
                    model=self.model,
                )

        entities: list[RefinedEntity] = []
        for e in data.get("entities") or []:
            et = str(e.get("entity_type") or "").upper().strip()
            val = str(e.get("value") or "").strip()
            if not val or et not in ALLOWED_ENTITY_TYPES:
                continue
            if e.get("keep") is False:
                continue
            entities.append(
                RefinedEntity(
                    value=val,
                    entity_type=et,
                    confidence=_clamp_conf(e.get("confidence"), 0.82),
                    source_snippet=str(e.get("source_snippet") or "")[:500],
                    keep=True,
                )
            )

        relationships: list[RefinedRelationship] = []
        for r in data.get("relationships") or []:
            rt = str(r.get("relation_type") or "").upper().strip()
            src = str(r.get("source_value") or "").strip()
            tgt = str(r.get("target_value") or "").strip()
            if not src or not tgt or rt not in ALLOWED_REL_TYPES:
                continue
            ts = r.get("event_timestamp")
            relationships.append(
                RefinedRelationship(
                    source_value=src,
                    target_value=tgt,
                    relation_type=rt,
                    confidence=_clamp_conf(r.get("confidence"), 0.8),
                    source_snippet=str(r.get("source_snippet") or "")[:500],
                    event_timestamp=str(ts).strip() if ts else None,
                )
            )

        timeline: list[RefinedTimelineEvent] = []
        for t in data.get("timeline_events") or []:
            ts = str(t.get("timestamp") or "").strip()
            title = str(t.get("title") or "").strip()
            if not ts or not title:
                continue
            cat = str(t.get("category") or "ASSOCIATION").upper()
            if cat not in {"COMMUNICATION", "FINANCIAL", "MOVEMENT", "ASSOCIATION"}:
                cat = "ASSOCIATION"
            timeline.append(
                RefinedTimelineEvent(
                    timestamp=ts,
                    title=title,
                    description=str(t.get("description") or "")[:800],
                    category=cat,
                    primary_entity=(str(t.get("primary_entity")).strip() if t.get("primary_entity") else None),
                    secondary_entity=(str(t.get("secondary_entity")).strip() if t.get("secondary_entity") else None),
                    confidence=_clamp_conf(t.get("confidence"), 0.8),
                )
            )

        # Prefer timeline-dated edges when relationships lack timestamps
        by_pair = {(e.primary_entity or "", e.secondary_entity or ""): e.timestamp for e in timeline}
        for rel in relationships:
            if not rel.event_timestamp:
                rel.event_timestamp = (
                    by_pair.get((rel.source_value, rel.target_value))
                    or by_pair.get((rel.target_value, rel.source_value))
                )

        return GeminiRefineResult(
            entities=entities,
            relationships=relationships,
            timeline_events=timeline,
            provider="gemini",
            model=self.model,
        )
