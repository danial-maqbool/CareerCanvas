from datetime import datetime
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field
from sqlalchemy import String, JSON, Integer, DateTime, ForeignKey, select, update
from sqlalchemy.orm import Mapped, mapped_column, Session
from .database import Base
from .dependencies import session
from .models import identifier, utcnow, iso, AuditEvent
from .profile_schemas import StrictModel
from .resume_models import Resume
from .versions import ResumeVersion
from .cover_letters import CoverLetter

STAGES = [
    "Interested",
    "Applied",
    "Screening",
    "Interview",
    "Technical Interview",
    "Final Interview",
    "Offer",
    "Rejected",
    "Withdrawn",
    "Accepted",
]
Stage = Literal[
    "Interested",
    "Applied",
    "Screening",
    "Interview",
    "Technical Interview",
    "Final Interview",
    "Offer",
    "Rejected",
    "Withdrawn",
    "Accepted",
]


class JobApplication(Base):
    __tablename__ = "job_applications"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    company: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(40), default="Interested", index=True)
    data: Mapped[dict] = mapped_column(JSON)
    resume_id: Mapped[str | None] = mapped_column(
        ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True
    )
    resume_version_id: Mapped[str | None] = mapped_column(
        ForeignKey("resume_versions.id", ondelete="SET NULL"), nullable=True
    )
    cover_letter_id: Mapped[str | None] = mapped_column(
        ForeignKey("cover_letters.id", ondelete="SET NULL"), nullable=True
    )
    revision: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )


class ApplicationHistory(Base):
    __tablename__ = "application_history"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    application_id: Mapped[str] = mapped_column(
        ForeignKey("job_applications.id", ondelete="CASCADE"), index=True
    )
    action: Mapped[str] = mapped_column(String(500))
    stage: Mapped[str] = mapped_column(String(40))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )


class Task(StrictModel):
    id: str = Field(default_factory=identifier)
    text: str = Field(max_length=500)
    done: bool = False


class JobData(StrictModel):
    location: str = Field(default="", max_length=500)
    url: str = Field(default="", max_length=2000)
    salary_range: str = Field(default="", max_length=200)
    work_type: Literal["Remote", "Hybrid", "On-site", "Unspecified"] = "Unspecified"
    application_date: str = Field(default="", max_length=10)
    source: str = Field(default="", max_length=200)
    contact: str = Field(default="", max_length=1000)
    notes: str = Field(default="", max_length=30000)
    tags: list[str] = Field(default_factory=list, max_length=100)
    next_action: str = Field(default="", max_length=1000)
    deadline: str = Field(default="", max_length=10)
    job_description: str = Field(default="", max_length=50000)
    tasks: list[Task] = Field(default_factory=list, max_length=200)


class JobInput(StrictModel):
    company: str = Field(min_length=1, max_length=200)
    role: str = Field(min_length=1, max_length=200)
    status: Stage = "Interested"
    data: JobData = Field(default_factory=JobData)
    resume_id: str | None = None
    resume_version_id: str | None = None
    cover_letter_id: str | None = None
    revision: int = Field(default=1, ge=1)


class StageInput(StrictModel):
    status: Stage
    revision: int = Field(ge=1)


def serialize_job(j):
    return {
        "id": j.id,
        "company": j.company,
        "role": j.role,
        "status": j.status,
        "data": j.data,
        "resume_id": j.resume_id,
        "resume_version_id": j.resume_version_id,
        "cover_letter_id": j.cover_letter_id,
        "revision": j.revision,
        "created_at": iso(j.created_at),
        "updated_at": iso(j.updated_at),
    }


def require_job(db, id):
    j = db.get(JobApplication, id)
    if not j:
        raise HTTPException(404, "Application not found")
    return j


def validate_links(db, p):
    for model, id in [
        (Resume, p.resume_id),
        (ResumeVersion, p.resume_version_id),
        (CoverLetter, p.cover_letter_id),
    ]:
        if id and not db.get(model, id):
            raise HTTPException(422, "Linked document not found")
    if (
        p.resume_version_id
        and db.get(ResumeVersion, p.resume_version_id).resume_id != p.resume_id
    ):
        raise HTTPException(422, "Choose a version belonging to the selected resume")


def history(db, id, status, action):
    db.add(ApplicationHistory(application_id=id, stage=status, action=action))
    db.add(AuditEvent(action=action, entity_id=id))


router = APIRouter(prefix="/api/applications", tags=["Applications"])


@router.get("")
def listing(db: Session = Depends(session)):
    return [
        serialize_job(j)
        for j in db.scalars(
            select(JobApplication).order_by(JobApplication.updated_at.desc())
        )
    ]


@router.post("", status_code=201)
def create(p: JobInput, db: Session = Depends(session)):
    validate_links(db, p)
    j = JobApplication(**p.model_dump(exclude={"revision"}))
    db.add(j)
    db.flush()
    history(db, j.id, j.status, "Job Added")
    db.commit()
    return serialize_job(j)


@router.put("/{id}")
def edit(id: str, p: JobInput, db: Session = Depends(session)):
    j = require_job(db, id)
    old = j.status
    validate_links(db, p)
    values = p.model_dump()
    if p.status == "Applied" and not values["data"].get("application_date"):
        values["data"]["application_date"] = utcnow().date().isoformat()
    values["revision"] = p.revision + 1
    values["updated_at"] = utcnow()
    result = db.execute(
        update(JobApplication)
        .where(JobApplication.id == id, JobApplication.revision == p.revision)
        .values(**values)
    )
    if result.rowcount != 1:
        raise HTTPException(409, "Application changed. Reload before editing.")
    if old != p.status:
        history(db, id, p.status, f"Application Stage Changed: {old} → {p.status}")
    db.commit()
    return serialize_job(require_job(db, id))


@router.patch("/{id}/stage")
def move(id: str, p: StageInput, db: Session = Depends(session)):
    j = require_job(db, id)
    old = j.status
    data = dict(j.data)
    if p.status == "Applied" and not data.get("application_date"):
        data["application_date"] = utcnow().date().isoformat()
    result = db.execute(
        update(JobApplication)
        .where(JobApplication.id == id, JobApplication.revision == p.revision)
        .values(
            status=p.status, data=data, revision=p.revision + 1, updated_at=utcnow()
        )
    )
    if result.rowcount != 1:
        raise HTTPException(409, "Application changed. Refresh the board.")
    if old != p.status:
        history(db, id, p.status, f"Application Stage Changed: {old} → {p.status}")
    db.commit()
    return serialize_job(require_job(db, id))


@router.get("/{id}/history")
def timeline(id: str, db: Session = Depends(session)):
    require_job(db, id)
    return [
        {
            "id": h.id,
            "action": h.action,
            "stage": h.stage,
            "created_at": iso(h.created_at),
        }
        for h in db.scalars(
            select(ApplicationHistory)
            .where(ApplicationHistory.application_id == id)
            .order_by(ApplicationHistory.created_at)
        )
    ]


@router.delete("/{id}", status_code=204)
def remove(id: str, db: Session = Depends(session)):
    db.delete(require_job(db, id))
    db.commit()
