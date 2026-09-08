from copy import deepcopy
from datetime import date
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .analysis_models import Analysis
from .ats import document_text
from .dependencies import session
from .models import AuditEvent, identifier
from .profile import get_profile
from .profile_models import CareerItem
from .profile_schemas import StrictModel
from .resume_models import Resume
from .resumes import require_resume, serialize

SKILLS={name:[name] for name in ['Python','FastAPI','React','TypeScript','JavaScript','SQL','PyTorch','TensorFlow','Docker','Kubernetes','AWS','Azure','GCP','RAG','LangChain','Linux','Git','Java','C++','C#','Go','Rust','HTML','CSS','Figma','Tableau','Power BI','Excel','Pandas','NumPy','Spark','Kafka','Redis','MongoDB','PostgreSQL','MySQL','NLP','Computer Vision','Machine Learning','Deep Learning','Information Retrieval','Data Analysis','System Design','CI/CD','Terraform','GraphQL','REST','Node.js','Django','Flask','Mentoring','Leadership','Communication','Research','OCR','LLM Evaluation']}
SKILLS['Kubernetes'].append('K8s');SKILLS['PostgreSQL'].append('Postgres');SKILLS['JavaScript'].append('JS');SKILLS['TypeScript'].append('TS');SKILLS['RAG'].append('retrieval-augmented generation');SKILLS['NLP'].append('natural language processing')
RELATED={'Kubernetes':['Docker','Container orchestration'],'PyTorch':['TensorFlow'],'AWS':['Azure','GCP'],'PostgreSQL':['MySQL','SQL'],'TypeScript':['JavaScript'],'RAG':['Information Retrieval','NLP']}
STOP=set('with that this your from have will work team role engineer senior software required preferred years experience skills using about their they into ability strong working build develop knowledge company candidate responsibilities looking such including across through must should demonstrated our are and for the you who join'.split())
DEMO_JOB='''AI Engineer — Cedar Analytics (fictional)
Build reliable retrieval-augmented generation services for document workflows.
Required skills: Python, FastAPI, RAG, Docker, SQL.
Preferred skills: Kubernetes, PyTorch, AWS.
Responsibilities: Design retrieval evaluation pipelines, develop REST APIs, collaborate with product teams, and review production reliability.
Experience: 3+ years of software engineering experience.
Education: Bachelor degree in computer science or equivalent practical experience.'''


def has_term(text,term):return bool(re.search(r'(?<!\w)'+re.escape(term)+r'(?!\w)',text,re.I))


def extract_job(text,extra_skills=()):
    lexicon={**SKILLS,**{name:[name] for name in extra_skills if name not in SKILLS}}
    required=set();preferred=set();mode='required'
    for line in text.splitlines():
        if re.search(r'preferred|nice.to.have|bonus|desirable',line,re.I):mode='preferred'
        elif re.search(r'required|must.have|essential|responsibilities|experience:|education:',line,re.I):mode='required'
        found={name for name,aliases in lexicon.items() if any(has_term(line,alias) for alias in aliases)}
        (preferred if mode=='preferred' else required).update(found)
    preferred-=required
    years=[int(n) for n in re.findall(r'(\d+)\+?\s*(?:years|yrs)',text,re.I)]
    return {'required_skills':sorted(required),'preferred_skills':sorted(preferred),'responsibilities':[line.strip() for line in text.splitlines() if re.search(r'build|design|develop|lead|deliver|responsib',line,re.I)],'experience_years':min(years) if years else None,'education':[line.strip() for line in text.splitlines() if re.search(r'degree|bachelor|master|ph\.?d|education',line,re.I)],'keywords':sorted({word.lower() for word in re.findall(r'[A-Za-z][A-Za-z-]{3,}',text) if word.lower() not in STOP})[:80]}


def experience_years(doc):
    months=set();today=date.today()
    for sec in doc['sections']:
        if sec['kind']!='experience' or not sec['visible']:continue
        for item in sec['items']:
            d=item['data'];start=d.get('start_date','');end=today.isoformat() if d.get('current') else d.get('end_date','')
            try:
                sy=int(start[:4]);sm=int(start[5:7] or '1');ey=int(end[:4]);em=int(end[5:7] or '12')
                if not (1900<=sy<=ey<=today.year+1 and 1<=sm<=12 and 1<=em<=12):continue
                months.update(range(sy*12+sm,min(ey*12+em,today.year*12+today.month)+1))
            except (ValueError,TypeError):continue
    return round(len(months)/12,1)


