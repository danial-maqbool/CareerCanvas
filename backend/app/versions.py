from copy import deepcopy
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field
from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    UniqueConstraint,
    func,
    select,
    update,
)
from sqlalchemy.orm import Mapped, Session, mapped_column

from .database import Base
from .dependencies import session
from .models import AuditEvent, identifier, utcnow, iso
from .profile_schemas import StrictModel
from .resume_models import Resume
from .resumes import require_resume, serialize


class ResumeVersion(Base):
    __tablename__ = "resume_versions"
    __table_args__ = (UniqueConstraint("resume_id", "number"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    resume_id: Mapped[str] = mapped_column(
        ForeignKey("resumes.id", ondelete="CASCADE"), index=True
    )
    number: Mapped[int] = mapped_column(Integer)
    note: Mapped[str] = mapped_column(String(1000), default="")
    snapshot: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )


class VersionInput(StrictModel):
    note: str = Field(default="", max_length=1000)
    revision: int = Field(ge=1)


def version_json(v):
    return {
        "id": v.id,
        "number": v.number,
        "note": v.note,
        "snapshot": v.snapshot,
        "created_at": iso(v.created_at),
    }


def capture(db, resume, note):
    number = (
        db.scalar(
            select(func.max(ResumeVersion.number)).where(
                ResumeVersion.resume_id == resume.id
            )
        )
        or 0
    ) + 1
    version = ResumeVersion(
        resume_id=resume.id,
        number=number,
        note=note,
        snapshot={
            "name": resume.name,
            "target_role": resume.target_role,
            "document": deepcopy(resume.document),
        },
    )
    db.add(version)
    db.flush()
    db.add(AuditEvent(action="Version Created", entity_id=resume.id))
    return version


def compare_values(before, after, path=""):
    if before == after:
        return []
    if isinstance(before, dict) and isinstance(after, dict):
        result = []
        for key in sorted(before.keys() | after.keys()):
            child = f"{path} / {key}" if path else key
            if key not in before:
                result.append(
                    {
                        "kind": "Added",
                        "path": child,
                        "before": None,
                        "after": after[key],
                    }
                )
            elif key not in after:
                result.append(
                    {
                        "kind": "Removed",
                        "path": child,
                        "before": before[key],
                        "after": None,
                    }
                )
            else:
                result.extend(compare_values(before[key], after[key], child))
        return result
    if (
        isinstance(before, list)
        and isinstance(after, list)
        and all(isinstance(i, dict) and "id" in i for i in before + after)
    ):
        left = {i["id"]: i for i in before}
        right = {i["id"]: i for i in after}
        result = []
        for key in dict.fromkeys([*left, *right]):
            item = right.get(key) or left[key]
            label = (
                item.get("heading")
                or item.get("text")
                or item.get("data", {}).get("name")
                or item.get("data", {}).get("position")
                or key
            )
            child = f"{path} / {str(label)[:80]}"
            if key not in left:
                result.append(
                    {
                        "kind": "Added",
                        "path": child,
                        "before": None,
                        "after": right[key],
                    }
                )
            elif key not in right:
                result.append(
                    {
                        "kind": "Removed",
                        "path": child,
                        "before": left[key],
                        "after": None,
                    }
                )
            else:
                result.extend(compare_values(left[key], right[key], child))
        if set(left) == set(right) and list(left) != list(right):
            result.append(
                {
                    "kind": "Modified",
                    "path": path + " / order",
                    "before": list(left),
                    "after": list(right),
                }
            )
        return result
    return [{"kind": "Modified", "path": path, "before": before, "after": after}]


router = APIRouter(prefix="/api/resumes", tags=["Version history"])


@router.get("/{resume_id}/versions")
def list_versions(resume_id: str, db: Session = Depends(session)):
    require_resume(db, resume_id)
    return [
        version_json(v)
        for v in db.scalars(
            select(ResumeVersion)
            .where(ResumeVersion.resume_id == resume_id)
            .order_by(ResumeVersion.number.desc())
        ).all()
    ]


@router.post("/{resume_id}/versions", status_code=201)
def create_version(
    resume_id: str, payload: VersionInput, db: Session = Depends(session)
):
    resume = require_resume(db, resume_id)
    if resume.revision != payload.revision:
        raise HTTPException(409, "Save or reload the latest resume before versioning")
    version = capture(db, resume, payload.note)
    db.commit()
    return version_json(version)


@router.get("/{resume_id}/versions/compare")
def compare_versions(
    resume_id: str, before: str, after: str, db: Session = Depends(session)
):
    a = db.get(ResumeVersion, before)
    b = db.get(ResumeVersion, after)
    if not a or not b or a.resume_id != resume_id or b.resume_id != resume_id:
        raise HTTPException(404, "Version not found for this resume")
    changes = compare_values(a.snapshot, b.snapshot)
    return {
        "before": a.number,
        "after": b.number,
        "changes": changes,
        "counts": {
            kind: sum(c["kind"] == kind for c in changes)
            for kind in ["Added", "Removed", "Modified"]
        },
    }


@router.post("/{resume_id}/versions/{version_id}/restore")
def restore_version(
    resume_id: str,
    version_id: str,
    payload: VersionInput,
    db: Session = Depends(session),
):
    resume = require_resume(db, resume_id)
    version = db.get(ResumeVersion, version_id)
    if not version or version.resume_id != resume_id:
        raise HTTPException(404, "Version not found for this resume")
    if resume.revision != payload.revision:
        raise HTTPException(409, "The resume changed; reload before restoring")
    capture(db, resume, f"Automatic safety copy before restoring v{version.number}")
    result = db.execute(
        update(Resume)
        .where(Resume.id == resume_id, Resume.revision == payload.revision)
        .values(
            document=deepcopy(version.snapshot["document"]),
            name=version.snapshot["name"],
            target_role=version.snapshot["target_role"],
            revision=payload.revision + 1,
            updated_at=utcnow(),
        )
    )
    if result.rowcount != 1:
        raise HTTPException(409, "The resume changed; reload before restoring")
    db.add(AuditEvent(action=f"Restored Version {version.number}", entity_id=resume.id))
    db.commit()
    return serialize(resume)
