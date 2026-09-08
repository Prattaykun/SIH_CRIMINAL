"""Case Membership SQLAlchemy model."""

import enum
from datetime import datetime
from sqlalchemy import ForeignKey, Index, String, DateTime, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.backend.app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CaseRole(str, enum.Enum):
    CASE_LEAD = "CASE_LEAD"
    INVESTIGATOR = "INVESTIGATOR"
    ANALYST = "ANALYST"
    REVIEWER = "REVIEWER"
    OBSERVER = "OBSERVER"


class MembershipStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    REMOVED = "REMOVED"


class CaseMembership(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Assignment mapping a user to a case with a specific role."""

    __tablename__ = "case_memberships"

    case_id: Mapped[str] = mapped_column(String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    case_role: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=MembershipStatus.ACTIVE.value, nullable=False)
    
    assigned_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    removed_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    removed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    case = relationship("Case", foreign_keys=[case_id])
    assigner = relationship("User", foreign_keys=[assigned_by])
    remover = relationship("User", foreign_keys=[removed_by])

    __table_args__ = (
        UniqueConstraint("case_id", "user_id", name="uq_case_user_membership"),
        Index("ix_case_memberships_user_id", "user_id"),
        Index("ix_case_memberships_case_id", "case_id"),
        Index("ix_case_memberships_status", "status"),
        Index(
            "uq_case_one_active_lead",
            "case_id",
            unique=True,
            postgresql_where=text("case_role = 'CASE_LEAD' AND status = 'ACTIVE'")
        ),
    )
