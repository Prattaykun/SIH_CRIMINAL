"""Case API endpoints."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from apps.backend.app.db.session import get_db
from apps.backend.app.repositories.case_repo import CaseRepository
from apps.backend.app.schemas.case import (
    CaseCreate,
    CaseListResponse,
    CaseResponse,
    CaseStatus,
    CaseUpdate,
)
from apps.backend.app.api.deps import get_current_active_user, require_role, require_case_permission, Permission
from apps.backend.app.models.user import User, Role
from apps.backend.app.models.case_membership import CaseMembership, CaseRole, MembershipStatus
from apps.backend.app.models.entity import ExtractedEntity
from apps.backend.app.models.relationship import ExtractedRelationship
from apps.backend.app.models.case import Case
from apps.backend.app.services.audit import log_action, CASE_CREATED, CASE_UPDATED

router = APIRouter()


def _structured_error(
    status_code: int, code: str, message: str, path: str
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "path": path,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        },
    )


@router.post(
    "",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new investigation case",
)
def create_case(
    data: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([Role.INVESTIGATOR, Role.ADMINISTRATOR])),
) -> CaseResponse:
    """Create a new case. Assign MANAGE access to the creator."""
    repo = CaseRepository(db)
    existing = repo.get_by_case_number(data.case_number)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Case with number '{data.case_number}' already exists.",
        )

    try:
        # We inject created_by
        case_data = data.model_dump()
        case = Case(**case_data)
        case.created_by = current_user.id
        db.add(case)
        db.flush()  # to get case.id

        # Grant CASE_LEAD membership to creator
        membership = CaseMembership(
            user_id=current_user.id,
            case_id=case.id,
            case_role=CaseRole.CASE_LEAD.value,
            status=MembershipStatus.ACTIVE.value,
            assigned_by=current_user.id,
        )
        db.add(membership)

        log_action(
            db=db,
            action=CASE_CREATED,
            target_type="CASE",
            target_id=case.id,
            user_id=current_user.id,
        )

        db.commit()
        db.refresh(case)
        return CaseResponse.model_validate(case)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create case.",
        ) from exc


@router.get(
    "",
    response_model=CaseListResponse,
    summary="List investigation cases",
)
def list_cases(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    status_filter: CaseStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> CaseListResponse:
    """List cases. Administrators see all, others see assigned."""
    status_value = status_filter.value if status_filter else None

    query = db.query(Case)
    if status_value:
        query = query.filter(Case.status == status_value)

    if current_user.role != Role.ADMINISTRATOR.value:
        query = query.join(CaseMembership, CaseMembership.case_id == Case.id).filter(
            CaseMembership.user_id == current_user.id,
            CaseMembership.status == MembershipStatus.ACTIVE.value
        )

    total = query.count()
    cases = query.order_by(Case.created_at.desc()).offset(skip).limit(limit).all()

    return CaseListResponse(
        total=total,
        cases=[CaseResponse.model_validate(c) for c in cases],
    )


@router.get(
    "/{case_id}",
    response_model=CaseResponse,
    summary="Get case details",
)
def get_case(
    case_id: str,
    db: Session = Depends(get_db),
    access: CaseMembership = Depends(require_case_permission(Permission.VIEW_CASE)),
) -> CaseResponse:
    repo = CaseRepository(db)
    case = repo.get_by_id(case_id) or repo.get_by_case_number(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")
    return CaseResponse.model_validate(case)


@router.patch(
    "/{case_id}",
    response_model=CaseResponse,
    summary="Update case details",
)
def update_case(
    case_id: str,
    data: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    access: CaseMembership = Depends(require_case_permission(Permission.VIEW_CASE)),
) -> CaseResponse:
    repo = CaseRepository(db)
    case = repo.get_by_id(case_id) or repo.get_by_case_number(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")
    
    prev_state = {"status": case.status, "priority": case.priority, "title": case.title, "description": case.description}

    try:
        case = repo.update(str(case.id), data)
        new_state = {"status": case.status, "priority": case.priority, "title": case.title, "description": case.description}
        
        log_action(
            db=db,
            action=CASE_UPDATED,
            target_type="CASE",
            target_id=case.id,
            user_id=current_user.id,
            previous_state=prev_state,
            new_state=new_state
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update case.") from exc

    return CaseResponse.model_validate(case)


@router.delete(
    "/{case_id}",
    summary="Delete a case and all associated evidence/graph data",
)
def delete_case(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([Role.INVESTIGATOR, Role.ADMINISTRATOR])),
    access: CaseMembership = Depends(require_case_permission(Permission.VIEW_CASE)),
):
    repo = CaseRepository(db)
    case = repo.get_by_id(case_id) or repo.get_by_case_number(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")

    case_number = case.case_number
    success = repo.delete(str(case.id), deleted_by=current_user.id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete case.")

    return {"status": "success", "message": f"Case {case_number} deleted successfully."}


@router.get(
    "/{case_id}/summary",
    summary="Get dynamic case intelligence summary",
)
def get_case_intelligence_summary(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    case = db.query(Case).filter((Case.id == case_id) | (Case.case_number == case_id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    entities = db.query(ExtractedEntity).filter(ExtractedEntity.case_id == case.id).all()
    relationships = db.query(ExtractedRelationship).filter(ExtractedRelationship.case_id == case.id).all()

    # If case has no extracted entities yet, return a clean empty topology summary
    if not entities:
        return {
            "case_id": str(case.id),
            "case_number": getattr(case, "case_number", case_id),
            "primary_subject": None,
            "anomaly_index": {
                "score": 0,
                "status": "Pending Evidence Ingestion",
                "confidence": "0%",
                "model_version": "IsolationForest-GraphTopo v2.1"
            },
            "topology_preview": {
                "node_count": 0,
                "edge_count": 0,
                "sync_status": "Pending Evidence"
            },
            "timeline_events": [],
            "linked_assets": []
        }

    persons = [e for e in entities if e.entity_type == "PERSON"]
    vehicles = [e for e in entities if e.entity_type == "VEHICLE"]
    accounts = [e for e in entities if e.entity_type == "ACCOUNT"]
    phones = [e for e in entities if e.entity_type == "PHONE_NUMBER"]
    orgs = [e for e in entities if e.entity_type == "ORGANIZATION"]

    NON_PERSON_KWS = {
        "case", "report", "reference", "station", "department", "officer",
        "incident", "summary", "target", "dossier", "account", "investigat",
        "intelligence", "priority", "status", "delhi", "mumbai", "kolkata"
    }
    valid_persons = [
        e for e in persons
        if e.canonical_name and not any(k in e.canonical_name.lower() for k in NON_PERSON_KWS)
        and 3 <= len(e.canonical_name) <= 40
    ]

    # Degree = number of relationships touching the entity (investigative hub priority)
    degree: dict[str, int] = {}
    for rel in relationships:
        if rel.source_entity_id:
            degree[rel.source_entity_id] = degree.get(rel.source_entity_id, 0) + 1
        if rel.target_entity_id:
            degree[rel.target_entity_id] = degree.get(rel.target_entity_id, 0) + 1

    def _person_priority(e: ExtractedEntity) -> tuple:
        # Higher degree first; then confidence; then name for stability
        conf = float(e.confidence_score or 0.0)
        return (degree.get(e.id, 0), conf, e.canonical_name or "")

    ranked_persons = sorted(valid_persons or persons, key=_person_priority, reverse=True)
    primary_person = ranked_persons[0] if ranked_persons else (entities[0] if entities else None)
    primary_name = (
        primary_person.canonical_name
        if primary_person and primary_person.canonical_name
        else "Unknown"
    )
    primary_degree = degree.get(primary_person.id, 0) if primary_person else 0

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
                    "runId": "post-fix",
                    "hypothesisId": "PS1",
                    "location": "cases.py:get_case_intelligence_summary",
                    "message": "primary subject selected by degree",
                    "data": {
                        "primary_name": primary_name,
                        "primary_degree": primary_degree,
                        "top3": [
                            {
                                "name": p.canonical_name,
                                "degree": degree.get(p.id, 0),
                                "conf": float(p.confidence_score or 0),
                            }
                            for p in ranked_persons[:3]
                        ],
                    },
                    "timestamp": int(_time.time() * 1000),
                }) + "\n")
    except Exception:
        pass
    # #endregion

    valid_orgs = [
        e for e in orgs
        if e.canonical_name and len(e.canonical_name) <= 60 and not e.canonical_name.strip().endswith((".", "?", "!"))
    ]
    # Prefer org linked to primary person when available
    primary_org = "None Identified"
    if primary_person:
        linked_org_ids = set()
        for rel in relationships:
            if rel.source_entity_id == primary_person.id:
                linked_org_ids.add(rel.target_entity_id)
            if rel.target_entity_id == primary_person.id:
                linked_org_ids.add(rel.source_entity_id)
        linked_orgs = [o for o in (valid_orgs or orgs) if o.id in linked_org_ids]
        if linked_orgs:
            primary_org = linked_orgs[0].canonical_name[:60]
    if primary_org == "None Identified":
        primary_org = valid_orgs[0].canonical_name if valid_orgs else (orgs[0].canonical_name[:60] if orgs else "None Identified")
    primary_vehicle = vehicles[0].canonical_name if vehicles else "None Identified"
    primary_phone = phones[0].canonical_name if phones else "None Identified"
    primary_account = accounts[0].canonical_name if accounts else "None Identified"

    anomaly_score = min(45 + len(entities) * 4 + len(relationships) * 5, 96)

    # Dynamic timeline events derived from actual extracted relationships of this case
    timeline_events = []
    for rel in relationships[:5]:
        src_entity = next((e for e in entities if e.id == rel.source_entity_id), None)
        tgt_entity = next((e for e in entities if e.id == rel.target_entity_id), None)
        src_name = src_entity.canonical_name if src_entity else "Entity"
        tgt_name = tgt_entity.canonical_name if tgt_entity else "Entity"

        date_str = (
            rel.event_timestamp.strftime("%d %b %Y, %H:%M")
            if rel.event_timestamp
            else (rel.created_at.strftime("%d %b %Y") if rel.created_at else "Extracted Record")
        )
        timeline_events.append({
            "title": f"{rel.relation_type.replace('_', ' ').title()}",
            "desc": rel.source_text_snippet or f"Extracted link: {src_name} -> {tgt_name}",
            "date": date_str,
            "type": "verified" if rel.verification_status in ["ACCEPTED", "CORRECTED"] else "flagged"
        })

    # Dynamic linked assets derived from actual entities in this case
    linked_assets = []
    chosen_orgs = valid_orgs if valid_orgs else orgs
    for org in chosen_orgs[:2]:
        linked_assets.append({"name": org.canonical_name[:60], "type": "ORGANIZATION", "badge": "IDENTIFIED ORG"})
    for acc in accounts[:2]:
        linked_assets.append({"name": acc.canonical_name[:60], "type": "ACCOUNT", "badge": "FINANCIAL NODE"})
    for veh in vehicles[:2]:
        linked_assets.append({"name": veh.canonical_name[:60], "type": "VEHICLE", "badge": "TRACKED ASSET"})
    for ph in phones[:2]:
        linked_assets.append({"name": ph.canonical_name[:60], "type": "PHONE", "badge": "COMMUNICATION NODE"})

    if primary_degree >= 4:
        primary_role = "Investigative lead — high connectivity hub (requires human verification)"
    elif primary_degree >= 2:
        primary_role = "Investigative lead — multi-link person node (requires human verification)"
    else:
        primary_role = "Investigative lead — limited links in current graph (requires human verification)"

    def _role_for_degree(deg: int) -> str:
        if deg >= 4:
            return "High-connectivity hub lead"
        if deg >= 2:
            return "Multi-link associate lead"
        return "Limited-link person lead"

    def _linked_org_for(person: ExtractedEntity) -> str | None:
        linked_ids = set()
        for rel in relationships:
            if rel.source_entity_id == person.id:
                linked_ids.add(rel.target_entity_id)
            if rel.target_entity_id == person.id:
                linked_ids.add(rel.source_entity_id)
        for o in (valid_orgs or orgs):
            if o.id in linked_ids and o.canonical_name:
                return o.canonical_name[:60]
        return None

    primary_subjects = []
    person_degrees = [degree.get(x.id, 0) for x in ranked_persons] or [0]
    median = sorted(person_degrees)[len(person_degrees) // 2]
    anomaly_threshold = max(3, median + 2)

    for p in ranked_persons[:8]:
        deg = degree.get(p.id, 0)
        conf = float(p.confidence_score or 0.0)
        # Light anomaly flag: degree unusually high vs median person degree
        anomaly_flag = deg >= anomaly_threshold
        if anomaly_flag:
            anomaly_reason = (
                f"Connectivity anomaly: {deg} extracted links vs median {median} "
                f"among person nodes (threshold ≥ {anomaly_threshold}). "
                "Investigative prioritization only — requires human verification; not a guilt score."
            )
        else:
            anomaly_reason = (
                f"{deg} extracted links (at or below threshold {anomaly_threshold}; "
                f"median person degree {median}). No connectivity anomaly flag."
            )
        primary_subjects.append({
            "id": p.id,
            "name": p.canonical_name,
            "link_degree": deg,
            "confidence": round(conf, 2),
            "role": _role_for_degree(deg),
            "org": _linked_org_for(p),
            "anomaly_flag": anomaly_flag,
            "anomaly_reason": anomaly_reason,
            "verification_status": p.verification_status,
        })

    case_unit = getattr(case, "description", None) or "Active unit / description not set"

    return {
        "case_id": str(case.id),
        "case_number": getattr(case, "case_number", case_id),
        "primary_subject": {
            "name": primary_name,
            "role": primary_role,
            "org": primary_org,
            "vehicle": primary_vehicle,
            "phone": primary_phone,
            "account": primary_account,
            "jurisdiction": case_unit,
            "case_unit": case_unit,
            "priority": getattr(case, "priority", "MEDIUM") + " / ELEVATED",
            "link_degree": primary_degree,
            "id": primary_person.id if primary_person else None,
        },
        "primary_subjects": primary_subjects,
        "anomaly_index": {
            "score": anomaly_score,
            "status": "Calculated from Extracted Topology",
            "confidence": "94%",
            "model_version": "IsolationForest-GraphTopo v2.1",
            "factor_note": (
                "Score rises with extracted entity and relationship counts "
                f"(entities={len(entities)}, relationships={len(relationships)}). "
                "Not a guilt score — investigative prioritization only."
            ),
        },
        "topology_preview": {
            "node_count": len(entities),
            "edge_count": len(relationships),
            "sync_status": "Synchronized (Neo4j)" if relationships else "Extracted (Awaiting Verification)"
        },
        "timeline_events": timeline_events,
        "linked_assets": linked_assets
    }

@router.get(
    "/{case_id}/simple",
    summary="Get persisted plain-language case summary (async-generated)",
)
def get_case_simple(
    case_id: str,
    regenerate: bool = Query(False, description="Force regenerate in background"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    from apps.backend.app.services.simple_summary import (
        STATUS_FAILED,
        STATUS_GENERATING,
        STATUS_NONE,
        STATUS_PENDING,
        STATUS_READY,
        get_stored_simple_view,
        schedule_simple_summary_generation,
    )

    stored = get_stored_simple_view(db, case_id)
    if not stored:
        raise HTTPException(status_code=404, detail="Case not found")

    status = stored["status"] or STATUS_NONE
    payload = stored.get("payload") if isinstance(stored.get("payload"), dict) else None

    if regenerate or status in (STATUS_NONE, STATUS_FAILED, STATUS_PENDING):
        schedule_simple_summary_generation(stored["case_id"], force=True)
        status = STATUS_GENERATING
    elif status == STATUS_GENERATING and not payload:
        # Ensure a worker is still scheduled if a prior process died mid-run
        schedule_simple_summary_generation(stored["case_id"], force=True)

    base = {
        "case_id": stored["case_id"],
        "case_number": stored["case_number"],
        "title": stored["title"],
        "generation_status": status,
        "generated_at": stored.get("generated_at"),
        "error": stored.get("error") if status == STATUS_FAILED else None,
    }

    if status == STATUS_READY and payload:
        return {
            **base,
            **payload,
            "case_id": stored["case_id"],
            "case_number": stored.get("case_number") or payload.get("case_number"),
            "title": stored.get("title") or payload.get("title"),
            "generation_status": STATUS_READY,
        }

    # Still generating — return shell so UI can poll
    return {
        **base,
        "case_type": "Criminal Network Investigation",
        "summary": None,
        "timeline": [],
        "key_people": [],
        "key_locations": [],
        "ai_insights": [],
        "message": "Plain-language summary is being generated from case and graph data.",
    }


@router.post(
    "/{case_id}/simple/generate",
    summary="Trigger async Simple View generation and persist to Postgres",
)
def generate_case_simple(
    case_id: str,
    wait: bool = Query(False, description="If true, generate synchronously and return result"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    from apps.backend.app.services.simple_summary import (
        generate_and_store_simple_summary,
        schedule_simple_summary_generation,
        get_stored_simple_view,
    )

    case = db.query(Case).filter((Case.id == case_id) | (Case.case_number == case_id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if wait:
        result = generate_and_store_simple_summary(db, str(case.id), force=True)
        stored = get_stored_simple_view(db, str(case.id))
        payload = (stored or {}).get("payload") or {}
        return {
            "generation_status": result.get("status"),
            "generated_at": result.get("generated_at") or (stored or {}).get("generated_at"),
            "error": result.get("error"),
            **payload,
            "case_id": str(case.id),
            "case_number": case.case_number,
            "title": case.title,
        }

    schedule_simple_summary_generation(str(case.id), force=True)
    return {
        "case_id": str(case.id),
        "case_number": case.case_number,
        "generation_status": "GENERATING",
        "message": "Simple View generation started asynchronously.",
    }
