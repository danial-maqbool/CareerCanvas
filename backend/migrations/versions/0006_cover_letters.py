from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "cover_letters",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("document", sa.JSON(), nullable=False),
        sa.Column(
            "resume_version_id",
            sa.String(36),
            sa.ForeignKey("resume_versions.id", ondelete="SET NULL"),
        ),
        sa.Column("archived", sa.Boolean(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "cover_letter_versions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "cover_id",
            sa.String(36),
            sa.ForeignKey("cover_letters.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("snapshot", sa.JSON(), nullable=False),
        sa.Column("note", sa.String(1000), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_cover_letter_versions_cover_id", "cover_letter_versions", ["cover_id"]
    )


def downgrade():
    op.drop_table("cover_letter_versions")
    op.drop_table("cover_letters")
