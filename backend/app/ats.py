import re
from fastapi import APIRouter, Depends
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from .analysis_models import Analysis
from .dependencies import session
from .profile_schemas import StrictModel
from .resumes import require_resume

STANDARD={'experience','work experience','professional experience','education','skills','technical skills','projects','certifications','publications','achievements','awards','languages','references','portfolio','research','volunteering','leadership','courses','teaching'}

def document_text(doc):
    p=doc['personal'];hidden=p.get('hidden_fields',[])
    text=[str(value) for key,value in p.items() if key not in hidden and isinstance(value,str)]
    for section in doc['sections']:
        if not section['visible']:continue
        text.append(section['heading'])
        for item in section['items']:
            for key,value in item['data'].items():
                if key in {'notes','learning_notes','level','target_level','target_date','thumbnail','tags','category'}:continue
                if isinstance(value,str):text.append(value)
                elif isinstance(value,list):text.extend(str(v.get('text','')) if isinstance(v,dict) else str(v) for v in value)
    return '\n'.join(text)


def analyze_ats(doc,page_count=1):
    personal=doc['personal'];hidden=personal.get('hidden_fields',[]);sections=[s for s in doc['sections'] if s['visible']]
    kinds={s['kind'] for s in sections if s['items']}
    max_columns=max([2 if doc['template'] in ['Two Column','Creative','Executive'] else 1]+[s.get('columns',1) for s in sections])
    checks=[]
    def add(key,label,weight,passed,severity,message):checks.append({'key':key,'label':label,'weight':weight,'passed':bool(passed),'severity':severity,'message':message,'earned':weight if passed else 0})
    add('text','Structured text available',10,len(document_text(doc).strip())>30,'HIGH','Use real text for your contact details and career content. PDF export uses a selectable text layer.')
    add('headings','Standard section headings',10,all(s['heading'].strip().lower() in STANDARD for s in sections),'MEDIUM','Prefer recognizable headings such as Experience, Education, Skills, and Projects.')
    add('columns','Simple reading order',10,max_columns==1,'MEDIUM','Multiple columns may produce less predictable parsing. Consider a single-column template for ATS uploads.')
    add('images','Critical content is text',5,not doc.get('critical_content_in_images',False),'HIGH','Do not store essential qualifications or contact details only inside images.')
    add('email','Contact email present',15,'email' not in hidden and re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',personal.get('email','')),'HIGH','Add a valid, visible contact email.')
    add('phone','Contact phone present',5,'phone' not in hidden and len(re.sub(r'\D','',personal.get('phone','')))>=7,'MEDIUM','Add a visible phone number when appropriate for your application.')
    add('experience','Experience section populated',10,'experience' in kinds,'MEDIUM','Include relevant work experience when you have it. Projects can support an early-career application.')
    add('education','Education section populated',10,'education' in kinds,'MEDIUM','Include relevant education where it supports your application.')
    add('skills','Skills section populated',10,'skills' in kinds,'MEDIUM','Select skills you actually have from your career profile.')
    add('font','Readable body font',10,doc['style']['font_size']>=10,'MEDIUM','Use at least 10 pt for comfortable body-text reading.')
    add('pages','Reasonable page count',5,1<=page_count<=2,'LOW','Consider a focused one- or two-page resume. Longer academic CVs may be appropriate.')
    return {'score':sum(c['earned'] for c in checks),'checks':checks,'page_count':page_count,'columns':max_columns,'disclaimer':'CareerCanvas ATS Readiness Score is an application-specific heuristic. It is not a score returned by a real employer ATS.'}

class ATSInput(StrictModel):page_count:int=Field(ge=1,le=100)
router=APIRouter(prefix='/api/resumes',tags=['ATS readiness'])
@router.post('/{resume_id}/ats')
def run_ats(resume_id:str,payload:ATSInput,db:Session=Depends(session)):
    resume=require_resume(db,resume_id);result=analyze_ats(resume.document,payload.page_count)
    db.add(Analysis(resume_id=resume.id,revision=resume.revision,kind='ats',result=result));db.commit();return result

@router.get('/{resume_id}/ats')
def latest_ats(resume_id:str,db:Session=Depends(session)):
    resume=require_resume(db,resume_id)
    analysis=db.scalar(select(Analysis).where(Analysis.resume_id==resume.id,Analysis.revision==resume.revision,Analysis.kind=='ats').order_by(Analysis.created_at.desc()))
    return analysis.result if analysis else None
