from backend.app.job_matching import DEMO_JOB, extract_job
from backend.tests.test_resumes import make_resume

def test_job_extraction_categorizes_requirements_and_synonyms():
    job=extract_job(DEMO_JOB)
    assert 'Python' in job['required_skills']
    assert 'Kubernetes' in job['preferred_skills']
    assert job['experience_years']==3
    assert extract_job('Required: K8s and Postgres')['required_skills']==['Kubernetes','PostgreSQL']

def test_match_and_reviewed_tailoring_never_add_missing_skills(client):
    r=make_resume(client);path=f'/api/resumes/{r["id"]}'
    match=client.post(path+'/match',json={'description':DEMO_JOB}).json()
    assert 'Python' in match['matched'];assert 'Kubernetes' in match['missing']
    before=client.get(path).json()
    selected=[s['id'] for s in match['suggestions']]
    payload={'description':DEMO_JOB,'selected_ids':selected,'name':'Tailored AI Engineer'}
    assert client.post(path+'/tailor',json=payload).status_code==422
    result=client.post(path+'/tailor',json={**payload,'approved':True})
    assert result.status_code==201
    tailored=result.json();assert tailored['id']!=r['id']
    assert client.get(path).json()['document']==before['document']
    assert 'Kubernetes' not in str(tailored['document'])
    assert 'Kubernetes' not in str(client.get('/api/profile').json())
