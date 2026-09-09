"""Async plain-language Simple View generation for investigation cases.

Persists a Gemini (or rule-based fallback) summary on the Case row in Postgres.
Language is investigative-support only — never guilt prediction.
"""

from __future__ import annotations

import json
import logging
import re
import threading
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from apps.backend.app.core.config import settings
from apps.backend.app.db.session import SessionLocal

logger = logging.getLogger(__name__)

STATUS_NONE = "NONE"
STATUS_PENDING = "PENDING"
STATUS_GENERATING = "GENERATING"
STATUS_READY = "READY"
STATUS_FAILED = "FAILED"

_generating_lock = threading.Lock()
_generating_cases: set[str] = set()


def _strip_json_fence(text: str) -> str:
    t = (text or "").strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t, flags=re.IGNORECASE)
        t = re.sub(r"\s*```$", "", t)
    return t.strip()


def _classify_person_role(name: str, is_primary: bool) -> str:
    if re.search(r"magistrate|judge|court|justice", name, re.I):
        return "Judicial Authority"
    if re.search(r"inspector|officer|sub-inspector|sho|constable|dsp|sp|investigat", name, re.I):
        return "Investigating Officer / Official"
    if re.search(r"department|wing|offences|police|bureau|agency|authority", name, re.I):
        return "Law Enforcement / Agency"
    if is_primary:
        return "Primary Subject of Interest"
    return "Involved Person / Witness"


def _gather_case_graph_context(db: Session, case_id: str) -> dict[str, Any] | None:
    from apps.backend.app.models.case import Case
    from apps.backend.app.models.entity import ExtractedEntity
    from apps.backend.app.models.relationship import ExtractedRelationship

    case = (
        db.query(Case)
        .filter((Case.id == case_id) | (Case.case_number == case_id))
        .first()
    )
    if not case:
        return None

    entities = db.query(ExtractedEntity).filter(ExtractedEntity.case_id == case.id).all()
    relationships = (
        db.query(ExtractedRelationship).filter(ExtractedRelationship.case_id == case.id).all()
    )

    degree: dict[str, int] = {}
    for rel in relationships:
        if rel.source_entity_id:
            degree[rel.source_entity_id] = degree.get(rel.source_entity_id, 0) + 1
        if rel.target_entity_id:
            degree[rel.target_entity_id] = degree.get(rel.target_entity_id, 0) + 1

    persons = [
        e
        for e in entities
        if e.entity_type == "PERSON" and e.canonical_name and 3 <= len(e.canonical_name) <= 60
    ]
    persons_ranked = sorted(
        persons,
        key=lambda e: (degree.get(e.id, 0), float(e.confidence_score or 0)),
        reverse=True,
    )

    orgs = [
        e.canonical_name
        for e in entities
        if e.entity_type == "ORGANIZATION" and e.canonical_name
    ][:8]
    locations = [
        e.canonical_name
        for e in entities
        if e.entity_type in ("LOCATION", "ADDRESS")
        and e.canonical_name
        and len(e.canonical_name) <= 45
    ][:8]
    phones = [
        e.canonical_name
        for e in entities
        if e.entity_type == "PHONE_NUMBER" and e.canonical_name
    ][:6]
    accounts = [
        e.canonical_name
        for e in entities
        if e.entity_type == "ACCOUNT" and e.canonical_name
    ][:6]
    vehicles = [
        e.canonical_name
        for e in entities
        if e.entity_type == "VEHICLE" and e.canonical_name
    ][:6]

    id_to_name = {e.id: (e.canonical_name or e.original_value or "") for e in entities}
    timeline: list[dict[str, Any]] = []
    dated_rels = [r for r in relationships if r.event_timestamp]
    dated_rels.sort(key=lambda r: r.event_timestamp or datetime.min.replace(tzinfo=timezone.utc))
    for rel in dated_rels[:12]:
        src = id_to_name.get(rel.source_entity_id, "Entity")
        tgt = id_to_name.get(rel.target_entity_id, "Entity")
        date_str = rel.event_timestamp.strftime("%d %b %Y, %H:%M") if rel.event_timestamp else None
        desc = rel.source_text_snippet or f"{rel.relation_type.replace('_', ' ').title()}: {src} → {tgt}"
        timeline.append({"date": date_str, "description": desc[:400]})

    if not timeline:
        for rel in relationships[:8]:
            src = id_to_name.get(rel.source_entity_id, "Entity")
            tgt = id_to_name.get(rel.target_entity_id, "Entity")
            desc = rel.source_text_snippet or f"{rel.relation_type.replace('_', ' ').title()}: {src} → {tgt}"
            timeline.append({"date": None, "description": desc[:400]})

    people = []
    for i, p in enumerate(persons_ranked[:10]):
        people.append(
            {
                "name": p.canonical_name,
                "role": _classify_person_role(p.canonical_name or "", i == 0),
                "link_degree": degree.get(p.id, 0),
            }
        )

    return {
        "case": case,
        "entity_count": len(entities),
        "relationship_count": len(relationships),
        "people": people,
        "orgs": orgs,
        "locations": locations,
        "phones": phones,
        "accounts": accounts,
        "vehicles": vehicles,
        "timeline": timeline,
        "top_links": [
            {
                "source": id_to_name.get(r.source_entity_id, ""),
                "target": id_to_name.get(r.target_entity_id, ""),
                "type": r.relation_type,
            }
            for r in relationships[:20]
        ],
    }


