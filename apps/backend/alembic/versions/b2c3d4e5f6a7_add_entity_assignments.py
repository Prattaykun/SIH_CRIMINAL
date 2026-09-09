"""Add entity_assignments table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-09-10 05:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "entity_assignments",
        sa.Column("case_id", sa.String(length=36), nullable=False),
        sa.Column("entity_id", sa.String(length=36), nullable=False),
        sa.Column("assigned_to", sa.String(length=36), nullable=False),
        sa.Column("assigned_by", sa.String(length=36), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="ACTIVE"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["assigned_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["assigned_to"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["entity_id"], ["extracted_entities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "case_id",
            "entity_id",
            "assigned_to",
            name="uq_case_entity_officer",
        ),
    )
    with op.batch_alter_table("entity_assignments", schema=None) as batch_op:
        batch_op.create_index("ix_entity_assignments_case_id", ["case_id"], unique=False)
        batch_op.create_index("ix_entity_assignments_entity_id", ["entity_id"], unique=False)
        batch_op.create_index("ix_entity_assignments_assigned_to", ["assigned_to"], unique=False)
        batch_op.create_index("ix_entity_assignments_status", ["status"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("entity_assignments", schema=None) as batch_op:
        batch_op.drop_index("ix_entity_assignments_status")
        batch_op.drop_index("ix_entity_assignments_assigned_to")
        batch_op.drop_index("ix_entity_assignments_entity_id")
        batch_op.drop_index("ix_entity_assignments_case_id")
    op.drop_table("entity_assignments")
