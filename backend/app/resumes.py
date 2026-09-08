from copy import deepcopy

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from .dependencies import session
from .models import AuditEvent, identifier, utcnow
from .profile import get_profile
from .profile_models import CareerItem
from .resume_models import Resume
from .resume_schemas import CreateResume, ResumeDocument, ResumeItem, ResumeSection, UpdateResume

router = APIRouter(prefix='/api/resumes', tags=['Resumes'])
HEADINGS = {'experience':'Experience','education':'Education','projects':'Projects','skills':'Skills','certifications':'Certifications','publications':'Publications','achievements':'Achievements','languages':'Languages','references':'References','portfolio':'Portfolio'}


def serialize(resume):
    return {key: getattr(resume,key) for key in ['id','name','purpose','target_role','document','archived','primary','revision']} | {'updated_at': resume.updated_at.isoformat(), 'created_at': resume.created_at.isoformat()}


def require_resume(db, resume_id):
    resume = db.get(Resume, resume_id)
    if resume is None:
        raise HTTPException(404, 'Resume not found')
    return resume


@router.get('')
def list_resumes(db: Session = Depends(session)):
    return [serialize(r) for r in db.scalars(select(Resume).order_by(Resume.updated_at.desc())).all()]


@router.post('', status_code=201)
def create_resume(payload: CreateResume, db: Session = Depends(session)):
    profile = get_profile(db)
    items = db.scalars(select(CareerItem).where(CareerItem.profile_id == profile.id, CareerItem.id.in_(payload.selected_ids))).all()
    if {i.id for i in items} != set(payload.selected_ids):
        raise HTTPException(422, 'Selected content was not found in this career profile')
    sections = []
    for kind, heading in HEADINGS.items():
        selected = [ResumeItem(kind=i.kind, source_id=i.id, data=deepcopy(i.data)) for i in items if i.kind == kind]
        sections.append(ResumeSection(kind=kind, heading=heading, visible=bool(selected), items=selected))
    doc = ResumeDocument(personal=profile.personal, sections=sections, template=payload.template)
    resume = Resume(profile_id=profile.id, name=payload.name, purpose=payload.purpose, target_role=payload.target_role, document=doc.model_dump())
    db.add(resume)
    db.flush()
    db.add(AuditEvent(action='Resume Created', entity_id=resume.id))
    db.commit()
    return serialize(resume)


@router.get('/{resume_id}')
def read_resume(resume_id: str, db: Session = Depends(session)):
    return serialize(require_resume(db, resume_id))


@router.put('/{resume_id}')
def save_resume(resume_id: str, payload: UpdateResume, db: Session = Depends(session)):
    resume = require_resume(db, resume_id)
    old_name, old_template, old_archived = resume.name, resume.document['template'], resume.archived
    result = db.execute(update(Resume).where(Resume.id == resume_id, Resume.revision == payload.revision).values(name=payload.name, target_role=payload.target_role, archived=payload.archived, document=payload.document.model_dump(), revision=payload.revision + 1, updated_at=utcnow()))
    if result.rowcount != 1:
        raise HTTPException(409, 'This resume changed in another window. Reload before saving to avoid overwriting newer edits.')
    for changed, action in [(old_name != payload.name,'Resume Renamed'),(old_template != payload.document.template,'Template Changed'),(old_archived != payload.archived,'Resume Archived' if payload.archived else 'Resume Unarchived')]:
        if changed:
            db.add(AuditEvent(action=action, entity_id=resume_id))
    db.commit()
    db.expire_all()
    return serialize(require_resume(db,resume_id))


@router.post('/{resume_id}/duplicate', status_code=201)
def duplicate_resume(resume_id: str, db: Session = Depends(session)):
    source = require_resume(db, resume_id)
    resume = Resume(profile_id=source.profile_id, name=f'{source.name[:143]} (copy)', purpose=source.purpose, target_role=source.target_role, document=deepcopy(source.document))
    db.add(resume)
    db.flush()
    db.add(AuditEvent(action='Resume Duplicated', entity_id=resume.id))
    db.commit()
    return serialize(resume)


@router.post('/{resume_id}/primary')
def set_primary(resume_id: str, db: Session = Depends(session)):
    resume = require_resume(db, resume_id)
    if resume.archived:
        raise HTTPException(422, 'Unarchive this resume before making it primary')
    db.execute(update(Resume).values(primary=False))
    resume.primary = True
    db.commit()
    return serialize(resume)


@router.delete('/{resume_id}', status_code=204)
def delete_resume(resume_id: str, db: Session = Depends(session)):
    resume = require_resume(db, resume_id)
    db.delete(resume)
    db.add(AuditEvent(action='Resume Deleted', entity_id=resume_id))
    db.commit()
