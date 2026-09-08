import re
from fastapi import APIRouter
from pydantic import Field
from .profile_schemas import StrictModel

ACTION_VERBS={'built','developed','designed','implemented','created','led','delivered','reduced','improved','increased','optimized','automated','launched','mentored','evaluated','published','researched','analyzed','managed','coordinated','established','migrated','integrated','trained','deployed','resolved','tested','supported'}

def assess_bullet(text:str):
    words=re.findall(r"[\w'-]+",text.lower())
    checks=[
        {'name':'Action verb','passed':bool(words and words[0] in ACTION_VERBS),'suggestion':'Begin with a clear action you actually took, such as Built, Designed, or Led.'},
        {'name':'Specific contribution','passed':len(words)>=7 and not re.search(r'^(worked on|responsible for|helped with)\b',text,re.I),'suggestion':'Explain what you delivered and the context in which it was used.'},
        {'name':'Result','passed':bool(re.search(r'\b(reduc\w*|improv\w*|increas\w*|sav\w*|enabl\w*|used by|result\w*|achiev\w*|accelerat\w*|deliver\w*)\b',text,re.I)),'suggestion':'Describe the real outcome or who benefited from the work.'},
        {'name':'Measurable outcome','passed':bool(re.search(r'\d|\b(one|two|three|four|five|six|seven|eight|nine|ten)\b',text,re.I)),'suggestion':'Add a number only if you can substantiate it. Qualitative impact is also valid.'},
    ]
    return {'score':sum(check['passed'] for check in checks)*25,'checks':checks,'disclaimer':'Writing heuristics only. Never invent a metric or contribution.'}

class BulletInput(StrictModel):
    text:str=Field(max_length=10000)

router=APIRouter(prefix='/api/analysis',tags=['Writing feedback'])
@router.post('/bullet')
def bullet_feedback(payload:BulletInput):return assess_bullet(payload.text)
