"""Pydantic schemas for entity→officer assignments."""

from datetime import datetime

from pydantic import BaseModel, Field


class EntityAssignmentCreate(BaseModel):
    entity_id: str = Field(..., min_length=1)
    assigned_to: str = Field(..., min_length=1, description="Officer user id")
    notes: str | None = Field(default=None, max_length=2000)


class EntityAssignmentResponse(BaseModel):
    id: str
    case_id: str
    entity_id: str
    entity_type: str | None = None
    entity_name: str | None = None
    assigned_to: str
    assignee_username: str | None = None
    assignee_display_name: str | None = None
    assigned_by: str | None = None
    status: str
    notes: str | None = None
    assigned_at: datetime | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class AssignableEntityResponse(BaseModel):
    id: str
    entity_type: str
    canonical_name: str
    confidence_score: float | None = None
    verification_status: str | None = None
    assigned_officer_ids: list[str] = Field(default_factory=list)
    assigned_officer_names: list[str] = Field(default_factory=list)


class OfficerResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    display_name: str
    is_case_member: bool = False
    case_role: str | None = None
    active_assignment_count: int = 0
