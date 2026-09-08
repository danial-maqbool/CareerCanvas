"""Workspace settings and coarse-grained audit history."""
from alembic import op
import sqlalchemy as sa

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('settings', sa.Column('key', sa.String(100), primary_key=True), sa.Column('value', sa.JSON(), nullable=False))
    op.create_table('audit_events', sa.Column('id', sa.String(36), primary_key=True), sa.Column('action', sa.String(100), nullable=False), sa.Column('entity_id', sa.String(36)), sa.Column('created_at', sa.DateTime(timezone=True), nullable=False))


def downgrade():
    op.drop_table('audit_events')
    op.drop_table('settings')
