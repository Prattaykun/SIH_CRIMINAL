from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from apps.backend.app.api.deps import get_db, get_current_active_user, require_case_permission, Permission
from apps.backend.app.models.user import User
from apps.backend.app.models.case_membership import CaseMembership
from apps.backend.app.models.case_task import CaseTask, TaskStatus
from apps.backend.app.schemas.task import TaskResponse, TaskCreate, TaskUpdate, TaskAssign, TaskComplete, TaskReopen
from apps.backend.app.services.audit import log_action

router = APIRouter()

@router.get("/{case_id}/tasks", response_model=List[TaskResponse])
def get_case_tasks(
    case_id: str,
    db: Session = Depends(get_db),
    access: CaseMembership = Depends(require_case_permission(Permission.VIEW_CASE)),
):
    tasks = db.query(CaseTask).filter(CaseTask.case_id == case_id).all()
    return tasks


@router.post("/{case_id}/tasks", response_model=TaskResponse)
def create_task(
    case_id: str,
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # A user needs CREATE_TASKS to create unassigned or self-assigned
    # But needs ASSIGN_TASKS to assign to someone else.
    if data.assigned_to and data.assigned_to != current_user.id:
        require_case_permission(Permission.ASSIGN_TASKS)(case_id, current_user, db)
    else:
        require_case_permission(Permission.CREATE_TASKS)(case_id, current_user, db)

    task = CaseTask(
        case_id=case_id,
        title=data.title,
        description=data.description,
        task_type=data.task_type.value,
        priority=data.priority.value,
        status=TaskStatus.OPEN.value,
        assigned_to=data.assigned_to,
        created_by=current_user.id,
        due_at=data.due_at,
        evidence_id=data.evidence_id,
        candidate_id=data.candidate_id,
        graph_entity_id=data.graph_entity_id,
        graph_edge_id=data.graph_edge_id,
    )
    db.add(task)
    db.flush()

    log_action(
        db,
        action="TASK_CREATED",
        user_id=current_user.id,
        target_type="CASE_TASK",
        target_id=str(task.id),
        new_state={"title": task.title, "assigned_to": task.assigned_to}
    )
    db.commit()
    db.refresh(task)
    return task


@router.patch("/{case_id}/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    case_id: str,
    task_id: str,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    task = db.query(CaseTask).filter(CaseTask.id == task_id, CaseTask.case_id == case_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.assigned_to == current_user.id:
        require_case_permission(Permission.UPDATE_OWN_TASKS)(case_id, current_user, db)
    else:
        require_case_permission(Permission.UPDATE_ANY_TASKS)(case_id, current_user, db)

    if task.version != data.expected_version:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "This task has been updated by another case member. Refresh before saving.",
                "error_code": "VERSION_CONFLICT",
                "current_version": task.version
            }
        )
    
    if data.title is not None: task.title = data.title
    if data.description is not None: task.description = data.description
    if data.priority is not None: task.priority = data.priority.value
    if data.due_at is not None: task.due_at = data.due_at
    if data.assigned_to is not None:
        if data.assigned_to != task.assigned_to:
            require_case_permission(Permission.ASSIGN_TASKS)(case_id, current_user, db)
        task.assigned_to = data.assigned_to

    task.version = task.version + 1

    log_action(
        db,
        action="TASK_UPDATED",
        user_id=current_user.id,
        target_type="CASE_TASK",
        target_id=str(task.id),
        new_state={"reason": data.reason}
    )
    db.commit()
    db.refresh(task)
    return task


@router.post("/{case_id}/tasks/{task_id}/assign", response_model=TaskResponse)
def assign_task(
    case_id: str,
    task_id: str,
    data: TaskAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    access: CaseMembership = Depends(require_case_permission(Permission.ASSIGN_TASKS)),
):
    task = db.query(CaseTask).filter(CaseTask.id == task_id, CaseTask.case_id == case_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.version != data.expected_version:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Version conflict")

    task.assigned_to = data.assigned_to
    task.version += 1

    log_action(db, "TASK_ASSIGNED", current_user.id, "CASE_TASK", str(task.id), {"assigned_to": data.assigned_to, "reason": data.reason})
    db.commit()
    db.refresh(task)
    return task


@router.post("/{case_id}/tasks/{task_id}/complete", response_model=TaskResponse)
def complete_task(
    case_id: str,
    task_id: str,
    data: TaskComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    task = db.query(CaseTask).filter(CaseTask.id == task_id, CaseTask.case_id == case_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.assigned_to == current_user.id:
        require_case_permission(Permission.UPDATE_OWN_TASKS)(case_id, current_user, db)
    else:
        require_case_permission(Permission.UPDATE_ANY_TASKS)(case_id, current_user, db)

    if task.version != data.expected_version:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Version conflict")

    task.status = TaskStatus.COMPLETED.value
    task.completed_by = current_user.id
    task.completed_at = datetime.utcnow()
    task.version += 1

    log_action(db, "TASK_COMPLETED", current_user.id, "CASE_TASK", str(task.id), {"reason": data.reason})
    db.commit()
    db.refresh(task)
    return task


@router.post("/{case_id}/tasks/{task_id}/reopen", response_model=TaskResponse)
def reopen_task(
    case_id: str,
    task_id: str,
    data: TaskReopen,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    task = db.query(CaseTask).filter(CaseTask.id == task_id, CaseTask.case_id == case_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.assigned_to == current_user.id:
        require_case_permission(Permission.UPDATE_OWN_TASKS)(case_id, current_user, db)
    else:
        require_case_permission(Permission.UPDATE_ANY_TASKS)(case_id, current_user, db)

    if task.version != data.expected_version:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Version conflict")

    task.status = TaskStatus.OPEN.value
    task.completed_by = None
    task.completed_at = None
    task.version += 1

    log_action(db, "TASK_REOPENED", current_user.id, "CASE_TASK", str(task.id), {"reason": data.reason})
    db.commit()
    db.refresh(task)
    return task
