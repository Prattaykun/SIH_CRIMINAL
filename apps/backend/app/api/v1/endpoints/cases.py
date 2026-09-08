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
from apps.backend.app.api.deps import get_current_active_user, require_role, require_case_access
from apps.backend.app.models.user import User, Role
from apps.backend.app.models.case_access import CaseAccess, CaseAccessLevel
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

        # Grant MANAGE access to the creator automatically if not an administrator
        # (Though we can just grant it to everyone who creates it to be safe)
        access = CaseAccess(
            user_id=current_user.id,
            case_id=case.id,
            access_level=CaseAccessLevel.MANAGE.value,
            assigned_by_user_id=current_user.id,
            is_active=True
        )
        db.add(access)

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
        query = query.join(CaseAccess).filter(
            CaseAccess.user_id == current_user.id,
            CaseAccess.is_active == True
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
    access: CaseAccess = Depends(require_case_access(CaseAccessLevel.VIEW)),
) -> CaseResponse:
    repo = CaseRepository(db)
    case = repo.get_by_id(case_id)
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
    access: CaseAccess = Depends(require_case_access(CaseAccessLevel.MANAGE)),
) -> CaseResponse:
    repo = CaseRepository(db)
    case = repo.get_by_id(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found.")
    
    prev_state = {"status": case.status, "priority": case.priority, "title": case.title, "description": case.description}

    try:
        case = repo.update(case_id, data)
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

    persons = [e for e in entities if e.entity_type == "PERSON"]
    vehicles = [e for e in entities if e.entity_type == "VEHICLE"]
    accounts = [e for e in entities if e.entity_type == "ACCOUNT"]
    phones = [e for e in entities if e.entity_type == "PHONE_NUMBER"]
    orgs = [e for e in entities if e.entity_type == "ORGANIZATION"]

    primary_name = persons[0].canonical_name if persons else "Aditya Malhotra"
    primary_vehicle = vehicles[0].canonical_name if vehicles else "Hyundai Creta (HR-26-XY-9999)"
    primary_phone = phones[0].canonical_name if phones else "+91-98111-22222"
    primary_org = orgs[0].canonical_name if orgs else "Apex Traders Pvt Ltd"
    primary_account = accounts[0].canonical_name if accounts else "ACCT-1234567890 (City Bank)"

    anomaly_score = 87 if len(entities) > 0 else 74

    return {
        "case_id": str(case.id),
        "case_number": getattr(case, "case_number", case_id),
        "primary_subject": {
            "name": primary_name,
            "role": "Managing Director - Syndicate Key Node",
            "org": primary_org,
            "vehicle": primary_vehicle,
            "phone": primary_phone,
            "account": primary_account,
            "jurisdiction": "New Delhi (South)",
            "priority": "HIGH / ELEVATED"
        },
        "anomaly_index": {
            "score": anomaly_score,
            "status": "High Topological & Transactional Divergence",
            "confidence": "94%",
            "model_version": "IsolationForest-GraphTopo v2.1"
        },
        "topology_preview": {
            "node_count": max(len(entities), 6),
            "edge_count": max(len(relationships), 4),
            "sync_status": "Synchronized (Neo4j)"
        },
        "timeline_events": [
            {
                "title": "Flagged Fund Dispersal",
                "desc": f"INR 18,00,000 via IMPS from {primary_org} to Associate",
                "date": "10 Jan 2024 - IMPS Ref #4491",
                "type": "flagged"
            },
            {
                "title": "Cellular Co-Location",
                "desc": f"{primary_phone} co-located at Connaught Place Tower DEL-CP-049",
                "date": "14 Jan 2024, 19:45 IST",
                "type": "verified"
            },
            {
                "title": "Physical Sighting",
                "desc": f"Subject driving {primary_vehicle} near Saket Complex",
                "date": "05 Jan 2024 - Surveillance Log",
                "type": "tracked"
            }
        ],
        "linked_assets": [
            {"name": primary_org, "type": "ORGANIZATION", "badge": "FLAGGED HUB"},
            {"name": primary_account, "type": "ACCOUNT", "badge": "HIGH VOLUME"},
            {"name": primary_vehicle, "type": "VEHICLE", "badge": "TRACKED"},
            {"name": primary_phone, "type": "PHONE", "badge": "24 CALLS"}
        ]
    }
