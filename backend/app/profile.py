from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .dependencies import session
from .models import AuditEvent, utcnow, iso
from .profile_models import CareerItem, CareerProfile
from .profile_schemas import ItemInput, PersonalDetails

router = APIRouter(prefix="/api/profile", tags=["Career Profile"])


def get_profile(db: Session):
    profile = db.scalar(select(CareerProfile))
    if profile is None:
        profile = CareerProfile(personal=PersonalDetails().model_dump())
        db.add(profile)
        db.commit()
    return profile


def serialize_item(item):
    return {
        "id": item.id,
        "kind": item.kind,
        "data": item.data,
        "updated_at": iso(item.updated_at),
    }


def completion(profile, items):
    checks = {
        "Add your name": bool(profile.personal.get("full_name")),
        "Add a professional title": bool(profile.personal.get("professional_title")),
        "Add an email": bool(profile.personal.get("email")),
        "Write a short introduction": bool(profile.personal.get("summary")),
        "Add experience or a project": any(
            i.kind in ("experience", "projects") for i in items
        ),
        "Add your skills": any(i.kind == "skills" for i in items),
    }
    return {
        "score": round(sum(checks.values()) / len(checks) * 100),
        "suggestions": [k for k, v in checks.items() if not v],
    }


@router.get("")
def read_profile(db: Session = Depends(session)):
    profile = get_profile(db)
    items = db.scalars(
        select(CareerItem)
        .where(CareerItem.profile_id == profile.id)
        .order_by(CareerItem.created_at)
    ).all()
    return {
        "id": profile.id,
        "personal": profile.personal,
        "items": [serialize_item(i) for i in items],
        "completion": completion(profile, items),
    }


@router.put("/personal")
def save_personal(payload: PersonalDetails, db: Session = Depends(session)):
    profile = get_profile(db)
    profile.personal = payload.model_dump()
    profile.updated_at = utcnow()
    db.commit()
    return profile.personal


@router.post("/items", status_code=201)
def create_item(payload: ItemInput, db: Session = Depends(session)):
    profile = get_profile(db)
    item = CareerItem(profile_id=profile.id, kind=payload.kind, data=payload.data)
    db.add(item)
    db.flush()
    db.add(AuditEvent(action=f"{payload.kind.title()} Added", entity_id=item.id))
    db.commit()
    return serialize_item(item)


@router.put("/items/{item_id}")
def update_item(item_id: str, payload: ItemInput, db: Session = Depends(session)):
    item = db.get(CareerItem, item_id)
    if item is None:
        raise HTTPException(404, "Career item not found")
    if item.kind != payload.kind:
        raise HTTPException(422, "A career item cannot change its type")
    item.data = payload.data
    db.commit()
    return serialize_item(item)


@router.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: str, db: Session = Depends(session)):
    item = db.get(CareerItem, item_id)
    if item is None:
        raise HTTPException(404, "Career item not found")
    from .career_activity import Story

    field = {
        "skills": "skill_ids",
        "experience": "experience_ids",
        "achievements": "achievement_ids",
    }.get(item.kind)
    if field:
        for story in db.scalars(select(Story)):
            if item_id in story.data.get(field, []):
                story.data = {
                    **story.data,
                    field: [id for id in story.data[field] if id != item_id],
                }
                story.revision += 1
    db.delete(item)
    db.add(AuditEvent(action="Career Item Deleted", entity_id=item_id))
    db.commit()
