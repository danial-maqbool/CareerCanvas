from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship, backref
from .database import Base
from .models import identifier, utcnow


class Analysis(Base):
    __tablename__ = "resume_analyses"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    resume_id: Mapped[str] = mapped_column(
        ForeignKey("resumes.id", ondelete="CASCADE"), index=True
    )
    revision: Mapped[int] = mapped_column(Integer)
    kind: Mapped[str] = mapped_column(String(20))
    result: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    resume = relationship(
        "Resume",
        backref=backref("analyses", cascade="all, delete-orphan", passive_deletes=True),
    )
