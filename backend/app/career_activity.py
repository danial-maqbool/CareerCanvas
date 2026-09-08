from datetime import datetime
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field, model_validator
from sqlalchemy import String, JSON, Integer, DateTime, ForeignKey, select, update
from sqlalchemy.orm import Mapped, mapped_column, Session
from .database import Base
from .dependencies import session
from .models import identifier, utcnow, iso, AuditEvent
from .profile_schemas import StrictModel
from .profile_models import CareerItem
from .applications import JobApplication, Task
CHECKLIST=['Research company','Review job description','Review resume','Prepare STAR examples','Technical topics','Questions to ask','Logistics']
class RecordMixin:
    id:Mapped[str]=mapped_column(String(36),primary_key=True,default=identifier)
    title:Mapped[str]=mapped_column(String(300))
    data:Mapped[dict]=mapped_column(JSON)
    revision:Mapped[int]=mapped_column(Integer,default=1)
    updated_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=utcnow)
class Interview(RecordMixin,Base):
    __tablename__='interviews'
    application_id:Mapped[str|None]=mapped_column(ForeignKey('job_applications.id',ondelete='SET NULL'),nullable=True,index=True)
class Contact(RecordMixin,Base):
    __tablename__='contacts'
    application_id:Mapped[str|None]=mapped_column(ForeignKey('job_applications.id',ondelete='SET NULL'),nullable=True,index=True)
class Story(RecordMixin,Base):__tablename__='star_stories'
class Question(RecordMixin,Base):__tablename__='interview_questions'
class Goal(RecordMixin,Base):__tablename__='career_goals'
class GoalData(StrictModel):
    target_date:str=Field(default='',max_length=10)
    progress:int=Field(default=0,ge=0,le=100)
    status:Literal['Active','Completed','Paused']='Active'
    milestones:list[Task]=Field(default_factory=list,max_length=100)
    tags:list[str]=Field(default_factory=list,max_length=100)
    notes:str=Field(default='',max_length=10000)
class InterviewData(StrictModel):
    company:str=Field(default='',max_length=200)
    role:str=Field(default='',max_length=200)
    round:str=Field(default='Screening',max_length=200)
    date:str=Field(default='',max_length=10)
    time:str=Field(default='',max_length=5)
    format:Literal['Video','Phone','On-site','Take-home']='Video'
    interviewers:str=Field(default='',max_length=2000)
    location:str=Field(default='',max_length=2000)
    notes:str=Field(default='',max_length=30000)
    status:Literal['Scheduled','Completed','Cancelled']='Scheduled'
    checklist:list[Task]=Field(default_factory=lambda:[Task(text=t) for t in CHECKLIST],max_length=100)
    story_ids:list[str]=Field(default_factory=list,max_length=100)
    question_ids:list[str]=Field(default_factory=list,max_length=100)
class ContactData(StrictModel):
    company:str=Field(default='',max_length=200)
    role:str=Field(default='',max_length=200)
    email:str=Field(default='',max_length=320)
    linkedin:str=Field(default='',max_length=2000)
    relationship:str=Field(default='',max_length=200)
    notes:str=Field(default='',max_length=30000)
    last_contact:str=Field(default='',max_length=10)
class StoryData(StrictModel):
    situation:str=Field(default='',max_length=10000)
    task:str=Field(default='',max_length=10000)
    action:str=Field(default='',max_length=10000)
    result:str=Field(default='',max_length=10000)
    skill_ids:list[str]=Field(default_factory=list,max_length=100)
    experience_ids:list[str]=Field(default_factory=list,max_length=100)
    achievement_ids:list[str]=Field(default_factory=list,max_length=100)
class QuestionData(StrictModel):
    category:Literal['Behavioral','Technical','System Design','AI / ML','Coding','Leadership','Company']='Behavioral'
    answer:str=Field(default='',max_length=30000)
    notes:str=Field(default='',max_length=10000)
MODELS={'goals':(Goal,GoalData),'interviews':(Interview,InterviewData),'contacts':(Contact,ContactData),'stories':(Story,StoryData),'questions':(Question,QuestionData)}
class RecordInput(StrictModel):
    title:str=Field(min_length=1,max_length=300)
    data:dict=Field(default_factory=dict)
    application_id:str|None=None
    revision:int=Field(default=1,ge=1)
def record_json(row):
    result={'id':row.id,'title':row.title,'data':row.data,'revision':row.revision,'updated_at':iso(row.updated_at)}
    if hasattr(row,'application_id'):result['application_id']=row.application_id
    return result
def model_for(kind):
    if kind not in MODELS:raise HTTPException(404,'Unknown collection')
    return MODELS[kind]
def validate_record(db,kind,p):
    model,schema=model_for(kind)
    try:data=schema.model_validate(p.data).model_dump()
    except ValueError as e:raise HTTPException(422,str(e))
    if p.application_id and (kind not in ['interviews','contacts'] or not db.get(JobApplication,p.application_id)):raise HTTPException(422,'Linked application not found')
    if kind=='stories':
        for field,item_kind in [('skill_ids','skills'),('experience_ids','experience'),('achievement_ids','achievements')]:
            for id in data[field]:
                item=db.get(CareerItem,id)
                if not item or item.kind!=item_kind:raise HTTPException(422,'Linked profile content not found')
    if kind=='interviews':
        for field,model in [('story_ids',Story),('question_ids',Question)]:
            if any(not db.get(model,id) for id in data[field]):raise HTTPException(422,'Linked preparation record not found')
    return data
router=APIRouter(prefix='/api/career',tags=['Interview preparation and contacts'])
@router.get('/{kind}')
def listing(kind:str,db:Session=Depends(session)):
    model,_=model_for(kind);return [record_json(r) for r in db.scalars(select(model).order_by(model.updated_at.desc()))]
@router.post('/{kind}',status_code=201)
def create(kind:str,p:RecordInput,db:Session=Depends(session)):
    model,_=model_for(kind);data=validate_record(db,kind,p);row=model(title=p.title,data=data)
    if hasattr(model,'application_id'):row.application_id=p.application_id
    db.add(row);db.flush();db.add(AuditEvent(action=f'{kind.title()} Added',entity_id=row.id));db.commit();return record_json(row)
@router.put('/{kind}/{id}')
def edit(kind:str,id:str,p:RecordInput,db:Session=Depends(session)):
    model,_=model_for(kind)
    if not db.get(model,id):raise HTTPException(404,'Record not found')
    values={'title':p.title,'data':validate_record(db,kind,p),'revision':p.revision+1,'updated_at':utcnow()}
    if hasattr(model,'application_id'):values['application_id']=p.application_id
    result=db.execute(update(model).where(model.id==id,model.revision==p.revision).values(**values))
    if result.rowcount!=1:raise HTTPException(409,'Record changed; reload before saving')
    db.commit();return record_json(db.get(model,id))
@router.delete('/{kind}/{id}',status_code=204)
def remove(kind:str,id:str,db:Session=Depends(session)):
    model,_=model_for(kind);row=db.get(model,id)
    if not row:raise HTTPException(404,'Record not found')
    if kind in ['stories','questions']:
        field='story_ids' if kind=='stories' else 'question_ids'
        for interview in db.scalars(select(Interview)):
            if id in interview.data.get(field,[]):interview.data={**interview.data,field:[x for x in interview.data[field] if x!=id]};interview.revision+=1
    db.delete(row);db.commit()
