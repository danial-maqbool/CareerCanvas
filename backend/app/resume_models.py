from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base
from .models import identifier, utcnow


class Resume(Base):
    __tablename__ = 'resumes'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    profile_id: Mapped[str | None] = mapped_column(ForeignKey('career_profiles.id', ondelete='SET NULL'), nullable=True)
    name: Mapped[str] = mapped_column(String(150))
    purpose: Mapped[str] = mapped_column(String(100), default='General Resume')
    target_role: Mapped[str] = mapped_column(String(200), default='')
    document: Mapped[dict] = mapped_column(JSON)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)
    primary: Mapped[bool] = mapped_column(Boolean, default=False)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
