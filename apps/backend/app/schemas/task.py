from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from apps.backend.app.models.case_task import TaskPriority, TaskStatus, TaskType

class TaskResponse(BaseModel):
    id: str
    case_id: str
    title: str
    description: Optional[str]
    task_type: str
    priority: str
    status: str
    assigned_to: Optional[str]
    created_by: str
    completed_by: Optional[str]
    due_at: Optional[datetime]
    completed_at: Optional[datetime]
    evidence_id: Optional[str]
    candidate_id: Optional[str]
    graph_entity_id: Optional[str]
    graph_edge_id: Optional[str]
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    task_type: TaskType
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to: Optional[str] = None
    due_at: Optional[datetime] = None
    evidence_id: Optional[str] = None
    candidate_id: Optional[str] = None
    graph_entity_id: Optional[str] = None
    graph_edge_id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    assigned_to: Optional[str] = None
    due_at: Optional[datetime] = None
    expected_version: int = Field(ge=1)
    reason: Optional[str] = None

class TaskAssign(BaseModel):
    assigned_to: str
    expected_version: int = Field(ge=1)
    reason: Optional[str] = None

class TaskComplete(BaseModel):
    expected_version: int = Field(ge=1)
    reason: Optional[str] = None

class TaskReopen(BaseModel):
    expected_version: int = Field(ge=1)
    reason: str
