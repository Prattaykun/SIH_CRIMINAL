"""API dependencies."""

from typing import Callable, Any, Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from apps.backend.app.core.config import settings
from apps.backend.app.core.security import ALGORITHM
from apps.backend.app.db.session import get_db
from apps.backend.app.models.user import User, Role
from apps.backend.app.models.case_membership import CaseMembership, CaseRole, MembershipStatus
from apps.backend.app.models.case import Case
from apps.backend.app.services.audit import log_action

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login")
oauth2_optional_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login", auto_error=False)


def get_optional_user(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str | None, Depends(oauth2_optional_scheme)],
) -> User | None:
    """Validate JWT if token is provided; return None if unauthenticated or invalid."""
    if not token:
        return None
    try:
        unverified_headers = jwt.get_unverified_headers(token)
        if unverified_headers.get("alg") != ALGORITHM:
            return None

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_sub": True,
                "require_exp": True,
                "require_sub": True,
            },
        )
        user_id: str = payload.get("sub")
        if not user_id:
            return None
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.is_active:
            return user
        return None
    except Exception:
        return None


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    """Validate JWT and fetch user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Strict algorithm validation
        unverified_headers = jwt.get_unverified_headers(token)
        if unverified_headers.get("alg") != ALGORITHM:
            raise credentials_exception

        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_sub": True,
                "require_exp": True,
                "require_sub": True
            }
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
            
        jti: str = payload.get("jti")
        if not jti:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Ensure the user is active."""
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
    return current_user


