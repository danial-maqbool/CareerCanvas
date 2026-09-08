from alembic import op
import sqlalchemy as sa
revision='0010'
down_revision='0009'
branch_labels=None
depends_on=None

def upgrade():op.create_table('tags',sa.Column('id',sa.String(36),primary_key=True),sa.Column('name',sa.String(100),nullable=False,unique=True),sa.Column('color',sa.String(7),nullable=False),sa.Column('archived',sa.Boolean(),nullable=False))
def downgrade():op.drop_table('tags')
