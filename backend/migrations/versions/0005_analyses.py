from alembic import op
import sqlalchemy as sa
revision='0005'
down_revision='0004'
branch_labels=None
depends_on=None

def upgrade():
    op.create_table('resume_analyses',sa.Column('id',sa.String(36),primary_key=True),sa.Column('resume_id',sa.String(36),sa.ForeignKey('resumes.id',ondelete='CASCADE'),nullable=False),sa.Column('revision',sa.Integer(),nullable=False),sa.Column('kind',sa.String(20),nullable=False),sa.Column('result',sa.JSON(),nullable=False),sa.Column('created_at',sa.DateTime(timezone=True),nullable=False))
    op.create_index('ix_resume_analyses_resume_id','resume_analyses',['resume_id'])
def downgrade():op.drop_table('resume_analyses')
