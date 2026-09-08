import json
from fastapi import APIRouter,Depends,Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from .dependencies import session
from .resume_models import Resume
from .profile_models import CareerItem
from .applications import JobApplication
from .career_activity import MODELS
from .cover_letters import CoverLetter
router=APIRouter(prefix='/api',tags=['Local workspace search'])
@router.get('/search')
def search(q:str=Query(default='',max_length=200),db:Session=Depends(session)):
    query=q.strip().casefold()
    if not query:return []
    results=[]
    def add(kind,id,title,detail,data):
        if query in (title+' '+detail+' '+json.dumps(data,ensure_ascii=False)).casefold():results.append({'kind':kind,'id':id,'title':title,'detail':detail})
    for r in db.scalars(select(Resume)):add('resumes',r.id,r.name,r.target_role,r.document)
    for j in db.scalars(select(JobApplication)):add('applications',j.id,j.company+' · '+j.role,j.status,j.data)
    for i in db.scalars(select(CareerItem)):
        title=next((str(i.data[k]) for k in ['name','title','position','statement','language','institution'] if i.data.get(k)),'Career item');add('profile',i.id,title,i.kind,i.data)
    for kind,(model,_) in MODELS.items():
        for row in db.scalars(select(model)):add(kind,row.id,row.title,kind,row.data)
    for row in db.scalars(select(CoverLetter)):add('cover-letters',row.id,row.name,'Cover letter',row.document)
    return results[:60]
