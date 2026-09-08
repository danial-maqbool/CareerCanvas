from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def identifier():
    return str(uuid4())


def utcnow():
    return datetime.now(timezone.utc)


class Setting(Base):
    __tablename__ = 'settings'
    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[dict] = mapped_column(JSON, default=dict)


class AuditEvent(Base):
    __tablename__ = 'audit_events'
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    action: Mapped[str] = mapped_column(String(100))
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
