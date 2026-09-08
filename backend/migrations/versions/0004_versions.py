"""Immutable resume versions."""
from alembic import op
import sqlalchemy as sa
revision='0004'
down_revision='0003'
branch_labels=None
depends_on=None

def upgrade():
    op.create_table('resume_versions',sa.Column('id',sa.String(36),primary_key=True),sa.Column('resume_id',sa.String(36),sa.ForeignKey('resumes.id',ondelete='CASCADE'),nullable=False),sa.Column('number',sa.Integer(),nullable=False),sa.Column('note',sa.String(1000),nullable=False),sa.Column('snapshot',sa.JSON(),nullable=False),sa.Column('created_at',sa.DateTime(timezone=True),nullable=False),sa.UniqueConstraint('resume_id','number'))
    op.create_index('ix_resume_versions_resume_id','resume_versions',['resume_id'])

def downgrade():op.drop_table('resume_versions')