def match_job(doc,text,items):
    job=extract_job(text,[i.data.get('name','') for i in items if i.kind=='skills'])
    resume_text=document_text(doc)
    sought=job['required_skills']+job['preferred_skills']
    matched=[name for name in sought if any(has_term(resume_text,alias) for alias in SKILLS.get(name,[name]))]
    missing=[name for name in sought if name not in matched]
    related=[{'skill':name,'existing':[alias for alias in RELATED.get(name,[]) if has_term(resume_text,alias)]} for name in missing]
    related=[r for r in related if r['existing']]
    keywords=job['keywords'];covered=[word for word in keywords if has_term(resume_text,word)]
    years=experience_years(doc)
    role_words={w.lower() for w in re.findall(r'\w+',text.splitlines()[0] if text.splitlines() else '') if w.lower() not in STOP}
    title=doc['personal'].get('professional_title','')
    components=[]
    def component(name,weight,score,applicable=True):components.append({'name':name,'weight':weight,'score':round(score*100),'applicable':applicable})
    component('Skill match',50,len(matched)/len(sought) if sought else 0,bool(sought))
    component('Keyword coverage',20,len(covered)/len(keywords) if keywords else 0,bool(keywords))
    component('Experience duration',15,min(1,years/job['experience_years']) if job['experience_years'] else 0,bool(job['experience_years']))
    component('Education evidence',10,1 if any(s['kind']=='education' and s['visible'] and s['items'] for s in doc['sections']) else 0,bool(job['education']))
    component('Role words',5,sum(has_term(title,w) for w in role_words)/len(role_words) if role_words else 0,bool(role_words))
    total=sum(c['weight'] for c in components if c['applicable'])
    score=round(sum(c['weight']*c['score'] for c in components if c['applicable'])/total) if total else 0
    suggestions=[]
    for item in items:
        evidence=str(item.data)
        terms=[term for term in sought if has_term(evidence,term)]
        education=item.kind=='education' and bool(job['education'])
        suggestions.append({'id':item.id,'kind':item.kind,'title':item.data.get('name') or item.data.get('position') or item.data.get('statement') or item.data.get('title') or item.data.get('institution') or item.kind,'terms':terms,'recommended':bool(terms) or education,'reason':'Existing profile evidence mentions '+', '.join(terms)+'.' if terms else 'Review this existing education record against the stated qualification requirement.' if education else 'Available in your profile. Include only if relevant to this role.'})
    return {'score':score,'components':components,'job':job,'matched':matched,'missing':missing,'related':related,'covered_keywords':covered,'experience_years':years,'suggestions':sorted(suggestions,key=lambda s:len(s['terms']),reverse=True),'disclaimer':'CareerCanvas-specific comparison, not a hiring prediction. Missing skills are gaps to review, not claims to add. Education checks presence only; experience duration does not establish seniority or relevance.'}

class MatchInput(StrictModel):description:str=Field(min_length=20,max_length=30000)
class TailorInput(MatchInput):
    selected_ids:list[str]=Field(max_length=1000)
    name:str=Field(min_length=1,max_length=150)
    target_role:str=Field(default='',max_length=200)
    approved:bool=False

router=APIRouter(prefix='/api',tags=['Job matching'])
@router.get('/demo/job')
def demo_job():return {'description':DEMO_JOB}

@router.post('/resumes/{resume_id}/match')
def run_match(resume_id:str,payload:MatchInput,db:Session=Depends(session)):
    resume=require_resume(db,resume_id);profile=get_profile(db);items=db.scalars(select(CareerItem).where(CareerItem.profile_id==profile.id)).all()
    result=match_job(resume.document,payload.description,items)
    db.add(Analysis(resume_id=resume.id,revision=resume.revision,kind='job_match',result={**result,'description':payload.description}));db.commit();return result

@router.post('/resumes/{resume_id}/tailor',status_code=201)
def tailor(resume_id:str,payload:TailorInput,db:Session=Depends(session)):
    if not payload.approved:raise HTTPException(422,'Review and approve the content selection before creating a copy')
    source=require_resume(db,resume_id);profile=get_profile(db);items=db.scalars(select(CareerItem).where(CareerItem.profile_id==profile.id,CareerItem.id.in_(payload.selected_ids))).all()
    if {i.id for i in items}!=set(payload.selected_ids):raise HTTPException(422,'Only existing profile content can be selected')
    doc=deepcopy(source.document)
    for section in doc['sections']:
        if section['kind']=='custom':continue
        section['items']=[i for i in section['items'] if i['source_id'] is None or i['source_id'] in payload.selected_ids]
        present={i['source_id'] for i in section['items']}
        for item in items:
            if item.kind==section['kind'] and item.id not in present:section['items'].append({'id':identifier(),'source_id':item.id,'kind':item.kind,'data':deepcopy(item.data)})
        section['visible']=bool(section['items'])
    resume=Resume(profile_id=profile.id,name=payload.name,target_role=payload.target_role,purpose='Specific Job',document=doc)
    db.add(resume);db.flush();db.add(AuditEvent(action='Tailored Resume Copy Created',entity_id=resume.id));db.commit();return serialize(resume)
