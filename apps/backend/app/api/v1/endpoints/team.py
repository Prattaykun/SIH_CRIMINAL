from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from apps.backend.app.api.deps import get_db, get_current_active_user, require_case_permission, Permission
from apps.backend.app.models.user import User
from apps.backend.app.models.case_membership import CaseMembership, CaseRole, MembershipStatus
from apps.backend.app.schemas.team import TeamMemberResponse, TeamMemberCreate, TeamMemberUpdate, LeadTransfer
from apps.backend.app.services.audit import log_action

router = APIRouter()

@router.get("/{case_id}/team", response_model=List[TeamMemberResponse])
def get_case_team(
    case_id: str,
    db: Session = Depends(get_db),
    access: CaseMembership = Depends(require_case_permission(Permission.VIEW_CASE)),
):
    members = db.query(CaseMembership).filter(CaseMembership.case_id == case_id).all()
    return members


@router.post("/{case_id}/team", response_model=TeamMemberResponse)
def add_team_member(
    case_id: str,
    data: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    access: CaseMembership = Depends(require_case_permission(Permission.MANAGE_TEAM)),
):
    if data.case_role == CaseRole.CASE_LEAD.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add another CASE_LEAD. Use transfer-lead endpoint."
        )

    existing = db.query(CaseMembership).filter(
        CaseMembership.case_id == case_id,
        CaseMembership.user_id == data.user_id
    ).first()

    if existing:
        if existing.status == MembershipStatus.ACTIVE.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already an active member.")
        
        existing.status = MembershipStatus.ACTIVE.value
        existing.case_role = data.case_role
        existing.assigned_by = current_user.id
        existing.assigned_at = datetime.utcnow()
        member = existing
    else:
        member = CaseMembership(
            case_id=case_id,
            user_id=data.user_id,
            case_role=data.case_role,
            status=MembershipStatus.ACTIVE.value,
            assigned_by=current_user.id
        )
        db.add(member)

    log_action(
        db,
        action="MEMBER_ADDED",
        user_id=current_user.id,
        target_type="CASE",
        target_id=case_id,
        new_state={"user_id": data.user_id, "role": data.case_role, "reason": data.reason}
    )
    db.commit()
    db.refresh(member)
    return member


@router.patch("/{case_id}/team/{user_id}", response_model=TeamMemberResponse)
def update_team_member(
    case_id: str,
    user_id: str,
    data: TeamMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    access: CaseMembership = Depends(require_case_permission(Permission.MANAGE_TEAM)),
):
    member = db.query(CaseMembership).filter(
        CaseMembership.case_id == case_id,
        CaseMembership.user_id == user_id
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found in this case.")

    if member.case_role == CaseRole.CASE_LEAD.value and data.status == MembershipStatus.REMOVED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the active CASE_LEAD. Transfer lead first."
        )

    if data.case_role == CaseRole.CASE_LEAD.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change role to CASE_LEAD. Use transfer-lead endpoint."
        )

    if data.case_role:
        member.case_role = data.case_role
    
    if data.status:
        member.status = data.status
        if data.status == MembershipStatus.REMOVED.value:
            member.removed_by = current_user.id
            member.removed_at = datetime.utcnow()

    log_action(
        db,
        action="MEMBER_UPDATED",
        user_id=current_user.id,
        target_type="CASE_MEMBERSHIP",
        target_id=member.id,
        new_state={"role": member.case_role, "status": member.status, "reason": data.reason}
    )
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{case_id}/team/{user_id}")
def remove_team_member(
    case_id: str,
    user_id: str,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    access: CaseMembership = Depends(require_case_permission(Permission.MANAGE_TEAM)),
):
    member = db.query(CaseMembership).filter(
        CaseMembership.case_id == case_id,
        CaseMembership.user_id == user_id,
        CaseMembership.status == MembershipStatus.ACTIVE.value
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Active member not found.")

    if member.case_role == CaseRole.CASE_LEAD.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the active CASE_LEAD. Transfer lead first."
        )

    if not reason:
        raise HTTPException(status_code=400, detail="Reason is required for member removal.")

    member.status = MembershipStatus.REMOVED.value
    member.removed_by = current_user.id
    member.removed_at = datetime.utcnow()

    log_action(
        db,
        action="MEMBER_REMOVED",
        user_id=current_user.id,
        target_type="CASE_MEMBERSHIP",
        target_id=member.id,
        new_state={"reason": reason}
    )
    db.commit()
    return {"status": "success", "message": "Member removed."}


@router.post("/{case_id}/team/transfer-lead", response_model=TeamMemberResponse)
def transfer_case_lead(
    case_id: str,
    data: LeadTransfer,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    access: CaseMembership = Depends(require_case_permission(Permission.TRANSFER_CASE_LEAD)),
):
    current_lead = db.query(CaseMembership).filter(
        CaseMembership.case_id == case_id,
        CaseMembership.case_role == CaseRole.CASE_LEAD.value,
        CaseMembership.status == MembershipStatus.ACTIVE.value
    ).first()

    new_lead = db.query(CaseMembership).filter(
        CaseMembership.case_id == case_id,
        CaseMembership.user_id == data.new_lead_user_id
    ).first()

    if not new_lead:
        raise HTTPException(status_code=404, detail="Target user is not a member of this case.")
    
    if new_lead.status != MembershipStatus.ACTIVE.value:
        raise HTTPException(status_code=400, detail="Target user is not an active member.")

    if current_lead:
        current_lead.case_role = CaseRole.INVESTIGATOR.value
    
    new_lead.case_role = CaseRole.CASE_LEAD.value

    log_action(
        db,
        action="LEAD_TRANSFERRED",
        user_id=current_user.id,
        target_type="CASE",
        target_id=case_id,
        new_state={"new_lead_id": new_lead.user_id, "reason": data.reason}
    )
    db.commit()
    db.refresh(new_lead)
    return new_lead
