from alembic import op
import sqlalchemy as sa
revision='0009'
down_revision='0008'
branch_labels=None
depends_on=None

def upgrade():
    op.create_table('career_goals',sa.Column('id',sa.String(36),primary_key=True),sa.Column('title',sa.String(300),nullable=False),sa.Column('data',sa.JSON(),nullable=False),sa.Column('revision',sa.Integer(),nullable=False),sa.Column('updated_at',sa.DateTime(timezone=True),nullable=False))
def downgrade():op.drop_table('career_goals')
