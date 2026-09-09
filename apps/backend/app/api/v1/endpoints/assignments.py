"""Assign case entities (person, org, phone, vehicle, …) to investigation officers."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from apps.backend.app.api.deps import (
    get_db,
    get_current_active_user,
    require_case_permission,
    Permission,
)
from apps.backend.app.models.case import Case
from apps.backend.app.models.case_membership import CaseMembership, CaseRole, MembershipStatus
from apps.backend.app.models.entity import ExtractedEntity
from apps.backend.app.models.entity_assignment import EntityAssignment
from apps.backend.app.models.user import User, Role
from apps.backend.app.schemas.assignment import (
    AssignableEntityResponse,
    EntityAssignmentCreate,
    EntityAssignmentResponse,
    OfficerResponse,
)
from apps.backend.app.services.audit import log_action

router = APIRouter()

ASSIGNABLE_TYPES = {
    "PERSON",
    "ORGANIZATION",
    "ORG",
    "PHONE_NUMBER",
    "PHONE",
    "VEHICLE",
    "ACCOUNT",
    "BANK_ACCOUNT",
    "LOCATION",
    "ADDRESS",
}

OFFICER_DISPLAY_NAMES = {
    "insp_ashutosh_rawat": "Insp. Ashutosh Rawat",
    "si_meera_joshi": "SI Meera Joshi",
    "asi_vikram_singh": "ASI Vikram Singh",
    "const_priya_nair": "Const. Priya Nair",
    "dsp_anita_desai": "DSP Anita Desai",
    "demo_investigator": "Demo Investigator",
}


def _resolve_case(db: Session, case_id: str) -> Case:
    case = db.query(Case).filter((Case.id == case_id) | (Case.case_number == case_id)).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


def _display_name(user: User) -> str:
    return OFFICER_DISPLAY_NAMES.get(user.username, user.username.replace("_", " ").title())


def _to_assignment_response(row: EntityAssignment, entity: ExtractedEntity | None, user: User | None) -> EntityAssignmentResponse:
    return EntityAssignmentResponse(
        id=row.id,
        case_id=row.case_id,
        entity_id=row.entity_id,
        entity_type=entity.entity_type if entity else None,
        entity_name=(entity.canonical_name or entity.original_value) if entity else None,
        assigned_to=row.assigned_to,
        assignee_username=user.username if user else None,
        assignee_display_name=_display_name(user) if user else None,
        assigned_by=row.assigned_by,
        status=row.status,
        notes=row.notes,
        assigned_at=row.assigned_at,
        created_at=row.created_at,
    )


@router.get("/{case_id}/officers", response_model=List[OfficerResponse])
def list_case_officers(
    case_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    access: CaseMembership = Depends(require_case_permission(Permission.VIEW_CASE)),
):
    """List mock/seed officers and active case members available for assignment."""
    case = _resolve_case(db, case_id)
    memberships = {
        m.user_id: m
        for m in db.query(CaseMembership)
        .filter(
            CaseMembership.case_id == case.id,
            CaseMembership.status == MembershipStatus.ACTIVE.value,
        )
        .all()
    }

    member_ids = list(memberships.keys())
    officers_q = db.query(User).filter(User.is_active.is_(True))
    if member_ids:
        officers_q = officers_q.filter(
            (User.role.in_([Role.INVESTIGATOR.value, Role.ADMINISTRATOR.value]))
            | (User.id.in_(member_ids))
        )
    else:
        officers_q = officers_q.filter(
            User.role.in_([Role.INVESTIGATOR.value, Role.ADMINISTRATOR.value])
        )
    officers = officers_q.order_by(User.username.asc()).all()

    from sqlalchemy import func

    count_rows = (
        db.query(EntityAssignment.assigned_to, func.count(EntityAssignment.id))
        .filter(EntityAssignment.case_id == case.id, EntityAssignment.status == "ACTIVE")
        .group_by(EntityAssignment.assigned_to)
        .all()
    )
    counts = {uid: cnt for uid, cnt in count_rows}

    return [
        OfficerResponse(
            id=u.id,
            username=u.username,
            email=u.email,
            role=u.role,
            display_name=_display_name(u),
            is_case_member=u.id in memberships,
            case_role=memberships[u.id].case_role if u.id in memberships else None,
            active_assignment_count=counts.get(u.id, 0),
        )
        for u in officers
    ]


@router.get("/{case_id}/assignable-entities", response_model=List[AssignableEntityResponse])
def list_assignable_entities(
    case_id: str,
    entity_type: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    access: CaseMembership = Depends(require_case_permission(Permission.VIEW_CASE)),
):
    case = _resolve_case(db, case_id)
    q = db.query(ExtractedEntity).filter(ExtractedEntity.case_id == case.id)
    if entity_type:
        q = q.filter(ExtractedEntity.entity_type == entity_type.upper())
    else:
        q = q.filter(ExtractedEntity.entity_type.in_(list(ASSIGNABLE_TYPES)))

    entities = q.order_by(ExtractedEntity.entity_type.asc(), ExtractedEntity.canonical_name.asc()).limit(300).all()
    active = (
        db.query(EntityAssignment)
        .filter(EntityAssignment.case_id == case.id, EntityAssignment.status == "ACTIVE")
        .all()
    )
    by_entity: dict[str, list[EntityAssignment]] = {}
    user_ids = {a.assigned_to for a in active}
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids or ["__none__"])).all()}
    for a in active:
        by_entity.setdefault(a.entity_id, []).append(a)

    out: list[AssignableEntityResponse] = []
    for e in entities:
        assigns = by_entity.get(e.id, [])
        out.append(
            AssignableEntityResponse(
                id=e.id,
                entity_type=e.entity_type,
                canonical_name=e.canonical_name or e.original_value or e.id,
                confidence_score=float(e.confidence_score) if e.confidence_score is not None else None,
                verification_status=e.verification_status,
                assigned_officer_ids=[a.assigned_to for a in assigns],
                assigned_officer_names=[
                    _display_name(users[a.assigned_to]) for a in assigns if a.assigned_to in users
                ],
            )
        )
    return out


@router.get("/{case_id}/entity-assignments", response_model=List[EntityAssignmentResponse])
def list_entity_assignments(
    case_id: str,
    status_filter: str | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    access: CaseMembership = Depends(require_case_permission(Permission.VIEW_CASE)),
):
    case = _resolve_case(db, case_id)
    q = db.query(EntityAssignment).filter(EntityAssignment.case_id == case.id)
    if status_filter:
        q = q.filter(EntityAssignment.status == status_filter.upper())
    else:
        q = q.filter(EntityAssignment.status == "ACTIVE")
    rows = q.order_by(EntityAssignment.created_at.desc()).all()
    entity_ids = {r.entity_id for r in rows}
    user_ids = {r.assigned_to for r in rows}
    entities = {
        e.id: e
        for e in db.query(ExtractedEntity).filter(ExtractedEntity.id.in_(entity_ids or ["__none__"])).all()
    }
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids or ["__none__"])).all()}
    return [_to_assignment_response(r, entities.get(r.entity_id), users.get(r.assigned_to)) for r in rows]


@router.post(
    "/{case_id}/entity-assignments",
    response_model=EntityAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_entity_assignment(
    case_id: str,
    data: EntityAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    access: CaseMembership = Depends(require_case_permission(Permission.ASSIGN_TASKS)),
):
    case = _resolve_case(db, case_id)
    entity = (
        db.query(ExtractedEntity)
        .filter(ExtractedEntity.id == data.entity_id, ExtractedEntity.case_id == case.id)
        .first()
    )
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found in this case")
    if entity.entity_type not in ASSIGNABLE_TYPES:
        raise HTTPException(status_code=400, detail=f"Entity type {entity.entity_type} is not assignable")

    officer = db.query(User).filter(User.id == data.assigned_to, User.is_active.is_(True)).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    existing = (
        db.query(EntityAssignment)
        .filter(
            EntityAssignment.case_id == case.id,
            EntityAssignment.entity_id == entity.id,
            EntityAssignment.assigned_to == officer.id,
        )
        .first()
    )
    if existing and existing.status == "ACTIVE":
        raise HTTPException(status_code=400, detail="Entity already assigned to this officer")

    # Auto-add officer to case team as INVESTIGATOR if missing
    membership = (
        db.query(CaseMembership)
        .filter(CaseMembership.case_id == case.id, CaseMembership.user_id == officer.id)
        .first()
    )
    if not membership:
        db.add(
            CaseMembership(
                case_id=case.id,
                user_id=officer.id,
                case_role=CaseRole.INVESTIGATOR.value,
                status=MembershipStatus.ACTIVE.value,
                assigned_by=current_user.id,
                assigned_at=datetime.now(timezone.utc),
            )
        )
    elif membership.status != MembershipStatus.ACTIVE.value:
        membership.status = MembershipStatus.ACTIVE.value
        membership.case_role = membership.case_role or CaseRole.INVESTIGATOR.value
        membership.assigned_by = current_user.id
        membership.assigned_at = datetime.now(timezone.utc)

    if existing:
        existing.status = "ACTIVE"
        existing.notes = data.notes
        existing.assigned_by = current_user.id
        existing.assigned_at = datetime.now(timezone.utc)
        row = existing
    else:
        row = EntityAssignment(
            case_id=case.id,
            entity_id=entity.id,
            assigned_to=officer.id,
            assigned_by=current_user.id,
            status="ACTIVE",
            notes=data.notes,
            assigned_at=datetime.now(timezone.utc),
        )
        db.add(row)
    log_action(
        db,
        action="ENTITY_ASSIGNED",
        user_id=current_user.id,
        target_type="ENTITY",
        target_id=entity.id,
        new_state={
            "case_id": case.id,
            "assigned_to": officer.id,
            "entity_type": entity.entity_type,
            "entity_name": entity.canonical_name,
        },
    )
    db.commit()
    db.refresh(row)
    return _to_assignment_response(row, entity, officer)


@router.delete("/{case_id}/entity-assignments/{assignment_id}", status_code=status.HTTP_200_OK)
def release_entity_assignment(
    case_id: str,
    assignment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    access: CaseMembership = Depends(require_case_permission(Permission.ASSIGN_TASKS)),
):
    case = _resolve_case(db, case_id)
    row = (
        db.query(EntityAssignment)
        .filter(EntityAssignment.id == assignment_id, EntityAssignment.case_id == case.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Assignment not found")
    row.status = "RELEASED"
    log_action(
        db,
        action="ENTITY_ASSIGNMENT_RELEASED",
        user_id=current_user.id,
        target_type="ENTITY_ASSIGNMENT",
        target_id=assignment_id,
        previous_state={"status": "ACTIVE"},
        new_state={"status": "RELEASED"},
    )
    db.commit()
    return {"status": "RELEASED", "id": assignment_id}
