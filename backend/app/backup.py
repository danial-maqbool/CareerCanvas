import json
from datetime import datetime
from typing import Literal
from fastapi import APIRouter,Depends,HTTPException
from fastapi.responses import Response
from pydantic import Field
from sqlalchemy import select,delete,DateTime,Integer,Boolean,String
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .dependencies import session
from .models import AuditEvent,Setting,utcnow,iso
from .config import ROOT
from .profile_models import CareerProfile,CareerItem
from .profile_schemas import StrictModel,PersonalDetails,ItemInput
from .resume_models import Resume
from .resume_schemas import ResumeDocument
from .resumes import serialize
from .versions import ResumeVersion
from .analysis_models import Analysis
from .cover_letters import CoverLetter,CoverVersion,LetterDocument
from .applications import JobApplication,ApplicationHistory,JobData
from .career_activity import Interview,Contact,Story,Question,Goal,MODELS
from .workspace_settings import Tag,TagInput,Preferences
MODELS_ORDER=[CareerProfile,CareerItem,Resume,ResumeVersion,Analysis,CoverLetter,CoverVersion,JobApplication,ApplicationHistory,Interview,Contact,Story,Question,Goal,Tag,AuditEvent,Setting]
TABLES={m.__tablename__:m for m in MODELS_ORDER}
class Backup(StrictModel):
    format:Literal['CareerCanvas Backup']
    version:Literal[1]
    created_at:str
    tables:dict[str,list[dict]]
class RestoreInput(StrictModel):
    backup:Backup
    approved:bool=False
class ResumeImport(StrictModel):
    format:Literal['CareerCanvas Resume']
    version:Literal[1]
    name:str=Field(min_length=1,max_length=150)
    purpose:str=Field(default='General Resume',max_length=100)
    target_role:str=Field(default='',max_length=200)
    document:ResumeDocument

def make_backup(db):
    tables={}
    for model in MODELS_ORDER:
        rows=[]
        for row in db.scalars(select(model)):
            if model==Setting and row.key!='workspace':continue
            rows.append({c.name:iso(getattr(row,c.name)) if isinstance(getattr(row,c.name),datetime) else getattr(row,c.name) for c in model.__table__.columns})
        tables[model.__tablename__]=rows
    return {'format':'CareerCanvas Backup','version':1,'created_at':iso(utcnow()),'tables':tables}

def validate_backup(backup):
    if set(backup.tables)!=set(TABLES):raise ValueError('Backup tables do not match this application version')
    if sum(len(r) for r in backup.tables.values())>100000:raise ValueError('Backup contains too many records')
    prepared={}
    for name,model in TABLES.items():
        columns={c.name:c for c in model.__table__.columns};rows=[];seen=set()
        for source in backup.tables[name]:
            if set(source)!=set(columns):raise ValueError(f'Unexpected fields in {name}')
            row=dict(source)
            for key,col in columns.items():
                value=row[key]
                if value is None:
                    if not col.nullable:raise ValueError(f'Missing {name}.{key}')
                    continue
                if isinstance(col.type,DateTime):row[key]=datetime.fromisoformat(value)
                elif isinstance(col.type,Boolean):
                    if not isinstance(value,bool):raise ValueError('Expected boolean')
                elif isinstance(col.type,Integer):
                    if not isinstance(value,int) or isinstance(value,bool):raise ValueError('Expected integer')
                elif isinstance(col.type,String):
                    if not isinstance(value,str) or col.type.length and len(value)>col.type.length:raise ValueError('Invalid text length')
            pk='key' if model==Setting else 'id'
            if not row[pk] or row[pk] in seen:raise ValueError(f'Duplicate or missing IDs in {name}')
            seen.add(row[pk])
            if model==CareerProfile:row['personal']=PersonalDetails.model_validate(row['personal']).model_dump()
            if model==CareerItem:row['data']=ItemInput(kind=row['kind'],data=row['data']).data
            if model==Resume:row['document']=ResumeDocument.model_validate(row['document']).model_dump()
            if model==ResumeVersion:ResumeDocument.model_validate(row['snapshot']['document'])
            if model==CoverLetter:row['document']=LetterDocument.model_validate(row['document']).model_dump()
            if model==CoverVersion:LetterDocument.model_validate(row['snapshot']['document'])
            if model==JobApplication:row['data']=JobData.model_validate(row['data']).model_dump()
            for _,(record,schema) in MODELS.items():
                if model==record:row['data']=schema.model_validate(row['data']).model_dump()
            if model==Tag:TagInput.model_validate({k:row[k] for k in ['name','color','archived']})
            if model==Setting:
                if row['key']!='workspace':raise ValueError('Only non-secret workspace preferences may be restored')
                row['value']=Preferences.model_validate(row['value']).model_dump()
            rows.append(row)
        prepared[name]=rows
    for name,model in TABLES.items():
        for column in model.__table__.columns:
            for fk in column.foreign_keys:
                target=fk.column.table.name;key=fk.column.name;ids={r[key] for r in prepared[target]}
                if any(r[column.name] is not None and r[column.name] not in ids for r in prepared[name]):raise ValueError(f'Broken relationship in {name}.{column.name}')
    if len(prepared['career_profiles'])>1:raise ValueError('This version supports one career profile')
    return prepared
router=APIRouter(prefix='/api/workspace',tags=['Private backup and restore'])
@router.get('/backup')
def backup(db:Session=Depends(session)):return Response(json.dumps(make_backup(db),ensure_ascii=False,indent=2),media_type='application/json',headers={'Content-Disposition':'attachment; filename="CareerCanvas-backup.json"','Cache-Control':'no-store'})
@router.post('/restore/preview')
def preview(p:Backup):
    try:rows=validate_backup(p)
    except (ValueError,KeyError,TypeError) as e:raise HTTPException(422,'Invalid backup: '+str(e)) from e
    return {'counts':{name:len(items) for name,items in rows.items()},'version':1}
@router.post('/restore')
def restore(p:RestoreInput,db:Session=Depends(session)):
    if not p.approved:raise HTTPException(422,'Review the restore preview and explicitly approve replacing the workspace')
    try:rows=validate_backup(p.backup)
    except (ValueError,KeyError,TypeError) as e:raise HTTPException(422,'Invalid backup: '+str(e)) from e
    safety=ROOT/'data'/'backups';safety.mkdir(parents=True,exist_ok=True);path=safety/('before-restore-'+utcnow().strftime('%Y%m%d-%H%M%S-%f')+'.json')
    path.write_text(json.dumps(make_backup(db),ensure_ascii=False,indent=2),encoding='utf-8')
    try:
        for model in reversed(MODELS_ORDER):db.execute(delete(model),execution_options={'synchronize_session':False})
        for model in MODELS_ORDER:
            if rows[model.__tablename__]:db.execute(model.__table__.insert(),rows[model.__tablename__])
        db.add(AuditEvent(action='Workspace Restored'));db.commit()
    except IntegrityError as e:db.rollback();raise HTTPException(422,'Backup constraints were invalid. The existing workspace was preserved.') from e
    return {'restored':True,'safety_backup':str(path),'counts':{k:len(v) for k,v in rows.items()}}
@router.post('/import-resume',status_code=201)
def import_resume(p:ResumeImport,db:Session=Depends(session)):
    row=Resume(name=p.name,purpose=p.purpose,target_role=p.target_role,document=p.document.model_dump());db.add(row);db.flush();db.add(AuditEvent(action='Resume Imported',entity_id=row.id));db.commit();return serialize(row)