def require_role(allowed_roles: list[Role]) -> Callable[[User], User]:
    """Dependency to check if the user has one of the allowed roles."""
    def role_checker(
        current_user: Annotated[User, Depends(get_current_active_user)],
        db: Annotated[Session, Depends(get_db)]
    ) -> User:
        if current_user.role not in [role.value for role in allowed_roles]:
            log_action(
                db=db,
                action="AUTHORIZATION_DENIED",
                user_id=current_user.id,
                target_type="ROLE",
                target_id=current_user.role,
                new_state={"reason": f"Required one of {[r.value for r in allowed_roles]}, had {current_user.role}"}
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        return current_user
    return role_checker


def require_administrator(
    current_user: Annotated[User, Depends(require_role([Role.ADMINISTRATOR]))],
) -> User:
    """Dependency for requiring administrator privileges."""
    return current_user


try:
    from enum import StrEnum
except ImportError:
    from enum import Enum
    class StrEnum(str, Enum):  # type: ignore[no-redef]
        pass

class Permission(StrEnum):
    VIEW_CASE = "view_case"
    UPLOAD_EVIDENCE = "upload_evidence"
    CREATE_NOTES = "create_notes"
    CREATE_COMMENTS = "create_comments"
    CREATE_TASKS = "create_tasks"
    ASSIGN_TASKS = "assign_tasks"
    UPDATE_OWN_TASKS = "update_own_tasks"
    UPDATE_ANY_TASKS = "update_any_tasks"
    REVIEW_ASSIGNED_CANDIDATES = "review_assigned_candidates"
    REVIEW_CANDIDATES = "review_candidates"
    PROPOSE_GRAPH_LINKS = "propose_graph_links"
    MANAGE_TEAM = "manage_team"
    TRANSFER_CASE_LEAD = "transfer_case_lead"
    VIEW_CASE_AUDIT = "view_case_audit"
    EXPORT_CASE = "export_case"
    APPROVE_GRAPH_SYNC = "approve_graph_sync"

CASE_ROLE_PERMISSIONS = {
    CaseRole.CASE_LEAD: {
        Permission.VIEW_CASE, Permission.UPLOAD_EVIDENCE, Permission.CREATE_NOTES, 
        Permission.CREATE_COMMENTS, Permission.CREATE_TASKS, Permission.ASSIGN_TASKS, 
        Permission.UPDATE_OWN_TASKS, Permission.UPDATE_ANY_TASKS, Permission.REVIEW_ASSIGNED_CANDIDATES, 
        Permission.REVIEW_CANDIDATES, Permission.PROPOSE_GRAPH_LINKS, Permission.MANAGE_TEAM, 
        Permission.TRANSFER_CASE_LEAD, Permission.VIEW_CASE_AUDIT, Permission.EXPORT_CASE, 
        Permission.APPROVE_GRAPH_SYNC,
    },
    CaseRole.INVESTIGATOR: {
        Permission.VIEW_CASE, Permission.UPLOAD_EVIDENCE, Permission.CREATE_NOTES, 
        Permission.CREATE_COMMENTS, Permission.CREATE_TASKS, Permission.UPDATE_OWN_TASKS, 
        Permission.REVIEW_ASSIGNED_CANDIDATES, Permission.PROPOSE_GRAPH_LINKS, Permission.VIEW_CASE_AUDIT,
    },
    CaseRole.ANALYST: {
        Permission.VIEW_CASE, Permission.CREATE_NOTES, Permission.CREATE_COMMENTS, 
        Permission.CREATE_TASKS, Permission.UPDATE_OWN_TASKS, Permission.PROPOSE_GRAPH_LINKS, 
        Permission.VIEW_CASE_AUDIT,
    },
    CaseRole.REVIEWER: {
        Permission.VIEW_CASE, Permission.CREATE_NOTES, Permission.CREATE_COMMENTS, 
        Permission.UPDATE_OWN_TASKS, Permission.REVIEW_CANDIDATES, Permission.VIEW_CASE_AUDIT,
    },
    CaseRole.OBSERVER: {
        Permission.VIEW_CASE,
    },
}

def require_case_permission(permission: Permission) -> Callable[[str, User, Session], CaseMembership]:
    """Dependency to check if the user has specific permission in a case."""
    def permission_checker(
        case_id: str,
        current_user: Annotated[User, Depends(get_current_active_user)],
        db: Annotated[Session, Depends(get_db)],
    ) -> CaseMembership:
        import uuid
        try:
            val = uuid.UUID(case_id)
            case = db.query(Case).filter(Case.id == str(val)).first()
        except ValueError:
            case = db.query(Case).filter(Case.case_number == case_id).first()
        
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
            
        resolved_case_id = str(case.id)

        # Administrator has implicit all-access
        if current_user.role == Role.ADMINISTRATOR.value:
            log_action(
                db=db,
                action="ADMIN_OVERRIDE",
                user_id=current_user.id,
                target_type="CASE",
                target_id=resolved_case_id,
                new_state={"permission": permission.value}
            )
            return CaseMembership(
                user_id=current_user.id,
                case_id=resolved_case_id,
                case_role=CaseRole.CASE_LEAD.value,
                status=MembershipStatus.ACTIVE.value
            )

        assignment = db.query(CaseMembership).filter(
            CaseMembership.case_id == resolved_case_id,
            CaseMembership.user_id == current_user.id,
            CaseMembership.status == MembershipStatus.ACTIVE.value
        ).first()

        if not assignment:
            log_action(
                db=db,
                action="AUTHORIZATION_DENIED",
                user_id=current_user.id,
                target_type="CASE",
                target_id=case_id,
                new_state={"reason": "User is not assigned to this case"}
            )
            db.commit()
            raise HTTPException(status_code=403, detail="Not assigned to this case")

        assigned_role = CaseRole(assignment.case_role)
        allowed_permissions = CASE_ROLE_PERMISSIONS.get(assigned_role, set())
        
        if permission not in allowed_permissions:
            log_action(
                db=db,
                action="AUTHORIZATION_DENIED",
                user_id=current_user.id,
                target_type="CASE",
                target_id=case_id,
                new_state={"reason": f"Requires {permission.value} permission, role {assigned_role.value} does not have it."}
            )
            db.commit()
            raise HTTPException(status_code=403, detail=f"Requires {permission.value} permission.")

        return assignment
    return permission_checker

