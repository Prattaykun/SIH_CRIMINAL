"""Add case simple summary fields

Revision ID: a1b2c3d4e5f6
Revises: 8658cd33f132
Create Date: 2026-09-10 04:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "8658cd33f132"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("cases", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "simple_summary_status",
                sa.String(length=20),
                nullable=False,
                server_default="NONE",
            )
        )
        batch_op.add_column(sa.Column("simple_summary", sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column("simple_summary_error", sa.Text(), nullable=True))
        batch_op.add_column(
            sa.Column("simple_summary_generated_at", sa.DateTime(timezone=True), nullable=True)
        )


def downgrade() -> None:
    with op.batch_alter_table("cases", schema=None) as batch_op:
        batch_op.drop_column("simple_summary_generated_at")
        batch_op.drop_column("simple_summary_error")
        batch_op.drop_column("simple_summary")
        batch_op.drop_column("simple_summary_status")