def _rule_based_payload(ctx: dict[str, Any]) -> dict[str, Any]:
    case = ctx["case"]
    people = ctx["people"]
    primary = people[0]["name"] if people else "an unidentified person of interest"
    org = ctx["orgs"][0] if ctx["orgs"] else "linked organizations under review"
    desc = (case.description or "").strip()
    allegation = (
        f" Proceedings examine allegations regarding {desc.rstrip('.')}."
        if desc
        else ""
    )
    summary = (
        f"Case {case.case_number} ({case.title}) is an active investigative matter. "
        f"Extracted network data currently links {ctx['entity_count']} entities and "
        f"{ctx['relationship_count']} relationships. "
        f"Connectivity ranking currently highlights {primary} as a high-priority "
        f"investigative lead (requires human verification), with associations involving {org}."
        f"{allegation} "
        "This overview is investigation support only and is not a determination of guilt."
    )
    insights: list[str] = []
    if people:
        insights.append(
            f"{people[0]['name']} currently has the highest extracted link count "
            f"({people[0].get('link_degree', 0)}); treat as a lead for verification, not an accusation."
        )
    if len(people) > 1:
        insights.append(
            f"At least {len(people)} persons appear in extracted evidence; "
            "roles and relationships require human review."
        )
    if ctx["accounts"] or ctx["phones"]:
        insights.append(
            "Financial and/or communication nodes were extracted and should be cross-checked against source documents."
        )
    if ctx["timeline"]:
        insights.append(
            f"{len(ctx['timeline'])} timeline-linked events were derived from dated or sequenced evidence snippets."
        )
    if not insights:
        insights.append("Summary generated from case topology; await further evidence ingestion for richer narrative.")

    return {
        "case_id": str(case.id),
        "case_number": case.case_number,
        "title": case.title,
        "case_type": "Criminal Network Investigation",
        "summary": summary,
        "timeline": ctx["timeline"],
        "key_people": [{"name": p["name"], "role": p["role"]} for p in people],
        "key_locations": ctx["locations"][:5],
        "ai_insights": insights[:6],
        "generation_method": "rule_based",
        "disclaimer": "Investigative lead overview — requires human verification. Not a guilt prediction.",
    }


def _gemini_payload(ctx: dict[str, Any]) -> dict[str, Any] | None:
    if not settings.VERTEX_API_KEY:
        return None

    case = ctx["case"]
    briefing = {
        "case_number": case.case_number,
        "title": case.title,
        "description": case.description,
        "priority": case.priority,
        "status": case.status,
        "entity_count": ctx["entity_count"],
        "relationship_count": ctx["relationship_count"],
        "ranked_people": ctx["people"][:8],
        "organizations": ctx["orgs"],
        "locations": ctx["locations"],
        "phones": ctx["phones"],
        "accounts": ctx["accounts"],
        "vehicles": ctx["vehicles"],
        "sample_links": ctx["top_links"][:15],
        "timeline_snippets": ctx["timeline"][:10],
    }

    prompt = f"""You write plain-language investigative case overviews for law-enforcement analysts.
Use ONLY the JSON briefing below (synthetic demo data). Do not invent facts.
Rules:
- Never declare anyone guilty or "criminal". Use "investigative lead", "person of interest", "requires human verification".
- Be clear and concise for non-technical readers.
- Return ONLY valid JSON with keys:
  summary (string, 2-4 sentences),
  timeline (array of {{date: string|null, description: string}}, max 8),
  key_people (array of {{name, role}}, max 10),
  key_locations (array of strings, max 5),
  ai_insights (array of strings, max 6, observational only).

Briefing:
{json.dumps(briefing, ensure_ascii=False)[:20000]}
"""

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(enterprise=True, api_key=settings.VERTEX_API_KEY)
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[types.Part.from_text(text=prompt)],
        )
        raw_text = _strip_json_fence(getattr(response, "text", None) or "")
        parsed = json.loads(raw_text)
        if not isinstance(parsed, dict) or not parsed.get("summary"):
            return None
        return {
            "case_id": str(case.id),
            "case_number": case.case_number,
            "title": case.title,
            "case_type": "Criminal Network Investigation",
            "summary": str(parsed.get("summary", "")).strip(),
            "timeline": parsed.get("timeline") or ctx["timeline"],
            "key_people": parsed.get("key_people")
            or [{"name": p["name"], "role": p["role"]} for p in ctx["people"]],
            "key_locations": parsed.get("key_locations") or ctx["locations"][:5],
            "ai_insights": parsed.get("ai_insights") or [],
            "generation_method": "gemini",
            "disclaimer": "Investigative lead overview — requires human verification. Not a guilt prediction.",
        }
    except Exception as exc:
        logger.warning("Gemini simple-summary failed: %s", type(exc).__name__)
        return None


