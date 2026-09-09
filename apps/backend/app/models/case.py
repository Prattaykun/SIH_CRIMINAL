"""Case SQLAlchemy model."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from apps.backend.app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Case(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Investigation case record."""

    __tablename__ = "cases"

    case_number: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="ACTIVE"
    )  # ACTIVE | CLOSED | ARCHIVED
    priority: Mapped[str] = mapped_column(
        String(50), nullable=False, default="MEDIUM"
    )  # LOW | MEDIUM | HIGH | CRITICAL
    created_by: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )

    # Async plain-language Simple View (Postgres JSON)
    simple_summary_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="NONE"
    )  # NONE | PENDING | GENERATING | READY | FAILED
    simple_summary: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    simple_summary_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    simple_summary_generated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    documents: Mapped[list["Document"]] = relationship(
        "Document", back_populates="case", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_cases_case_number", "case_number"),
        Index("ix_cases_status", "status"),
        Index("ix_cases_created_at", "created_at"),
        Index("ix_cases_created_by", "created_by"),
    )


# Import here to avoid circular import at module-load time
from apps.backend.app.models.document import Document  # noqa: E402
