from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class TeamMemberResponse(BaseModel):
    id: str
    case_id: str
    user_id: str
    case_role: str
    status: str
    assigned_by: Optional[str]
    assigned_at: datetime
    removed_by: Optional[str]
    removed_at: Optional[datetime]

    class Config:
        from_attributes = True

class TeamMemberCreate(BaseModel):
    user_id: str
    case_role: str
    reason: Optional[str] = None

class TeamMemberUpdate(BaseModel):
    case_role: Optional[str] = None
    status: Optional[str] = None
    expected_version: int
    reason: str

class LeadTransfer(BaseModel):
    new_lead_user_id: str
    reason: str