def generate_and_store_simple_summary(
    db: Session,
    case_id: str,
    *,
    force: bool = False,
) -> dict[str, Any]:
    """Generate Simple View payload and persist on the Case row."""
    from apps.backend.app.models.case import Case

    case = (
        db.query(Case)
        .filter((Case.id == case_id) | (Case.case_number == case_id))
        .first()
    )
    if not case:
        return {"status": STATUS_FAILED, "error": "Case not found"}

    real_id = str(case.id)
    if (
        not force
        and case.simple_summary_status == STATUS_READY
        and isinstance(case.simple_summary, dict)
        and case.simple_summary.get("summary")
    ):
        return {
            "status": STATUS_READY,
            "payload": case.simple_summary,
            "generated_at": case.simple_summary_generated_at.isoformat()
            if case.simple_summary_generated_at
            else None,
        }

    case.simple_summary_status = STATUS_GENERATING
    case.simple_summary_error = None
    db.commit()

    try:
        ctx = _gather_case_graph_context(db, real_id)
        if not ctx:
            raise ValueError("Case context unavailable")

        payload = _gemini_payload(ctx) or _rule_based_payload(ctx)
        case.simple_summary = payload
        case.simple_summary_status = STATUS_READY
        case.simple_summary_error = None
        case.simple_summary_generated_at = datetime.now(timezone.utc)
        db.commit()
        return {
            "status": STATUS_READY,
            "payload": payload,
            "generated_at": case.simple_summary_generated_at.isoformat(),
        }
    except Exception as exc:
        db.rollback()
        case = db.query(Case).filter(Case.id == real_id).first()
        if case:
            case.simple_summary_status = STATUS_FAILED
            case.simple_summary_error = str(exc)[:500]
            db.commit()
        logger.exception("Simple summary generation failed for case %s", real_id)
        return {"status": STATUS_FAILED, "error": str(exc)[:500]}


def schedule_simple_summary_generation(case_id: str, *, force: bool = True) -> None:
    """Fire-and-forget generation in a daemon thread with its own DB session."""
    cid = str(case_id)
    with _generating_lock:
        if cid in _generating_cases:
            return
        _generating_cases.add(cid)

    def _run() -> None:
        db = SessionLocal()
        try:
            generate_and_store_simple_summary(db, cid, force=force)
        except Exception:
            logger.exception("Background simple-summary thread failed for %s", cid)
        finally:
            db.close()
            with _generating_lock:
                _generating_cases.discard(cid)

    threading.Thread(target=_run, name=f"simple-summary-{cid[:8]}", daemon=True).start()


def get_stored_simple_view(db: Session, case_id: str) -> dict[str, Any] | None:
    from apps.backend.app.models.case import Case

    case = (
        db.query(Case)
        .filter((Case.id == case_id) | (Case.case_number == case_id))
        .first()
    )
    if not case:
        return None

    payload = case.simple_summary if isinstance(case.simple_summary, dict) else None
    return {
        "case_id": str(case.id),
        "case_number": case.case_number,
        "title": case.title,
        "status": case.simple_summary_status or STATUS_NONE,
        "error": case.simple_summary_error,
        "generated_at": case.simple_summary_generated_at.isoformat()
        if case.simple_summary_generated_at
        else None,
        "payload": payload,
    }
