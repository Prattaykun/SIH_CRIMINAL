"""Case Task SQLAlchemy model."""

import enum
from datetime import datetime
from sqlalchemy import ForeignKey, Index, String, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.backend.app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class TaskStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    BLOCKED = "BLOCKED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TaskType(str, enum.Enum):
    VERIFY_ENTITY = "VERIFY_ENTITY"
    VERIFY_RELATIONSHIP = "VERIFY_RELATIONSHIP"
    REVIEW_DOCUMENT = "REVIEW_DOCUMENT"
    TRACE_PHONE = "TRACE_PHONE"
    REVIEW_TRANSACTION = "REVIEW_TRANSACTION"
    REVIEW_LOCATION = "REVIEW_LOCATION"
    GRAPH_REVIEW = "GRAPH_REVIEW"
    EVIDENCE_FOLLOW_UP = "EVIDENCE_FOLLOW_UP"
    GENERAL = "GENERAL"


class CaseTask(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Task within an investigation case."""

    __tablename__ = "case_tasks"

    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    task_type: Mapped[str] = mapped_column(String(50), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default=TaskPriority.MEDIUM.value, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=TaskStatus.OPEN.value, nullable=False)
    
    assigned_to: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    completed_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    evidence_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    candidate_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    graph_entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    graph_edge_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    case = relationship("Case", foreign_keys=[case_id])
    assignee = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])
    completer = relationship("User", foreign_keys=[completed_by])
    evidence = relationship("Document", foreign_keys=[evidence_id])

    __table_args__ = (
        Index("ix_case_tasks_case_id", "case_id"),
        Index("ix_case_tasks_assigned_to", "assigned_to"),
        Index("ix_case_tasks_status", "status"),
    )

    __mapper_args__ = {
        "version_id_col": version
    }
