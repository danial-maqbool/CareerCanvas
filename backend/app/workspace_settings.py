from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field
from sqlalchemy import String,Boolean,select
from sqlalchemy.orm import Mapped,mapped_column,Session
from .database import Base
from .dependencies import session
from .models import Setting,identifier,AuditEvent
from .profile_schemas import StrictModel
class Tag(Base):
    __tablename__='tags'
    id:Mapped[str]=mapped_column(String(36),primary_key=True,default=identifier)
    name:Mapped[str]=mapped_column(String(100),unique=True)
    color:Mapped[str]=mapped_column(String(7),default='#6b8b59')
    archived:Mapped[bool]=mapped_column(Boolean,default=False)
class TagInput(StrictModel):
    name:str=Field(min_length=1,max_length=100)
    color:str=Field(default='#6b8b59',pattern=r'^#[0-9a-fA-F]{6}$')
    archived:bool=False
class Widget(StrictModel):
    id:Literal['pipeline','next','interviews','followups','goals','performance','activity']
    visible:bool=True
    width:int=Field(default=1,ge=1,le=3)
class Preferences(StrictModel):
    theme:Literal['Light','Dark','System']='System'
    widgets:list[Widget]=Field(default_factory=lambda:[Widget(id=id,width=2 if id in ['pipeline','performance'] else 1) for id in ['pipeline','next','interviews','followups','goals','performance','activity']],max_length=7)
router=APIRouter(prefix='/api',tags=['Workspace preferences and tags'])
@router.get('/preferences')
def preferences(db:Session=Depends(session)):
    setting=db.get(Setting,'workspace');return setting.value if setting else Preferences().model_dump()
@router.put('/preferences')
def update_preferences(p:Preferences,db:Session=Depends(session)):
    if len({w.id for w in p.widgets})!=len(p.widgets):raise HTTPException(422,'Dashboard widget IDs must be unique')
    setting=db.get(Setting,'workspace')
    if not setting:setting=Setting(key='workspace');db.add(setting)
    setting.value=p.model_dump();db.commit();return setting.value
@router.get('/tags')
def tags(db:Session=Depends(session)):return [{'id':t.id,'name':t.name,'color':t.color,'archived':t.archived} for t in db.scalars(select(Tag).order_by(Tag.name))]
@router.post('/tags',status_code=201)
def create_tag(p:TagInput,db:Session=Depends(session)):
    if db.scalar(select(Tag).where(Tag.name==p.name)):raise HTTPException(409,'Tag name already exists')
    t=Tag(**p.model_dump());db.add(t);db.commit();return {'id':t.id,**p.model_dump()}
def replace_tag(db,old,new):
    from .applications import JobApplication
    from .career_activity import Goal
    from .profile_models import CareerItem
    for model in [JobApplication,Goal,CareerItem]:
        for row in db.scalars(select(model)):
            if old in row.data.get('tags',[]):
                tags=[new if t==old else t for t in row.data['tags'] if t!=old or new is not None];row.data={**row.data,'tags':list(dict.fromkeys(tags))}
                if hasattr(row,'revision'):row.revision+=1
@router.put('/tags/{id}')
def edit_tag(id:str,p:TagInput,db:Session=Depends(session)):
    t=db.get(Tag,id)
    if not t:raise HTTPException(404,'Tag not found')
    if db.scalar(select(Tag).where(Tag.name==p.name,Tag.id!=id)):raise HTTPException(409,'Tag name already exists')
    if p.name!=t.name:replace_tag(db,t.name,p.name)
    t.name=p.name;t.color=p.color;t.archived=p.archived;db.commit();return {'id':t.id,**p.model_dump()}
@router.delete('/tags/{id}',status_code=204)
def delete_tag(id:str,db:Session=Depends(session)):
    t=db.get(Tag,id)
    if not t:raise HTTPException(404,'Tag not found')
    replace_tag(db,t.name,None);db.delete(t);db.commit()
