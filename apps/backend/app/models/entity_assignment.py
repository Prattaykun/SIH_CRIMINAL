"""Entity-to-officer assignment for case investigations."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.backend.app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class EntityAssignment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Assign an extracted entity (person, org, phone, vehicle, …) to an investigator."""

    __tablename__ = "entity_assignments"

    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False
    )
    entity_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("extracted_entities.id", ondelete="CASCADE"), nullable=False
    )
    assigned_to: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    assigned_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ACTIVE"
    )  # ACTIVE | RELEASED | COMPLETED
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    case = relationship("Case", foreign_keys=[case_id])
    entity = relationship("ExtractedEntity", foreign_keys=[entity_id])
    assignee = relationship("User", foreign_keys=[assigned_to])
    assigner = relationship("User", foreign_keys=[assigned_by])

    __table_args__ = (
        UniqueConstraint("case_id", "entity_id", "assigned_to", name="uq_case_entity_officer"),
        Index("ix_entity_assignments_case_id", "case_id"),
        Index("ix_entity_assignments_entity_id", "entity_id"),
        Index("ix_entity_assignments_assigned_to", "assigned_to"),
        Index("ix_entity_assignments_status", "status"),
    )
