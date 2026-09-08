from alembic import op
import sqlalchemy as sa

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade():
    for name in ["interviews", "contacts", "star_stories", "interview_questions"]:
        columns = [
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("title", sa.String(300), nullable=False),
            sa.Column("data", sa.JSON(), nullable=False),
            sa.Column("revision", sa.Integer(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        ]
        if name in ["interviews", "contacts"]:
            columns.append(
                sa.Column(
                    "application_id",
                    sa.String(36),
                    sa.ForeignKey("job_applications.id", ondelete="SET NULL"),
                )
            )
        op.create_table(name, *columns)
        if name in ["interviews", "contacts"]:
            op.create_index("ix_" + name + "_application_id", name, ["application_id"])


def downgrade():
    for name in ["interview_questions", "star_stories", "contacts", "interviews"]:
        op.drop_table(name)
