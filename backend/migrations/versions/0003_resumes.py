"""Independent resume documents and optimistic revisions."""
from alembic import op
import sqlalchemy as sa

revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('resumes', sa.Column('id',sa.String(36),primary_key=True),sa.Column('profile_id',sa.String(36),sa.ForeignKey('career_profiles.id',ondelete='SET NULL')),sa.Column('name',sa.String(150),nullable=False),sa.Column('purpose',sa.String(100),nullable=False),sa.Column('target_role',sa.String(200),nullable=False),sa.Column('document',sa.JSON(),nullable=False),sa.Column('archived',sa.Boolean(),nullable=False),sa.Column('primary',sa.Boolean(),nullable=False),sa.Column('revision',sa.Integer(),nullable=False),sa.Column('created_at',sa.DateTime(timezone=True),nullable=False),sa.Column('updated_at',sa.DateTime(timezone=True),nullable=False))


def downgrade():
    op.drop_table('resumes')
